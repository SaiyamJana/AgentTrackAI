// task.controller.js
import { Task }            from "../models/Task.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { Notification }    from "../models/Notification.js";
import { TaskAssignment }  from "../models/TaskAssignment.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";
import { computePersonalHours } from "../services/workloadCalculation.service.js";
// ── Chat integration ─────────────────────────────────────────────────────────
import { Conversation }         from "../models/Conversation.js";
import { syncTaskGroupMembers } from "../socket/chatPermissions.js";
import { getIO }                from "../socket/socket.js";

async function isProjectManager(projectId, userId) {
  const assignment = await EmployeeProject.findOne({
    projectId,
    employeeId: userId,
    projectRole: "manager",
    isActive: true,
  });
  return !!assignment;
}

/*
 * recalculateEqualContributions
 * After a member is added or removed, reset all contributions to equal splits
 * and recalculate estimatedPersonalHours for each assignment.
 * Only resets assignments where contributionPercentage was null (equal-split default).
 * Manager-set explicit values are preserved.
 */
async function recalculateEqualContributions(taskId, estimatedHours) {
  const assignments = await TaskAssignment.find({ taskId });
  const count = assignments.length;
  if (count === 0) return;

  const nullCount = assignments.filter(a => a.contributionPercentage === null).length;
  if (nullCount === 0) return; // all are explicit — don't touch

  const equalShare = 100 / count;

  for (const a of assignments) {
    if (a.contributionPercentage === null) {
      a.estimatedPersonalHours = computePersonalHours(estimatedHours, equalShare, count);
      await a.save();
    }
  }
}

// POST /api/v1/tasks  (manager / sub-manager / admin)
export const createTask = asyncHandler(async (req, res) => {
  const {
    projectId, title, description, subManagerId, priority,
    deadline, estimatedHours, tags,
    // NEW workload fields (optional — all have defaults)
    complexityScore,
  } = req.body;

  if (!projectId || !title || !subManagerId || !deadline)
    throw new ApiError(400, "projectId, title, subManagerId, deadline are required");

  const project = await Project.findById(projectId);
  if(!project){
    throw new ApiError(404, "Project not found");
  }

  //role check
  if(req.user.role !== "admin"){
    const manager = await isProjectManager(projectId , req.user._id);
  
    if(!manager){
      throw new ApiError(403, "Only project manager or admin can create tasks");
    }
  }

  //sub-manager belongs to project
    const subManagerAssignment = await EmployeeProject.findOne({
      projectId,
      employeeId : subManagerId,
      isActive : true,
    });
  
    if(!subManagerAssignment){
      throw new ApiError(400 , "Sub-manager must be assigned to this project");
    }
  
    if ( subManagerAssignment.employeeId.toString() === project.managerId.toString()) {
      throw new ApiError(
        400,
        "Project manager cannot be task sub-manager"
      );
    }
  
    //date validity
    if(new Date(deadline) > new Date(project.endDate)){
      throw new ApiError(400 , "Deadline cannot exceed project end date");
    }
  
    //create task
    const task = await Task.create({
      projectId, 
      companyId : req.user.companyId,
      title,
      description,
      subManagerId,
      teamMembers : [],
      assignedBy : req.user._id,
      priority,
      deadline,
      estimatedHours,
      tags,
      //workload fields
      complexityScore: complexityScore ?? 5, // default to 5 if not provided
    });

    task._performedBy = req.user._id;
    await task.save();
  
    //sub-manager task relation
    await TaskAssignment.create({
      taskId : task._id,
      employeeId : subManagerId,
      assignedBy : req.user._id,
    });

  // ── Notify the assigned employee (i.e sub-manager) about the new task ─────────────────────────────
  await Notification.create({
    userId: subManagerId,
    companyId: req.user.companyId,
    type: "task_assigned",
    title: "New Task Assigned",
    message: `You've been assigned a new task: "${title}" on project "${project.title}" as a sub-manager.`,
    relatedEntity: { type: "task", id: task._id },
    read: false,
  });

  const populatedTask = await Task.findById(task._id)
    .populate("subManagerId", "name email")
    .populate("teamMembers", "name email")
    .populate("assignedBy", "name email")
    .populate("projectId", "title");

  // ── Auto-create task group chat ──────────────────────────────────────────
  // Non-blocking: chat failure must never break task creation.
  try {
    const existingTaskConv = await Conversation.findOne({ type: "task_group", taskId: task._id });
    if (!existingTaskConv) {
      const memberSet = new Set([
        String(task.subManagerId),
        String(project.managerId),
      ]);
      const taskConv = await Conversation.create({
        companyId: task.companyId,
        type:      "task_group",
        name:      `${task.title} — Task Chat`,
        members:   [...memberSet],
        projectId: task.projectId,
        taskId:    task._id,
      });
      const io = getIO();
      if (io) {
        for (const memberId of memberSet) {
          io.to(`user:${memberId}`).emit("conv:new", taskConv);
        }
      }
    }
  } catch (chatErr) {
    console.error("[Chat] Task group creation failed (non-fatal):", chatErr.message);
  }

  return res.status(201).json(new ApiResponse(201, populatedTask, "Task created successfully"));
});

