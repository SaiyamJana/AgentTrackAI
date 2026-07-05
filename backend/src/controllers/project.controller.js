// project.controller.js
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { Notification }    from "../models/Notification.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";
// ── Chat integration ─────────────────────────────────────────────────────────
import { Conversation }              from "../models/Conversation.js";
import { syncProjectGroupMembers, syncTaskGroupMembers }   from "../socket/chatPermissions.js";
import { getIO }                     from "../socket/socket.js";

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

    const existingProject = await Project.findOne({
        companyId: req.user.companyId,
    title
    });

    if (existingProject) {
        throw new ApiError(400, "Project with this title already exists");
    }

    // ── _performedBy tag added so Project.js can auto-log creation ───────
    const project = new Project({
        title, description, priority, startDate, endDate, tags,
        companyId: req.user.companyId,
        managerId,
    });
    project._performedBy = req.user._id;
    await project.save();

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

    // ── Auto-create project group chat ──────────────────────────────────────
    // Non-blocking: chat failure must never break project creation.
    try {
        const existing = await Conversation.findOne({ type: "project_group", projectId: project._id });
        if (!existing) {
            const projConv = await Conversation.create({
                companyId: project.companyId,
                type:      "project_group",
                name:      `${project.title} — Project Chat`,
                members:   [managerId],   // manager is the only member at creation; others join as they're added
                projectId: project._id,
            });
            const io = getIO();
            if (io) {
                io.to(`user:${String(managerId)}`).emit("conv:new", projConv);
            }
        }
    } catch (chatErr) {
        console.error("[Chat] Project group creation failed (non-fatal):", chatErr.message);
    }

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
        .populate("managerId", "name email department lastSeen")
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
        .populate("managerId", "name email lastSeen")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, projects, "My projects fetched successfully"));
});

// GET /api/v1/projects/:id  (Admin / any assigned employee)
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate("managerId", "name email department lastSeen")
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

    const updates = {};
    if (title)       updates.title = title;
    if (description) updates.description = description;
    if (priority)    updates.priority = priority;
    if (status)      updates.status = status;
    if (startDate)   updates.startDate = startDate;
    if (endDate)     updates.endDate = endDate;
    if (tags)       updates.tags = tags;
    if (progressPercentage !== undefined) updates.progressPercentage = progressPercentage;

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

    //date check 
    const newStartDate = startDate || project.startDate;
    const newEndDate = endDate || project.endDate;

    if(new Date(newEndDate) < new Date(newStartDate)){
        throw new ApiError( 400, "endDate must be after startDate");
    }   

    // ── _performedBy tag added so Project.js can auto-log status/manager/completion changes ──
    const updated = await Project.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true, _performedBy: req.user._id }
    );
    const { Company } = await import("../models/Company.js");

    // ── Notify on status change ─────────────────────────────────────────
    if (status && status !== previousStatus) {
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

    // ── Notify admin + manager when project reaches 100% ─────────────────
    if (progressPercentage === 100 && project.progressPercentage !== 100) {
        const company = await Company.findById(req.user.companyId).lean();

        const recipients = new Set();
        if (company?.adminId) recipients.add(company.adminId.toString());
        recipients.add(updated.managerId.toString());

        for (const userId of recipients) {
            await Notification.create({
                userId,
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

    // ── _performedBy tag added so Project.js can auto-log manager re-assignment ──
    const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { managerId },
        { new: true, _performedBy: req.user._id }
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

    // ── Sync chat memberships ────────────────────────────────────────────
    // Manager change affects: the project group chat (old manager out, new in)
    // AND every task group chat in this project (project manager is a member
    // of each task's group chat per spec). Non-blocking — chat sync failure
    // must never break manager reassignment.
    try {
        await syncProjectGroupMembers(req.params.id);

        const { Task } = await import("../models/Task.js");
        const projectTasks = await Task.find({ projectId: req.params.id }).select("_id").lean();
        for (const t of projectTasks) {
            await syncTaskGroupMembers(t._id);
        }
    } catch (chatErr) {
        console.error("[Chat] Manager reassignment sync failed (non-fatal):", chatErr.message);
    }

    return res.status(200).json(new ApiResponse(200, updated, "Manager re-assigned successfully"));
});
/*
 * DELETE /api/v1/projects/:id  (Admin only)
 * HARD delete — permanently removes the project and ALL related data.
 * Requires admin password re-verification.
 */
export const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required to delete a project");
    }

    const admin = await User.findById(req.user._id);
    if (!admin) throw new ApiError(404, "Admin user not found");

    const isPasswordValid = await admin.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Incorrect password");
    }

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    const tasks = await Task.find({ projectId: id }).select("_id").lean();
    const taskIds = tasks.map(t => t._id);

    await TaskAssignment.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ projectId: id });
    await EmployeeProject.deleteMany({ projectId: id });
    await Risk.deleteMany({ projectId: id });
    await Report.deleteMany({ projectId: id });
    await Workload.updateMany(
        { projectIds: id },
        { $pull: { projectIds: id } }
    );
    await ActivityLog.deleteMany({ projectId: id });

    const projectTitle = project.title;
    await Project.findByIdAndDelete(id);

    await ActivityLog.create({
        userId: req.user._id,
        companyId: req.user.companyId,
        action: "project_deleted",
        entityType: "Project",
        entityId: id,
        details: `Project "${projectTitle}" and all related data were permanently deleted by ${req.user.name}.`,
        adminOnly: true,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, null, `Project "${projectTitle}" deleted permanently`));
});