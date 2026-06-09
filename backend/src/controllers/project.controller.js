import { Project }         from "../models/Project.js";
import { User }            from "../models/User.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

// POST /api/v1/projects  (Admin only)
export const createProject = asyncHandler(async (req, res) => {
    const { title, description, managerId, priority, startDate, endDate, tags } = req.body;

    if (!title || !managerId || !startDate || !endDate) {
        throw new ApiError(400, "title, managerId, startDate, endDate are required");
    }

    const manager = await User.findById(managerId);
    if (!manager || manager.role !== "manager") {
        throw new ApiError(404, "Manager not found or user is not a manager");
    }
    if (manager.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Manager does not belong to your company");
    }
    if (new Date(endDate) < new Date(startDate)) {
        throw new ApiError(400, "endDate must be after startDate");
    }

    const project = await Project.create({
        title, description, priority, startDate, endDate, tags,
        companyId: req.user.companyId,
        managerId,
    });

    return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});

/**
 * GET /api/v1/projects  (Admin sees all; Manager sees only their own)
 *
 * PDF Phase 2: Admin manages projects; Manager views their assigned project(s).
 */
export const getAllProjects = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = { companyId: req.user.companyId };

    if (req.user.role === "manager") {
        // Manager can only see projects they manage
        filter.managerId = req.user._id;
    }
    if (status) filter.status = status;

    const projects = await Project.find(filter)
        .populate("managerId", "name email department")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

/**
 * GET /api/v1/projects/my  (Employee only)
 *
 * PDF Phase 3: Employee views their assigned project tasks.
 * Returns projects the employee is a member of via EmployeeProject junction table.
 */
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

// GET /api/v1/projects/:id  (Admin / Manager / Employee — scoped)
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate("managerId", "name email department")
        .lean();

    if (!project) throw new ApiError(404, "Project not found");

    if (req.user.role === "manager" &&
        project.managerId._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }

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

// PATCH /api/v1/projects/:id  (Admin / Manager — scoped)
export const updateProject = asyncHandler(async (req, res) => {
    const { title, description, priority, status, startDate, endDate, tags, progressPercentage } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) throw new ApiError(404, "Project not found");

    if (req.user.role === "manager" &&
        project.managerId.toString() !== req.user._id.toString()) {
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

    return res.status(200).json(new ApiResponse(200, updated, "Project updated successfully"));
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

    return res.status(200).json(new ApiResponse(200, project, "Manager assigned successfully"));
});
