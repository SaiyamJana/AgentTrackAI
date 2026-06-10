import { Task }            from "../models/Task.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/*
 * getProjectRole — returns the caller's projectRole on a given project,
 * or null if not assigned.  Admin returns "admin".
 */
async function getProjectRole(userId, userRole, projectId) {
    if (userRole === "admin") return "admin";
    const ep = await EmployeeProject.findOne({
        projectId,
        employeeId: userId,
        isActive: true,
    });
    return ep ? ep.projectRole : null;
}

// POST /api/v1/tasks  (project manager or sub-manager)
export const createTask = asyncHandler(async (req, res) => {
    const { projectId, title, description, assignedTo, priority, deadline, estimatedHours, tags } = req.body;

    if (!projectId || !title || !assignedTo || !deadline) {
        throw new ApiError(400, "projectId, title, assignedTo, deadline are required");
    }

    const callerRole = await getProjectRole(req.user._id, req.user.role, projectId);
    if (!["admin", "manager", "sub-manager"].includes(callerRole)) {
        throw new ApiError(403, "Only the project manager or a sub-manager can create tasks");
    }

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    // Assignee must be on the project
    const assigneeEP = await EmployeeProject.findOne({
        projectId,
        employeeId: assignedTo,
        isActive: true,
    });
    if (!assigneeEP) throw new ApiError(400, "Assigned employee is not on this project");

    if (new Date(deadline) > new Date(project.endDate)) {
        throw new ApiError(400, "Deadline cannot exceed project end date");
    }

    const task = await Task.create({
        projectId,
        companyId:  req.user.companyId,
        title, description, priority, deadline, estimatedHours, tags,
        assignedTo,
        assignedBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

// GET /api/v1/tasks?projectId=...  (manager or sub-manager)
export const getTasksByProject = asyncHandler(async (req, res) => {
    const { projectId, status, priority } = req.query;
    if (!projectId) throw new ApiError(400, "projectId is required");

    const callerRole = await getProjectRole(req.user._id, req.user.role, projectId);
    if (!["admin", "manager", "sub-manager"].includes(callerRole)) {
        throw new ApiError(403, "Access denied");
    }

    const filter = { projectId };
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
        .populate("assignedTo", "name email department")
        .populate("assignedBy", "name email")
        .sort({ deadline: 1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

// GET /api/v1/tasks/kanban?projectId=...  (manager or sub-manager)
export const getKanbanTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) throw new ApiError(400, "projectId is required");

    const callerRole = await getProjectRole(req.user._id, req.user.role, projectId);
    if (!["admin", "manager", "sub-manager"].includes(callerRole)) {
        throw new ApiError(403, "Access denied");
    }

    const tasks = await Task.find({ projectId })
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .lean();

    const kanban = {
        pending:        tasks.filter(t => t.status === "pending"),
        "in-progress":  tasks.filter(t => t.status === "in-progress"),
        completed:      tasks.filter(t => t.status === "completed"),
    };

    return res.status(200).json(new ApiResponse(200, kanban, "Kanban tasks fetched successfully"));
});

// GET /api/v1/tasks/my  (any employee — their own tasks)
export const getMyTasks = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = { assignedTo: req.user._id };
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
        .populate("projectId",  "title status")
        .populate("assignedBy", "name email")
        .sort({ deadline: 1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, tasks, "My tasks fetched successfully"));
});

// GET /api/v1/tasks/:id  (manager/sub-manager or the assigned employee)
export const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .lean();
    if (!task) throw new ApiError(404, "Task not found");

    const callerRole = await getProjectRole(req.user._id, req.user.role, task.projectId);
    const isAssignee = task.assignedTo._id.toString() === req.user._id.toString();

    if (!["admin", "manager", "sub-manager"].includes(callerRole) && !isAssignee) {
        throw new ApiError(403, "Access denied");
    }

    return res.status(200).json(new ApiResponse(200, task, "Task fetched successfully"));
});

// PATCH /api/v1/tasks/:id  (manager or sub-manager — metadata)
export const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    const callerRole = await getProjectRole(req.user._id, req.user.role, task.projectId);
    if (!["admin", "manager", "sub-manager"].includes(callerRole)) {
        throw new ApiError(403, "Access denied");
    }

    const { title, description, priority, deadline, estimatedHours, tags } = req.body;
    const updated = await Task.findByIdAndUpdate(
        req.params.id,
        { title, description, priority, deadline, estimatedHours, tags },
        { new: true, runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Task updated successfully"));
});

// DELETE /api/v1/tasks/:id  (manager or sub-manager)
export const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    const callerRole = await getProjectRole(req.user._id, req.user.role, task.projectId);
    if (!["admin", "manager", "sub-manager"].includes(callerRole)) {
        throw new ApiError(403, "Access denied");
    }

    await Task.findByIdAndDelete(req.params.id);
    return res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully"));
});

// PATCH /api/v1/tasks/:id/status  (assigned employee)
export const updateTaskStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!status) throw new ApiError(400, "status is required");

    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    if (task.assignedTo.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own tasks");
    }

    task.status = status;
    if (status === "completed") task.completionPercentage = 100;
    await task.save();

    await recalcProgress(task.projectId);

    return res.status(200).json(new ApiResponse(200, task, "Task status updated"));
});

// PATCH /api/v1/tasks/:id/progress  (assigned employee)
export const updateTaskProgress = asyncHandler(async (req, res) => {
    const { actualHours, completionPercentage } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    if (task.assignedTo.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own tasks");
    }

    if (actualHours           !== undefined) task.actualHours          = actualHours;
    if (completionPercentage  !== undefined) task.completionPercentage = completionPercentage;
    await task.save();

    await recalcProgress(task.projectId);
    return res.status(200).json(new ApiResponse(200, task, "Task progress updated"));
});

async function recalcProgress(projectId) {
    const tasks = await Task.find({ projectId }).select("completionPercentage").lean();
    if (!tasks.length) return;
    const avg = tasks.reduce((s, t) => s + (t.completionPercentage || 0), 0) / tasks.length;
    await Project.findByIdAndUpdate(projectId, { progressPercentage: Math.round(avg) });
}
