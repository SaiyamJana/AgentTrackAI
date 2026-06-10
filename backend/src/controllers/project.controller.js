import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/*
 * POST /api/v1/projects  (Admin only)
 *
 * Admin creates a project. managerId is required at creation —
 * Admin must have already assigned (or will assign) one of the
 * registered employees as the manager.  We also create the
 * EmployeeProject record for the manager here atomically.
 */
export const createProject = asyncHandler(async (req, res) => {
    const { title, description, managerId, priority, startDate, endDate, tags } = req.body;

    if (!title || !managerId || !startDate || !endDate) {
        throw new ApiError(400, "title, managerId, startDate, endDate are required");
    }
    if (new Date(endDate) < new Date(startDate)) {
        throw new ApiError(400, "endDate must be after startDate");
    }

    // managerId must be a registered employee of this company
    const { User } = await import("../models/User.js");
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== "employee") {
        throw new ApiError(404, "Manager must be a registered employee of your company");
    }
    if (manager.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Employee does not belong to your company");
    }

    const project = await Project.create({
        title, description, priority, startDate, endDate, tags,
        companyId: req.user.companyId,
        managerId,
    });

    // Create the EmployeeProject record for the manager
    await EmployeeProject.create({
        projectId:   project._id,
        employeeId:  managerId,
        companyId:   req.user.companyId,
        assignedBy:  req.user._id,
        projectRole: "manager",
    });

    return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});

// GET /api/v1/projects  (Admin sees all; manager sees only theirs)
export const getAllProjects = asyncHandler(async (req, res) => {
    const { status } = req.query;
    let projectIds;

    if (req.user.role === "employee") {
        // Employee acting as manager — find via EmployeeProject
        const managed = await EmployeeProject.find({
            employeeId:  req.user._id,
            projectRole: "manager",
            isActive:    true,
        }).select("projectId").lean();
        projectIds = managed.map(m => m.projectId);
    }

    const filter = { companyId: req.user.companyId };
    if (projectIds) filter._id = { $in: projectIds };
    if (status)     filter.status = status;

    const projects = await Project.find(filter)
        .populate("managerId", "name email department")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

// GET /api/v1/projects/my  (Employee — projects they are a member/sub-manager on)
export const getMyProjects = asyncHandler(async (req, res) => {
    const assignments = await EmployeeProject.find({
        employeeId: req.user._id,
        isActive: true,
    }).select("projectId").lean();

    const projectIds = assignments.map(a => a.projectId);

    const projects = await Project.find({ _id: { $in: projectIds } })
        .populate("managerId", "name email")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, projects, "My projects fetched successfully"));
});

// GET /api/v1/projects/:id  (Admin / any assigned employee)
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate("managerId", "name email department")
        .lean();
    if (!project) throw new ApiError(404, "Project not found");

    if (req.user.role === "employee") {
        const assignment = await EmployeeProject.findOne({
            projectId: req.params.id,
            employeeId: req.user._id,
            isActive: true,
        });
        if (!assignment) throw new ApiError(403, "Access denied");
    }

    return res.status(200).json(new ApiResponse(200, project, "Project fetched successfully"));
});

// PATCH /api/v1/projects/:id  (Admin / project manager)
export const updateProject = asyncHandler(async (req, res) => {
    const { title, description, priority, status, startDate, endDate, tags, progressPercentage } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) throw new ApiError(404, "Project not found");

    if (req.user.role === "employee") {
        // Must be the project manager
        const isManager = await EmployeeProject.findOne({
            projectId:   req.params.id,
            employeeId:  req.user._id,
            projectRole: "manager",
            isActive:    true,
        });
        if (!isManager) throw new ApiError(403, "Only the project manager can update project details");
    }

    const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { title, description, priority, status, startDate, endDate, tags, progressPercentage },
        { new: true, runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Project updated successfully"));
});

// PATCH /api/v1/projects/:id/manager  (Admin only — re-assign manager)
export const assignManager = asyncHandler(async (req, res) => {
    const { managerId } = req.body;
    if (!managerId) throw new ApiError(400, "managerId is required");

    const { User } = await import("../models/User.js");
    const employee = await User.findById(managerId);
    if (!employee || employee.role !== "employee") {
        throw new ApiError(404, "User must be a registered employee");
    }
    if (employee.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Employee does not belong to your company");
    }

    const project = await Project.findById(req.params.id);
    if (!project) throw new ApiError(404, "Project not found");

    // Demote old manager to member
    await EmployeeProject.findOneAndUpdate(
        { projectId: req.params.id, projectRole: "manager", isActive: true },
        { projectRole: "member" }
    );

    // Upsert new manager's assignment
    await EmployeeProject.findOneAndUpdate(
        { projectId: req.params.id, employeeId: managerId },
        { projectRole: "manager", isActive: true, assignedBy: req.user._id, assignedAt: new Date() },
        { upsert: true, new: true }
    );

    const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { managerId },
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, updated, "Manager re-assigned successfully"));
});
