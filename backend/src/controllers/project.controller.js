import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { Notification }    from "../models/Notification.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/*
 * POST /api/v1/projects  (Admin only)
 */
export const createProject = asyncHandler(async (req, res) => {
    const { title, description, managerId, priority, startDate, endDate, tags } = req.body;

    if (!title || !managerId || !startDate || !endDate) {
        throw new ApiError(400, "title, managerId, startDate, endDate are required");
    }
    if (new Date(endDate) < new Date(startDate)) {
        throw new ApiError(400, "endDate must be after startDate");
    }

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

    await EmployeeProject.create({
        projectId:   project._id,
        employeeId:  managerId,
        companyId:   req.user.companyId,
        assignedBy:  req.user._id,
        projectRole: "manager",
    });

    // ── Notify the newly assigned manager ───────────────────────────────
    await Notification.create({
        userId: managerId,
        companyId: req.user.companyId,
        type: "project_assigned",
        title: "Assigned as Project Manager",
        message: `You've been assigned as manager of project "${project.title}".`,
        relatedEntity: { type: "project", id: project._id },
        read: false,
    });

    return res.status(201).json(new ApiResponse(201, project, "Project created successfully"));
});

// GET /api/v1/projects  (Admin sees all; manager sees only theirs)
export const getAllProjects = asyncHandler(async (req, res) => {
    const { status } = req.query;
    let projectIds;

    if (req.user.role === "employee") {
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
        const isManager = await EmployeeProject.findOne({
            projectId:   req.params.id,
            employeeId:  req.user._id,
            projectRole: "manager",
            isActive:    true,
        });
        if (!isManager) throw new ApiError(403, "Only the project manager can update project details");
    }

    const previousStatus = project.status;

    const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { title, description, priority, status, startDate, endDate, tags, progressPercentage },
        { new: true, runValidators: true }
    );

    // ── Notify on status change ─────────────────────────────────────────
    if (status && status !== previousStatus) {
        const { Company } = await import("../models/Company.js");
        const company = await Company.findById(req.user.companyId).lean();

        const recipients = new Set();
        recipients.add(updated.managerId.toString());
        if (company?.adminId) recipients.add(company.adminId.toString());

        for (const userId of recipients) {
            await Notification.create({
                userId,
                companyId: req.user.companyId,
                type: "project_status_changed",
                title: "Project Status Updated",
                message: `Project "${updated.title}" status changed from "${previousStatus}" to "${status}".`,
                relatedEntity: { type: "project", id: updated._id },
                read: false,
            });
        }
    }

    // ── Notify admin when project reaches 100% ──────────────────────────
    if (progressPercentage === 100 && project.progressPercentage !== 100) {
        const { Company } = await import("../models/Company.js");
        const company = await Company.findById(req.user.companyId).lean();
        if (company?.adminId) {
            await Notification.create({
                userId: company.adminId,
                companyId: req.user.companyId,
                type: "project_completed",
                title: "Project Completed",
                message: `Project "${updated.title}" has reached 100% completion.`,
                relatedEntity: { type: "project", id: updated._id },
                read: false,
            });
        }
    }

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

    await EmployeeProject.findOneAndUpdate(
        { projectId: req.params.id, projectRole: "manager", isActive: true },
        { projectRole: "member" }
    );

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

    // ── Notify the newly assigned manager ───────────────────────────────
    await Notification.create({
        userId: managerId,
        companyId: req.user.companyId,
        type: "manager_promoted",
        title: "Assigned as Project Manager",
        message: `You've been assigned as manager of project "${updated.title}".`,
        relatedEntity: { type: "project", id: updated._id },
        read: false,
    });

    return res.status(200).json(new ApiResponse(200, updated, "Manager re-assigned successfully"));
});