export const addTaskMembers = asyncHandler(async (req, res) => {
  const { employeeIds } = req.body;

  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0)
    throw new ApiError(400, "employeeIds must be a non-empty array");

  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  if (req.user.role !== "admin") {
    const manager = await isProjectManager(task.projectId, req.user._id);
    if (!manager) throw new ApiError(403, "Only project manager or admin can add members to task");
  }

  const addedMembers = [];
  const uniqueEmployeeIds = [...new Set(employeeIds)];

  for (const employeeId of uniqueEmployeeIds) {
    if (employeeId.toString() === task.subManagerId.toString())
      throw new ApiError(400, "Sub-manager is already assigned to the task and cannot be added as a team member");

    const projectEmployee = await EmployeeProject.findOne({
      projectId: task.projectId,
      employeeId,
      isActive: true,
    });
    if (!projectEmployee)
      throw new ApiError(400, `Employee ${employeeId} is not assigned to the project`);

    if (!task.teamMembers.some(id => id.toString() === employeeId.toString()))
      task.teamMembers.push(employeeId);

    const existingAssignment = await TaskAssignment.findOne({ taskId: task._id, employeeId });
    if (!existingAssignment) {
      await TaskAssignment.create({
        taskId: task._id,
        employeeId,
        assignedBy: req.user._id,
        contributionPercentage: null, // equal split — recalculated below
        estimatedPersonalHours: null,
      });
      addedMembers.push(employeeId);
    }
  }
  task._performedBy = req.user._id;
  task._memberActionType = "added";
  await task.save();

  // Recalculate equal-split estimatedPersonalHours for assignments with null contribution
  await recalculateEqualContributions(task._id, task.estimatedHours);

  for (const memberId of addedMembers) {
    await Notification.create({
      userId: memberId,
      companyId: req.user.companyId,
      type: "task_member_added",
      title: "Added to Task",
      message: `You've been added as a team member to task "${task.title}".`,
      relatedEntity: { type: "task", id: task._id },
      read: false,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, { taskId: task._id, addedMembers }, "Members added to task successfully")
  );

  // Sync task group chat membership (non-blocking)
  syncTaskGroupMembers(task._id).catch((e) =>
    console.error("[Chat] syncTaskGroupMembers (add) failed:", e.message)
  );
});

export const removeTaskMembers = asyncHandler(async (req, res) => {
  const { id: taskId, employeeId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  if (req.user.role !== "admin") {
    const manager = await isProjectManager(task.projectId, req.user._id);
    if (!manager) throw new ApiError(403, "Only project manager or admin can remove task members");
  }

  if (task.subManagerId.toString() === employeeId.toString())
    throw new ApiError(400, "Cannot remove sub-manager from task");

  task.teamMembers = task.teamMembers.filter(
    member => member.toString() !== employeeId.toString()
  );
  task._performedBy = req.user._id;
  task._memberActionType = "removed";

  await task.save();

  const existingAssignment = await TaskAssignment.findOne({ taskId, employeeId });
  if (!existingAssignment) throw new ApiError(404, "Employee is not assigned to this task");

  await TaskAssignment.deleteOne({ taskId, employeeId });

  // Recalculate equal-split contributions after removal
  await recalculateEqualContributions(taskId, task.estimatedHours);

  await Notification.create({
    userId: employeeId,
    companyId: req.user.companyId,
    type: "task_member_removed",
    title: "Removed from Task",
    message: `You've been removed from task "${task.title}".`,
    relatedEntity: { type: "task", id: task._id },
    read: false,
  });

  // Sync task group chat membership (non-blocking)
  syncTaskGroupMembers(taskId).catch((e) =>
    console.error("[Chat] syncTaskGroupMembers (remove) failed:", e.message)
  );

  return res.status(200).json(new ApiResponse(200, {}, "Task Member removed Successfully"));
});

// GET /api/v1/tasks?projectId=  (manager / sub-manager / admin)
export const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId, status, priority } = req.query;
  if (!projectId) throw new ApiError(400, "projectId query param is required");

  if (req.user.role !== "admin") {
    const assignment = await EmployeeProject.findOne({
      projectId,
      employeeId: req.user._id,
      isActive: true,
    });
    if (!assignment) throw new ApiError(403, "You are not assigned to this project");
  }

  const filter = { projectId };
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate("subManagerId", "name email department")
    .populate("teamMembers", "name email")
    .populate("assignedBy", "name email")
    .populate("projectId", "title status")
    .sort({ deadline: 1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched"));
});

