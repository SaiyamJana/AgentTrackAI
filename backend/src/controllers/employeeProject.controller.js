import { EmployeeProject } from "../models/EmployeeProject.js";
import { Project }         from "../models/Project.js";
import { User }            from "../models/User.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

// POST /api/v1/projects/:id/employees  (Admin only)
// PDF Phase 2 Step 4: Admin assigns employees to a project under a Manager
export const assignEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    const projectId = req.params.id;

    if (!employeeId) throw new ApiError(400, "employeeId is required");

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee") {
        throw new ApiError(404, "Employee not found or user is not an employee");
    }
    if (employee.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Employee does not belong to your company");
    }

    const existing = await EmployeeProject.findOne({ projectId, employeeId });
    if (existing) {
        if (existing.isActive) throw new ApiError(409, "Employee already assigned to this project");
        existing.isActive   = true;
        existing.assignedAt = new Date();
        existing.assignedBy = req.user._id;
        existing.projectRole = "member";
        await existing.save();
        return res.status(200).json(
            new ApiResponse(200, existing, "Employee re-assigned to project successfully")
        );
    }

    const assignment = await EmployeeProject.create({
        projectId,
        employeeId,
        managerId:   project.managerId,
        companyId:   req.user.companyId,
        assignedBy:  req.user._id,
        projectRole: "member",
    });

    return res.status(201).json(
        new ApiResponse(201, assignment, "Employee assigned to project successfully")
    );
});

// GET /api/v1/projects/:id/employees  (Admin / Manager)
export const getProjectEmployees = asyncHandler(async (req, res) => {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    if (req.user.role === "manager" &&
        project.managerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Access denied");
    }

    const employees = await EmployeeProject.find({ projectId, isActive: true })
        .populate("employeeId",  "name email department designation")
        .populate("assignedBy",  "name email")
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

    return res.status(200).json(
        new ApiResponse(200, assignment, "Employee removed from project successfully")
    );
});

/**
 * PATCH /api/v1/projects/:id/employees/:eid/role  (Manager only)
 *
 * PDF Phase 3 Step 5: Manager delegates a Sub-Manager / Task Lead.
 * Only the project's main manager can elevate one of their assigned employees.
 */
export const setEmployeeProjectRole = asyncHandler(async (req, res) => {
    const { id: projectId, eid: employeeId } = req.params;
    const { projectRole } = req.body;

    if (!projectRole || !["member", "sub-manager"].includes(projectRole)) {
        throw new ApiError(400, "projectRole must be 'member' or 'sub-manager'");
    }

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    // Only the main manager of this project can elevate employees
    if (project.managerId.toString() !== req.user._id.toString()) {
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
                ? "Employee elevated to Sub-Manager successfully"
                : "Employee role reset to Member successfully"
        )
    );
});
