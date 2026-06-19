import { EmployeeProject } from "../models/EmployeeProject.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Task } from "../models/Task.js";

/*
 * POST /api/v1/projects/:id/employees  (Admin only)
 */
export const assignEmployee = asyncHandler(async (req, res) => {
  const { employeeId, projectRole = "member" } = req.body;
  const projectId = req.params.id;

  if (!employeeId) throw new ApiError(400, "employeeId is required");
  if (!["manager", "member"].includes(projectRole)) {
    throw new ApiError(
      400,
      "Admin can only assign projectRole 'manager' or 'member'",
    );
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== "employee") {
    throw new ApiError(404, "Employee not found");
  }
  if (employee.companyId?.toString() !== req.user.companyId?.toString()) {
    throw new ApiError(400, "Employee does not belong to your company");
  }

  if (projectRole === "manager") {
    await EmployeeProject.findOneAndUpdate(
      { projectId, projectRole: "manager", isActive: true },
      { projectRole: "member" },
    );
  }

  let assignment = await EmployeeProject.findOne({ projectId, employeeId });
  const isNewAssignment = !assignment || !assignment.isActive;

  if (assignment) {
    assignment.isActive = true;
    assignment.projectRole = projectRole;
    assignment.assignedBy = req.user._id;
    assignment.assignedAt = new Date();
    await assignment.save();
  } else {
    assignment = await EmployeeProject.create({
      projectId,
      employeeId,
      companyId: req.user.companyId,
      assignedBy: req.user._id,
      projectRole,
    });
  }

  if (projectRole === "manager") {
    await Project.findByIdAndUpdate(projectId, { managerId: employeeId });
  }

  // ── Notify the employee about being assigned ────────────────────────
  if (isNewAssignment) {
    await Notification.create({
      userId: employeeId,
      companyId: req.user.companyId,
      type: "project_assigned",
      title: "Added to Project",
      message: `You've been added to project "${project.title}" as ${projectRole}.`,
      relatedEntity: { type: "project", id: projectId },
      read: false,
    });
  } else {
    // Existing member's role changed — distinguish promotion vs demotion
    const isPromotion = projectRole === "manager";
    await Notification.create({
      userId: employeeId,
      companyId: req.user.companyId,
      type: isPromotion ? "manager_promoted" : "role_changed",
      title: isPromotion ? "Promoted to Manager" : "Role Updated",
      message: isPromotion
        ? `You've been promoted to Manager on project "${project.title}".`
        : `Your role on project "${project.title}" has been updated to ${projectRole}.`,
      relatedEntity: { type: "project", id: projectId },
      read: false,
    });
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        assignment,
        `Employee assigned as ${projectRole} successfully`,
      ),
    );
});

// GET /api/v1/projects/:id/employees  (Admin / project manager)
export const getProjectEmployees = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  if (
    req.user.role === "employee" &&
    project.managerId.toString() !== req.user._id.toString()
  ) {
    const self = await EmployeeProject.findOne({
      projectId,
      employeeId: req.user._id,
      isActive: true,
    });
    if (!self) throw new ApiError(403, "Access denied");
  }

  const employees = await EmployeeProject.find({ projectId, isActive: true })
    .populate("employeeId", "name email department designation")
    .populate("assignedBy", "name email")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(200, employees, "Project employees fetched successfully"),
    );
});

// DELETE /api/v1/projects/:id/employees/:eid  (Admin only)
export const removeEmployee = asyncHandler(async (req, res) => {
  const { id: projectId, eid: employeeId } = req.params;

  const activeTask = await Task.findOne({
    projectId,
    $or: [{ subManagerId: employeeId }, { teamMembers: employeeId }],
  });

  if (activeTask) {
    throw new ApiError(400, "Cannot remove employee assigned to active tasks");
  }

  const project = await Project.findById(projectId);

  // ── Check BEFORE deactivating — find the assignment first, don't mutate yet ──
  const existingAssignment = await EmployeeProject.findOne({
    projectId,
    employeeId,
    isActive: true,
  });

  if (!existingAssignment) throw new ApiError(404, "Assignment not found");

  if (existingAssignment.projectRole === "manager") {
    throw new ApiError(
      400,
      "Assign a new manager before removing current manager",
    );
  }

  // ── Only deactivate after all checks pass ──────────────────────────
  const assignment = await EmployeeProject.findOneAndUpdate(
    { projectId, employeeId, isActive: true },
    { isActive: false },
    { new: true },
  );

  // ── Notify the removed employee ──────────────────────────────────────
  await Notification.create({
    userId: employeeId,
    companyId: req.user.companyId,
    type: "project_removed",
    title: "Removed from Project",
    message: `You've been removed from project "${project?.title ?? "a project"}".`,
    relatedEntity: { type: "project", id: projectId },
    read: false,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        assignment,
        "Employee removed from project successfully",
      ),
    );
});