// GET /api/v1/tasks/kanban?projectId=
export const getKanbanTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) throw new ApiError(400, "projectId is required");

  if (req.user.role !== "admin") {
    const assignment = await EmployeeProject.findOne({
      projectId,
      employeeId: req.user._id,
      isActive: true,
    });
    if (!assignment) throw new ApiError(403, "You are not assigned to this project");
  }

  const tasks = await Task.find({ projectId })
    .populate("subManagerId", "name email")
    .populate("teamMembers", "name email")
    .populate("assignedBy", "name email")
    .lean();

  return res.status(200).json(new ApiResponse(200, {
    pending:        tasks.filter(t => t.status === "pending"),
    "in-progress":  tasks.filter(t => t.status === "in-progress"),
    completed:      tasks.filter(t => t.status === "completed"),
  }, "Kanban tasks fetched"));
});

// GET /api/v1/tasks/my
export const getMyTasks = asyncHandler(async (req, res) => {
  const assignments = await TaskAssignment.find({ employeeId: req.user._id }).select("taskId");
  const taskIds     = assignments.map(a => a.taskId);

  const tasks = await Task.find({ _id: { $in: taskIds } })
    .populate("projectId", "title status")
    .populate("subManagerId", "name email")
    .sort({ deadline: 1 });

  return res.status(200).json(new ApiResponse(200, tasks, "My tasks fetched successfully"));
});

// GET /api/v1/tasks/:id
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("subManagerId", "name email")
    .populate("teamMembers", "name email")
    .populate("assignedBy", "name email")
    .populate("projectId", "title")
    .lean();
  if (!task) throw new ApiError(404, "Task not found");

  const assignment = await TaskAssignment.findOne({
    taskId: task._id,
    employeeId: req.user._id,
  });
  const isTaskMember = !!assignment;

  if (req.user.role !== "admin") {
    const projectId     = task.projectId?._id || task.projectId;
    const projectAssignment = await EmployeeProject.findOne({
      projectId,
      employeeId: req.user._id,
      isActive: true,
    });
    if (!isTaskMember && projectAssignment?.projectRole !== "manager")
      throw new ApiError(403, "Access denied");
  }

  return res.status(200).json(new ApiResponse(200, task, "Task details fetched"));
});

export const getTaskMembers = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  if (req.user.role !== "admin") {
    const manager = await isProjectManager(task.projectId, req.user._id);
    if (!manager) throw new ApiError(403, "Only project manager or admin can view task members");
  }

  const assignments = await TaskAssignment.find({ taskId: task._id })
    .populate("employeeId", "name email");

  return res.status(200).json(new ApiResponse(200, assignments.map(a => a.employeeId), "Task members fetched"));
});

export const getTaskAssignments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  if (req.user.role !== "admin") {
    const manager = await isProjectManager(task.projectId, req.user._id);
    if (!manager) throw new ApiError(403, "Only project manager or admin can view assignments");
  }

  const assignments = await TaskAssignment.find({ taskId: req.params.id })
    .populate("employeeId", "name email");

  return res.status(200).json(new ApiResponse(200, assignments, "Assignments fetched"));
});

