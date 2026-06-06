import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ActivityLog } from "../models/activityLogs.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ACTIVITY_ACTIONS } from "../utils/constants.js";

// ─── Helper: log activity ────────────────────────────────────────────────────
const logActivity = async (userId, action, entityId, details = "") => {
    await ActivityLog.create({
        userId,
        action,
        entityType: "Task",
        entityId,
        details,
    });
};

// ─── Helper: recalculate & persist project progress ─────────────────────────
const syncProjectProgress = async (projectId) => {
    const tasks = await Task.find({ projectId });
    if (!tasks.length) return;
    const avg =
        tasks.reduce((sum, t) => sum + (t.completionPercentage || 0), 0) /
        tasks.length;
    await Project.findByIdAndUpdate(projectId, {
        progressPercentage: Math.round(avg),
    });
};

// ────────────────────────────────────────────────────────────────────────────
// POST /api/v1/tasks
// Manager only — create a task inside a project
// ────────────────────────────────────────────────────────────────────────────
export const createTask = asyncHandler(async (req, res) => {
    const {
        projectId,
        title,
        description,
        assignedTo,
        priority,
        deadline,
        estimatedHours,
    } = req.body;

    if (!projectId || !title || !assignedTo) {
        throw new ApiError(400, "projectId, title, and assignedTo are required");
    }

    // Ensure project exists and this manager owns it
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (
        req.user.role === "manager" &&
        project.managerId.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, "You are not the manager of this project");
    }

    // Ensure the assignee is actually on this project
    const membership = await EmployeeProject.findOne({
        projectId,
        employeeId: assignedTo,
    });
    if (!membership) {
        throw new ApiError(
            400,
            "The assigned employee is not a member of this project"
        );
    }

    const task = await Task.create({
        projectId,
        title,
        description,
        assignedTo,
        assignedBy: req.user._id,
        priority: priority || "medium",
        deadline,
        estimatedHours: estimatedHours || 0,
    });

    await logActivity(
        req.user._id,
        ACTIVITY_ACTIONS.TASK_CREATED,
        task._id,
        `Task "${title}" created in project ${project.title}`
    );

    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tasks
// Admin → all tasks
// Manager → tasks in their projects
// Employee → tasks assigned to them
// Query params: projectId, status, priority, assignedTo, page, limit
// ────────────────────────────────────────────────────────────────────────────
export const getTasks = asyncHandler(async (req, res) => {
    const { projectId, status, priority, assignedTo, page = 1, limit = 20 } =
        req.query;

    const filter = {};

    if (req.user.role === "employee") {
        // Employees only see their own tasks
        filter.assignedTo = req.user._id;
    } else if (req.user.role === "manager") {
        // Find all project IDs managed by this manager
        const managerProjects = await Project.find({
            managerId: req.user._id,
        }).select("_id");
        const projectIds = managerProjects.map((p) => p._id);

        if (projectId) {
            if (!projectIds.some((id) => id.toString() === projectId)) {
                throw new ApiError(403, "Access denied to this project");
            }
            filter.projectId = projectId;
        } else {
            filter.projectId = { $in: projectIds };
        }

        if (assignedTo) filter.assignedTo = assignedTo;
    } else {
        // Admin
        if (projectId) filter.projectId = projectId;
        if (assignedTo) filter.assignedTo = assignedTo;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
        Task.find(filter)
            .populate("projectId", "title status")
            .populate("assignedTo", "name email designation")
            .populate("assignedBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Task.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            tasks,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        })
    );
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tasks/:taskId
// ────────────────────────────────────────────────────────────────────────────
export const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid task ID");
    }

    const task = await Task.findById(taskId)
        .populate("projectId", "title status managerId")
        .populate("assignedTo", "name email department designation")
        .populate("assignedBy", "name email");

    if (!task) throw new ApiError(404, "Task not found");

    // Access control
    if (req.user.role === "employee") {
        if (task.assignedTo._id.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }
    } else if (req.user.role === "manager") {
        if (task.projectId.managerId.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }
    }

    return res.status(200).json(new ApiResponse(200, task));
});

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/tasks/:taskId
// Manager → can edit all fields
// Employee → can only update status, completionPercentage, actualHours
// ────────────────────────────────────────────────────────────────────────────
export const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid task ID");
    }

    const task = await Task.findById(taskId).populate(
        "projectId",
        "title managerId"
    );
    if (!task) throw new ApiError(404, "Task not found");

    const { role, _id: userId } = req.user;

    let allowedFields;

    if (role === "employee") {
        if (task.assignedTo.toString() !== userId.toString()) {
            throw new ApiError(403, "You can only update your own tasks");
        }
        allowedFields = ["status", "completionPercentage", "actualHours"];
    } else if (role === "manager") {
        if (task.projectId.managerId.toString() !== userId.toString()) {
            throw new ApiError(403, "Access denied");
        }
        allowedFields = [
            "title",
            "description",
            "assignedTo",
            "priority",
            "status",
            "deadline",
            "estimatedHours",
            "actualHours",
            "completionPercentage",
        ];
    } else {
        // Admin
        allowedFields = [
            "title",
            "description",
            "assignedTo",
            "priority",
            "status",
            "deadline",
            "estimatedHours",
            "actualHours",
            "completionPercentage",
        ];
    }

    const updates = {};
    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (!Object.keys(updates).length) {
        throw new ApiError(400, "No valid fields provided for update");
    }

    // Auto-set status to completed when completionPercentage reaches 100
    if (updates.completionPercentage === 100) {
        updates.status = "completed";
    }

    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updates },
        { new: true, runValidators: true }
    )
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name email");

    // Determine log action
    const action =
        updates.status === "completed"
            ? ACTIVITY_ACTIONS.TASK_COMPLETED
            : ACTIVITY_ACTIONS.TASK_UPDATED;

    await logActivity(
        userId,
        action,
        taskId,
        `Task "${updatedTask.title}" updated — fields: ${Object.keys(updates).join(", ")}`
    );

    // Sync project progress percentage
    await syncProjectProgress(task.projectId._id);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/tasks/:taskId
