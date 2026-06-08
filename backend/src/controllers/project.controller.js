import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/v1/projects  (Admin only)
export const createProject = asyncHandler(async (req, res) => {
    const { title, description, managerId, priority, startDate, endDate, tags } = req.body;

    if (!title || !managerId || !startDate || !endDate) {
        throw new ApiError(400, "title, managerId, startDate, endDate are required");
    }

    // Validate manager exists and belongs to same company
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== "manager") {
        throw new ApiError(404, "Manager not found or user is not a manager");
    }
    if (manager.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Manager does not belong to your company");
    }

    // Date validation
    if (new Date(endDate) < new Date(startDate)) {
        throw new ApiError(400, "endDate must be after startDate");
    }

    const project = await Project.create({
        title,
        description,
        companyId: req.user.companyId,
        managerId,
        priority,
        startDate,
        endDate,
        tags,
    });

    return res.status(201).json(
        new ApiResponse(201, project, "Project created successfully")
    );
});

// GET /api/v1/projects  (Admin)
export const getAllProjects = asyncHandler(async (req, res) => {
    const { status } = req.query;

    const filter = { companyId: req.user.companyId };
    if (status) filter.status = status;

    const projects = await Project.find(filter)
        .populate("managerId", "name email department")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(200, projects, "Projects fetched successfully")
    );
});

// GET /api/v1/projects/:id  (Admin/Manager)
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate("managerId", "name email department")
        .lean();

    if (!project) throw new ApiError(404, "Project not found");

    // Manager can only see their own project
    if (
        req.user.role === "manager" &&
        project.managerId._id.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, "Access denied");
    }

    return res.status(200).json(
        new ApiResponse(200, project, "Project fetched successfully")
    );
});

// PATCH /api/v1/projects/:id  (Admin/Manager)
export const updateProject = asyncHandler(async (req, res) => {
    const { title, description, priority, status, startDate, endDate, tags, progressPercentage } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) throw new ApiError(404, "Project not found");

    // Manager can only update their own project
    if (
        req.user.role === "manager" &&
        project.managerId.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, "Access denied");
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        throw new ApiError(400, "endDate must be after startDate");
    }

    const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { title, description, priority, status, startDate, endDate, tags, progressPercentage },
        { new: true, runValidators: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updated, "Project updated successfully")
    );
});

// PATCH /api/v1/projects/:id/manager  (Admin only)
export const assignManager = asyncHandler(async (req, res) => {
    const { managerId } = req.body;

    if (!managerId) throw new ApiError(400, "managerId is required");

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== "manager") {
        throw new ApiError(404, "Manager not found or user is not a manager");
    }
    if (manager.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Manager does not belong to your company");
    }

    const project = await Project.findByIdAndUpdate(
        req.params.id,
        { managerId },
        { new: true }
    );

    if (!project) throw new ApiError(404, "Project not found");

    return res.status(200).json(
        new ApiResponse(200, project, "Manager assigned successfully")
    );
});