// PATCH /api/v1/tasks/:id
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  if (req.user.role !== "admin") {
    const manager = await isProjectManager(task.projectId, req.user._id);
    if (!manager) throw new ApiError(403, "Only project manager can update task");
  }

  const { title, description, priority, deadline, estimatedHours, tags, complexityScore } = req.body;
  const updates = {};

  if (title          !== undefined) updates.title          = title;
  if (description    !== undefined) updates.description    = description;
  if (priority       !== undefined) updates.priority       = priority;
  if (deadline       !== undefined) updates.deadline       = deadline;
  if (estimatedHours !== undefined) updates.estimatedHours = estimatedHours;
  if (tags           !== undefined) updates.tags           = tags;
  // NEW: allow updating complexityScore
  if (complexityScore !== undefined) {
    if (complexityScore < 1 || complexityScore > 10)
      throw new ApiError(400, "complexityScore must be between 1 and 10");
    updates.complexityScore = complexityScore;
  }

  if (deadline) {
    const project = await Project.findById(task.projectId);
    if (new Date(deadline) > new Date(project.endDate))
      throw new ApiError(400, "Deadline cannot exceed project end date");
  }

  const updated = await Task.findByIdAndUpdate(
  req.params.id,
  updates,
  {
    new: true,
    runValidators: true,
    _performedBy: req.user._id, // custom field to track who performed the update
  }
  ).populate("subManagerId","name email").populate("projectId","title");

  // If estimatedHours changed, recalculate estimatedPersonalHours for null-contribution assignments
  if (estimatedHours !== undefined) {
    await recalculateEqualContributions(task._id, estimatedHours);
  }

  const recipients = new Set();
  recipients.add(task.subManagerId.toString());
  task.teamMembers.forEach(memberId => recipients.add(memberId.toString()));

  for (const userId of recipients) {
    await Notification.create({
      userId,
      companyId: req.user.companyId,
      type: "task_updated",
      title: "Task Updated",
      message: `Task "${updated.title}" has been updated.`,
      relatedEntity: { type: "task", id: task._id },
      read: false,
    });
  }

  return res.status(200).json(new ApiResponse(200, updated, "Task updated"));
});

