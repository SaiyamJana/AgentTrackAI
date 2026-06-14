import { Task }            from "../models/Task.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

// Returns the caller's projectRole, or "admin" for admins, or null if not assigned
async function getProjectRole(userId, userRole, projectId) {
  if (userRole === "admin") return "admin";
  const ep = await EmployeeProject.findOne({ projectId, employeeId: userId, isActive: true });
  return ep ? ep.projectRole : null;
}

async function recalcProgress(projectId) {
  const tasks = await Task.find({ projectId }).select("completionPercentage").lean();
  if (!tasks.length) return;
  const avg = tasks.reduce((s, t) => s + (t.completionPercentage || 0), 0) / tasks.length;
  await Project.findByIdAndUpdate(projectId, { progressPercentage: Math.round(avg) });
}

// POST /api/v1/tasks  (manager / sub-manager / admin)
export const createTask = asyncHandler(async (req, res) => {
  const { projectId, title, description, assignedTo, priority, deadline, estimatedHours, tags } = req.body;

  if (!projectId || !title || !assignedTo || !deadline)
    throw new ApiError(400, "projectId, title, assignedTo, deadline are required");

  const role = await getProjectRole(req.user._id, req.user.role, projectId);
  if (!["admin", "manager", "sub-manager"].includes(role))
    throw new ApiError(403, "Only project manager or sub-manager can create tasks");

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  // Assignee must be on this project
  const assigneeEP = await EmployeeProject.findOne({ projectId, employeeId: assignedTo, isActive: true });
  if (!assigneeEP) throw new ApiError(400, "Assigned employee is not on this project");

  if (deadline && new Date(deadline) > new Date(project.endDate))
    throw new ApiError(400, "Deadline cannot exceed project end date");

  const task = await Task.create({
    projectId,
    companyId:  req.user.companyId,
    title, description, priority, deadline, estimatedHours, tags,
    assignedTo,
    assignedBy: req.user._id,
  });

  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .populate("projectId",  "title")
    .lean();

  return res.status(201).json(new ApiResponse(201, populated, "Task created successfully"));
});

// GET /api/v1/tasks?projectId=  (manager / sub-manager / admin)
export const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId, status, priority } = req.query;
  if (!projectId) throw new ApiError(400, "projectId query param is required");

  const role = await getProjectRole(req.user._id, req.user.role, projectId);
  if (!["admin", "manager", "sub-manager"].includes(role))
    throw new ApiError(403, "Access denied");

  const filter = { projectId };
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate("assignedTo", "name email department")
    .populate("assignedBy", "name email")
    .populate("projectId",  "title status")
    .sort({ deadline: 1 })
    .lean();

  // Return flat array — frontend reads res.data directly
  return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched"));
});

// GET /api/v1/tasks/kanban?projectId=  (manager / sub-manager / admin)
export const getKanbanTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) throw new ApiError(400, "projectId is required");

  const role = await getProjectRole(req.user._id, req.user.role, projectId);
  if (!["admin", "manager", "sub-manager"].includes(role))
    throw new ApiError(403, "Access denied");

  const tasks = await Task.find({ projectId })
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .lean();

  return res.status(200).json(new ApiResponse(200, {
    pending:       tasks.filter(t => t.status === "pending"),
    "in-progress": tasks.filter(t => t.status === "in-progress"),
    completed:     tasks.filter(t => t.status === "completed"),
  }, "Kanban tasks fetched"));
});

// GET /api/v1/tasks/my  (any employee — their own assigned tasks)
export const getMyTasks = asyncHandler(async (req, res) => {
  const { status, priority } = req.query;
  const filter = { assignedTo: req.user._id };
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate("projectId",  "title status")
    .populate("assignedBy", "name email")
    .sort({ deadline: 1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, tasks, "My tasks fetched"));
});

// GET /api/v1/tasks/:id  (manager/sub-manager or the assigned employee)
export const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .populate("projectId",  "title")
    .lean();
  if (!task) throw new ApiError(404, "Task not found");

  const role      = await getProjectRole(req.user._id, req.user.role, task.projectId?._id ?? task.projectId);
  const isAssignee = task.assignedTo?._id?.toString() === req.user._id.toString();
  if (!["admin","manager","sub-manager"].includes(role) && !isAssignee)
    throw new ApiError(403, "Access denied");

  return res.status(200).json(new ApiResponse(200, task, "Task fetched"));
});

// PATCH /api/v1/tasks/:id  (manager / sub-manager — metadata update)
export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const role = await getProjectRole(req.user._id, req.user.role, task.projectId);
  if (!["admin","manager","sub-manager"].includes(role))
    throw new ApiError(403, "Access denied");

  const { title, description, priority, deadline, estimatedHours, tags } = req.body;
  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    { title, description, priority, deadline, estimatedHours, tags },
    { new: true, runValidators: true }
  ).populate("assignedTo","name email").populate("projectId","title");

  return res.status(200).json(new ApiResponse(200, updated, "Task updated"));
});

// DELETE /api/v1/tasks/:id  (manager / sub-manager)
export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, "Task not found");

  const role = await getProjectRole(req.user._id, req.user.role, task.projectId);
  if (!["admin","manager","sub-manager"].includes(role))
    throw new ApiError(403, "Access denied");

  await Task.findByIdAndDelete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Task deleted"));
});

// PATCH /api/v1/tasks/:id/status  (assigned employee only)
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError(400, "status is required");

  const task = await Task.findById(req.params.id);
  if (!task)   throw new ApiError(404, "Task not found");
  if (task.assignedTo.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only update your own tasks");

  task.status = status;
  if (status === "completed") task.completionPercentage = 100;
  await task.save();
  await recalcProgress(task.projectId);

  return res.status(200).json(new ApiResponse(200, task, "Status updated"));
});

// PATCH /api/v1/tasks/:id/progress  (assigned employee only)
export const updateTaskProgress = asyncHandler(async (req, res) => {
  const { actualHours, completionPercentage } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task)   throw new ApiError(404, "Task not found");
  if (task.assignedTo.toString() !== req.user._id.toString())
    throw new ApiError(403, "You can only update your own tasks");

  if (actualHours          !== undefined) task.actualHours          = actualHours;
  if (completionPercentage !== undefined) task.completionPercentage = completionPercentage;
  await task.save();
  await recalcProgress(task.projectId);

  return res.status(200).json(new ApiResponse(200, task, "Progress updated"));
});