// Manager (owner) or Admin only
// ────────────────────────────────────────────────────────────────────────────
export const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid task ID");
    }

    const task = await Task.findById(taskId).populate(
        "projectId",
        "managerId title"
    );
    if (!task) throw new ApiError(404, "Task not found");

    if (req.user.role === "manager") {
        if (task.projectId.managerId.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }
    }

    await Task.findByIdAndDelete(taskId);

    // Re-sync project progress after deletion
    await syncProjectProgress(task.projectId._id);

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Task deleted successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tasks/project/:projectId
// All tasks for a specific project (with board-friendly grouping)
// ────────────────────────────────────────────────────────────────────────────
export const getTasksByProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, "Invalid project ID");
    }

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (req.user.role === "manager") {
        if (project.managerId.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }
    }

    const tasks = await Task.find({ projectId })
        .populate("assignedTo", "name email designation")
        .populate("assignedBy", "name email")
        .sort({ priority: -1, deadline: 1 });

    // Group into Kanban columns
    const board = {
        pending: tasks.filter((t) => t.status === "pending"),
        "in-progress": tasks.filter((t) => t.status === "in-progress"),
        completed: tasks.filter((t) => t.status === "completed"),
    };

    return res.status(200).json(
        new ApiResponse(200, {
            projectId,
            projectTitle: project.title,
            total: tasks.length,
            board,
        })
    );
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tasks/my-tasks
// Employee — their own tasks with upcoming deadline sorting
// ────────────────────────────────────────────────────────────────────────────
export const getMyTasks = asyncHandler(async (req, res) => {
    const { status, priority } = req.query;

    const filter = { assignedTo: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
        .populate("projectId", "title status endDate")
        .populate("assignedBy", "name")
        .sort({ deadline: 1, priority: -1 });

    // Stats summary for the employee dashboard
    const stats = {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "pending").length,
        inProgress: tasks.filter((t) => t.status === "in-progress").length,
        completed: tasks.filter((t) => t.status === "completed").length,
        overdue: tasks.filter(
            (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed"
        ).length,
    };

    return res.status(200).json(new ApiResponse(200, { tasks, stats }));
});

// ────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/tasks/:taskId/reassign
// Manager only — reassign task to another employee on the same project
// ────────────────────────────────────────────────────────────────────────────
export const reassignTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) throw new ApiError(400, "assignedTo is required");

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid task ID");
    }

    const task = await Task.findById(taskId).populate(
        "projectId",
        "managerId title"
    );
    if (!task) throw new ApiError(404, "Task not found");

    if (task.projectId.managerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }

    // Ensure new assignee is a member of the project
    const membership = await EmployeeProject.findOne({
        projectId: task.projectId._id,
        employeeId: assignedTo,
    });
    if (!membership) {
        throw new ApiError(
            400,
            "The new assignee is not a member of this project"
        );
    }

    task.assignedTo = assignedTo;
    await task.save();

    await logActivity(
        req.user._id,
        ACTIVITY_ACTIONS.TASK_UPDATED,
        taskId,
        `Task "${task.title}" reassigned to employee ${assignedTo}`
    );

    const updated = await Task.findById(taskId)
        .populate("assignedTo", "name email designation")
        .populate("assignedBy", "name email");

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Task reassigned successfully"));
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/v1/tasks/stats/overview
// Manager/Admin — aggregate task stats (used by manager dashboard KPIs)
// ────────────────────────────────────────────────────────────────────────────
export const getTaskStatsOverview = asyncHandler(async (req, res) => {
    let projectIds;

    if (req.user.role === "manager") {
        const projects = await Project.find({
            managerId: req.user._id,
        }).select("_id");
        projectIds = projects.map((p) => p._id);
    }

    const matchStage =
        req.user.role === "manager"
            ? { projectId: { $in: projectIds } }
            : {};

    const stats = await Task.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ]);

    const now = new Date();
    const overdueCount = await Task.countDocuments({
        ...matchStage,
        deadline: { $lt: now },
        status: { $ne: "completed" },
    });

    const result = {
        pending: 0,
        "in-progress": 0,
        completed: 0,
        overdue: overdueCount,
    };

    stats.forEach(({ _id, count }) => {
        result[_id] = count;
    });

    result.total = result.pending + result["in-progress"] + result.completed;

    return res.status(200).json(new ApiResponse(200, result));
});