// DELETE /api/v1/tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  if (req.user.role !== "admin") {
    const manager = await isProjectManager(task.projectId, req.user._id);
    if (!manager) throw new ApiError(403, "Only project manager can delete task");
  }

  await TaskAssignment.deleteMany({
    taskId: task._id,
  });

  await Task.findByIdAndDelete({_id: req.params.id} , {_performedBy: req.user._id});

  // ── Archive task group chat ──────────────────────────────────────────────
  // Conversation + message history are preserved for audit purposes; the
  // conversation is just hidden from active lists via isActive = false.
  // Non-blocking — chat failure must never break task deletion.
  try {
    await Conversation.findOneAndUpdate(
      { type: "task_group", taskId: task._id },
      { isActive: false }
    );
  } catch (chatErr) {
    console.error("[Chat] Task group archive failed (non-fatal):", chatErr.message);
  }

  const recipients = new Set();
  recipients.add(task.subManagerId.toString());
  task.teamMembers.forEach(memberId => recipients.add(memberId.toString()));

  for (const userId of recipients) {
    await Notification.create({
      userId,
      companyId: req.user.companyId,
      type: "task_deleted",
      title: "Task Deleted",
      message: `Task "${task.title}" has been deleted.`,
      relatedEntity: { type: "task", id: task._id },
      read: false,
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Task deleted"));
});

/*
 * updateAssignmentProgress — MODIFIED
 * Added workload hooks:
 *  - Sets assignment.startedAt on first non-zero progress update
 *  - Sets assignment.completedAt when completionPercentage reaches 100
 *  - Sets task.startedAt when any assignment first goes in-progress
 *  - Sets task.completedAt when task status reaches "completed"
 */
export const updateAssignmentProgress = asyncHandler(async (req, res) => {
  const { completionPercentage, actualHours } = req.body;
  const taskId = req.params.id;

  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const assignment = await TaskAssignment.findOne({
    taskId,
    employeeId: req.user._id,
  });
  if (!assignment) throw new ApiError(403, "You are not assigned to this task");

  if (completionPercentage !== undefined) {
    if (typeof completionPercentage !== "number" || completionPercentage < 0 || completionPercentage > 100)
      throw new ApiError(400, "completionPercentage must be a number between 0 and 100");
    assignment.completionPercentage = completionPercentage;
  }

  if (actualHours !== undefined) {
    if (typeof actualHours !== "number" || actualHours < 0)
      throw new ApiError(400, "actualHours must be a non-negative number");
    assignment.actualHours = actualHours;
  }

  // Auto status
  if (assignment.completionPercentage === 100) {
    assignment.status = "completed";
  } else if (assignment.completionPercentage > 0) {
    assignment.status = "in-progress";
  } else {
    assignment.status = "pending";
  }

  // ── WORKLOAD HOOKS: stamp timestamps ──────────────────────────────────────
  const now = new Date();

  // Set assignment.startedAt on first non-zero progress
  if (assignment.completionPercentage > 0 && !assignment.startedAt) {
    assignment.startedAt = now;
  }
  // Set assignment.completedAt when done
  if (assignment.completionPercentage === 100 && !assignment.completedAt) {
    assignment.completedAt = now;
  }

  await assignment.save();

  // Recalculate overall task progress
  const allAssignments  = await TaskAssignment.find({ taskId });
  const totalCompletion = allAssignments.reduce((sum, a) => sum + (a.completionPercentage || 0), 0);
  const overallProgress = allAssignments.length ? totalCompletion / allAssignments.length : 0;
  const totalActualHours = allAssignments.reduce((sum, a) => sum + (a.actualHours || 0), 0);

  const previousTaskStatus = task.status;
  task.completionPercentage = Math.round(overallProgress);
  task.actualHours          = totalActualHours;

  if (overallProgress === 100) {
    task.status = "completed";
  } else if (overallProgress > 0) {
    task.status = "in-progress";
  } else {
    task.status = "pending";
  }

  // ── WORKLOAD HOOKS: task-level timestamps ─────────────────────────────────
  // Set task.startedAt when first assignment goes in-progress
  if (task.status === "in-progress" && !task.startedAt) {
    task.startedAt = now;
  }
  // Set task.completedAt when task is done
  if (task.status === "completed" && !task.completedAt) {
    task.completedAt = now;
  }

  // ── _performedBy + completion flag tags added so Task.js can auto-log task_completed ──
  task._performedBy = req.user._id;
  task._statusJustCompleted = (previousTaskStatus !== "completed" && task.status === "completed");
  await task.save();

  //due to task progress change , project progress might also change — we can trigger a project progress recalculation here if needed (not implemented in this snippet)

  const projectTasks = await Task.find({ projectId: task.projectId });

  const totalProjectProgress = projectTasks.reduce((sum, t) => sum + (t.completionPercentage || 0), 0);

  const overallProjectProgress = projectTasks.length ? totalProjectProgress / projectTasks.length : 0;


  const project = await Project.findById(task.projectId);

  const previousProjectProgress = project.progressPercentage;

  project.progressPercentage = Math.round(overallProjectProgress);

  // ── Tags used by Project.js activity-log hook ──
  project._performedBy = req.user._id;
  project._justCompleted =
  previousProjectProgress < 100 &&
  Math.round(overallProjectProgress) === 100;

  await project.save();
  // ── Notify the project manager about the project progress update ─────────────────────────────
  // Notify the task sub-manager about the task progress update

  const notifications = [];

  if (task.subManagerId.toString() !== req.user._id.toString()) {
    notifications.push(Notification.create({
      userId:    task.subManagerId,
      companyId: req.user.companyId,
      type:      "task_progress_updated",
      title:     "Task Progress Updated",
      message:   `${req.user.name} updated progress on "${task.title}" to ${assignment.completionPercentage}%`,
      relatedEntity: { type: "task", id: task._id },
      read: false,
    }));
  }

  if (project.managerId.toString() !== req.user._id.toString()) {
    notifications.push(Notification.create({
      userId:    project.managerId,
      companyId: req.user.companyId,
      type:      "task_progress_updated",
      title:     "Task Progress Updated",
      message:   `${req.user.name} updated progress on "${task.title}" to ${assignment.completionPercentage}%`,
      relatedEntity: { type: "task", id: task._id },
      read: false,
    }));
  }

  if (previousTaskStatus !== "completed" && task.status === "completed") {
    const completionRecipients = new Set([
      project.managerId.toString(),
      task.subManagerId.toString(),
    ]);
    for (const userId of completionRecipients) {
      notifications.push(Notification.create({
        userId,
        companyId: req.user.companyId,
        type:      "task_completed",
        title:     "Task Completed",
        message:   `Task "${task.title}" has been completed.`,
        relatedEntity: { type: "task", id: task._id },
        read: false,
      }));
    }
  }

  if (previousProjectProgress < 100 && overallProjectProgress === 100) {
    const { Company } = await import("../models/Company.js");
    const company = await Company.findById(req.user.companyId).lean();

    const projectCompletionRecipients = new Set([project.managerId.toString()]);
    if (company?.adminId) projectCompletionRecipients.add(company.adminId.toString());

    for (const userId of projectCompletionRecipients) {
      notifications.push(Notification.create({
        userId,
        companyId: req.user.companyId,
        type:      "project_completed",
        title:     "Project Completed",
        message:   `Project "${project.title}" has been completed.`,
        relatedEntity: { type: "project", id: project._id },
        read: false,
      }));
    }
  }

  await Promise.all(notifications);

  return res.status(200).json(new ApiResponse(200, {
    assignment,
    taskProgress:    task.completionPercentage,
    projectProgress: Math.round(overallProjectProgress),
  }, "Progress updated"));
});
