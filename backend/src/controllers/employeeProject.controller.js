import { EmployeeProject } from "../models/EmployeeProject.js";
import { Project }         from "../models/Project.js";
import { User }            from "../models/User.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/*
 * POST /api/v1/projects/:id/employees  (Admin only)
 *
 * Admin assigns an employee to a project.
 * body: { employeeId, projectRole? }
 *
 * projectRole options:
 *   "manager"  — designates this employee as the project manager
 *                (also updates Project.managerId for fast queries)
 *   "member"   — regular contributor (default)
 *
 * Rule: only ONE manager per project. If role = "manager" and one
 * already exists, the old manager is demoted to "member" first.
 */
export const assignEmployee = asyncHandler(async (req, res) => {
    const { employeeId, projectRole = "member" } = req.body;
    const projectId = req.params.id;

    if (!employeeId) throw new ApiError(400, "employeeId is required");
    if (!["manager", "member"].includes(projectRole)) {
        throw new ApiError(400, "Admin can only assign projectRole 'manager' or 'member'");
    }

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    // Verify employee belongs to the same company
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee") {
        throw new ApiError(404, "Employee not found");
    }
    if (employee.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Employee does not belong to your company");
    }

    // If assigning as manager, demote existing manager first
    if (projectRole === "manager") {
        await EmployeeProject.findOneAndUpdate(
            { projectId, projectRole: "manager", isActive: true },
            { projectRole: "member" }
        );
    }

    // Upsert the assignment
    let assignment = await EmployeeProject.findOne({ projectId, employeeId });
    if (assignment) {
        assignment.isActive    = true;
        assignment.projectRole = projectRole;
        assignment.assignedBy  = req.user._id;
        assignment.assignedAt  = new Date();
        await assignment.save();
    } else {
        assignment = await EmployeeProject.create({
            projectId,
            employeeId,
            companyId:   req.user.companyId,
            assignedBy:  req.user._id,
            projectRole,
        });
    }

    // Keep Project.managerId in sync when a manager is assigned
    if (projectRole === "manager") {
        await Project.findByIdAndUpdate(projectId, { managerId: employeeId });
    }

    return res.status(201).json(
        new ApiResponse(201, assignment, `Employee assigned as ${projectRole} successfully`)
    );
});

// GET /api/v1/projects/:id/employees  (Admin / project manager)
export const getProjectEmployees = asyncHandler(async (req, res) => {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    // Employees can only see their own project
    if (req.user.role === "employee" &&
        project.managerId.toString() !== req.user._id.toString()) {
        // Allow if they are at least a member
        const self = await EmployeeProject.findOne({ projectId, employeeId: req.user._id, isActive: true });
        if (!self) throw new ApiError(403, "Access denied");
    }

    const employees = await EmployeeProject.find({ projectId, isActive: true })
        .populate("employeeId", "name email department designation")
        .populate("assignedBy", "name email")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, employees, "Project employees fetched successfully")
    );
});

// DELETE /api/v1/projects/:id/employees/:eid  (Admin only)
export const removeEmployee = asyncHandler(async (req, res) => {
    const { id: projectId, eid: employeeId } = req.params;

    const assignment = await EmployeeProject.findOneAndUpdate(
        { projectId, employeeId, isActive: true },
        { isActive: false },
        { new: true }
    );
    if (!assignment) throw new ApiError(404, "Assignment not found");

    // If removed employee was the manager, clear Project.managerId
    if (assignment.projectRole === "manager") {
        await Project.findByIdAndUpdate(projectId, { managerId: null });
    }

    return res.status(200).json(
        new ApiResponse(200, assignment, "Employee removed from project successfully")
    );
});

/*
 * PATCH /api/v1/projects/:id/employees/:eid/role  (Project Manager only)
 *
 * Manager can elevate a member to sub-manager or reset them back to member.
 * Manager CANNOT elevate someone to "manager" — only Admin can do that.
 */
export const setEmployeeProjectRole = asyncHandler(async (req, res) => {
    const { id: projectId, eid: employeeId } = req.params;
    const { projectRole } = req.body;

    if (!projectRole || !["sub-manager", "member"].includes(projectRole)) {
        throw new ApiError(400, "Manager can only set projectRole to 'sub-manager' or 'member'");
    }

    // Verify requester is the project manager
    const managerAssignment = await EmployeeProject.findOne({
        projectId,
        employeeId: req.user._id,
        projectRole: "manager",
        isActive: true,
    });
    if (!managerAssignment) {
        throw new ApiError(403, "Only the project manager can delegate roles");
    }

    const assignment = await EmployeeProject.findOneAndUpdate(
        { projectId, employeeId, isActive: true },
        { projectRole },
        { new: true }
    ).populate("employeeId", "name email");

    if (!assignment) throw new ApiError(404, "Employee is not assigned to this project");

    return res.status(200).json(
        new ApiResponse(200, assignment,
            projectRole === "sub-manager"
                ? "Employee elevated to Sub-Manager"
                : "Employee reset to Member"
        )
    );
});
