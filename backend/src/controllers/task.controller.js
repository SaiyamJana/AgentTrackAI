import { Task }            from "../models/Task.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/**
 * Helper — returns true if the requester is authorised to manage tasks
 * for the given project.  Authorised = main manager OR sub-manager of
 * this specific project.
 *
 * PDF Phase 3 Step 6: "The main Manager, or the newly appointed
 * Sub-Manager, breaks the project down into atomic work units."
 */
async function isAuthorisedTaskManager(project, userId) {
    if (project.managerId.toString() === userId.toString()) return true;

    const subManager = await EmployeeProject.findOne({
        projectId:   project._id,
        employeeId:  userId,
        projectRole: "sub-manager",
        isActive:    true,
    });
    return !!subManager;
}

// POST /api/v1/tasks  (Manager or Sub-Manager)
export const createTask = asyncHandler(async (req, res) => {
    const { projectId, title, description, assignedTo, priority, deadline, estimatedHours, tags } = req.body;

    if (!projectId || !title || !assignedTo || !deadline) {
        throw new ApiError(400, "projectId, title, assignedTo, deadline are required");
    }

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (!(await isAuthorisedTaskManager(project, req.user._id))) {
        throw new ApiError(403, "Only the project manager or a sub-manager can create tasks");
    }

    // Verify assignee is on this project
    const assignment = await EmployeeProject.findOne({
        projectId,
        employeeId: assignedTo,
        isActive: true,
    });
    if (!assignment) {
        throw new ApiError(400, "Employee is not assigned to this project");
    }

    if (new Date(deadline) > new Date(project.endDate)) {
        throw new ApiError(400, "Deadline cannot exceed project end date");
    }

    const task = await Task.create({
        projectId,
        companyId:      req.user.companyId,
        title, description, priority, deadline, estimatedHours, tags,
        assignedTo,
        assignedBy:     req.user._id,   // records whether main manager or sub-manager created it
    });

    return res.status(201).json(new ApiResponse(201, task, "Task created successfully"));
});

// GET /api/v1/tasks?projectId=...  (Manager or Sub-Manager)
export const getTasksByProject = asyncHandler(async (req, res) => {
    const { projectId, status, priority } = req.query;
    if (!projectId) throw new ApiError(400, "projectId query param is required");

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (!(await isAuthorisedTaskManager(project, req.user._id))) {
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

// GET /api/v1/tasks/kanban?projectId=...  (Manager or Sub-Manager)
export const getKanbanTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) throw new ApiError(400, "projectId is required");

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (!(await isAuthorisedTaskManager(project, req.user._id))) {
        throw new ApiError(403, "Access denied");
    }

    const tasks = await Task.find({ projectId })
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .lean();

    const kanban = {
        pending:       tasks.filter(t => t.status === "pending"),
        "in-progress": tasks.filter(t => t.status === "in-progress"),
        completed:     tasks.filter(t => t.status === "completed"),
    };

    return res.status(200).json(new ApiResponse(200, kanban, "Kanban tasks fetched successfully"));
});

// GET /api/v1/tasks/:id  (Manager / Sub-Manager / Employee — scoped)
export const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email")
        .lean();

    if (!task) throw new ApiError(404, "Task not found");

    if (req.user.role === "employee" &&
        task.assignedTo._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }

    return res.status(200).json(new ApiResponse(200, task, "Task fetched successfully"));
});

// PATCH /api/v1/tasks/:id  (Manager or Sub-Manager — metadata update)
export const updateTask = asyncHandler(async (req, res) => {
    const { title, description, priority, deadline, estimatedHours, tags } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    const project = await Project.findById(task.projectId);
    if (!(await isAuthorisedTaskManager(project, req.user._id))) {
        throw new ApiError(403, "Access denied");
    }

    const updated = await Task.findByIdAndUpdate(
        req.params.id,
        { title, description, priority, deadline, estimatedHours, tags },
        { new: true, runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Task updated successfully"));
});

// DELETE /api/v1/tasks/:id  (Manager or Sub-Manager)
export const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    const project = await Project.findById(task.projectId);
    if (!(await isAuthorisedTaskManager(project, req.user._id))) {
        throw new ApiError(403, "Access denied");
    }

    await Task.findByIdAndDelete(req.params.id);

    return res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully"));
});

/**
 * GET /api/v1/tasks/my  (Employee)
 *
 * PDF Phase 3 Step 7: Employee views their assigned tasks.
 * Works for tasks assigned by main Manager OR Sub-Manager.
 */
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

// PATCH /api/v1/tasks/:id/status  (Employee)
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

    // Recalculate project progress
    await recalculateProjectProgress(task.projectId);

    return res.status(200).json(new ApiResponse(200, task, "Task status updated successfully"));
});

// PATCH /api/v1/tasks/:id/progress  (Employee)
export const updateTaskProgress = asyncHandler(async (req, res) => {
    const { actualHours, completionPercentage } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) throw new ApiError(404, "Task not found");

    if (task.assignedTo.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own tasks");
    }

    if (actualHours           !== undefined) task.actualHours           = actualHours;
    if (completionPercentage  !== undefined) task.completionPercentage  = completionPercentage;
    await task.save();

    await recalculateProjectProgress(task.projectId);

    return res.status(200).json(new ApiResponse(200, task, "Task progress updated successfully"));
});

// ── Internal helper ───────────────────────────────────────────────────────────
async function recalculateProjectProgress(projectId) {
    const tasks = await Task.find({ projectId }).select("completionPercentage").lean();
    if (!tasks.length) return;
    const avg = tasks.reduce((sum, t) => sum + (t.completionPercentage || 0), 0) / tasks.length;
    await Project.findByIdAndUpdate(projectId, { progressPercentage: Math.round(avg) });
}
