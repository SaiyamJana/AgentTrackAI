import { EmployeeProject } from "../models/EmployeeProject.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/v1/projects/:id/employees  (Admin only)
export const assignEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.body;
    const projectId = req.params.id;

    if (!employeeId) throw new ApiError(400, "employeeId is required");

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    // Verify employee exists and is actually an employee
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== "employee") {
        throw new ApiError(404, "Employee not found or user is not an employee");
    }

    // Verify same company
    if (employee.companyId?.toString() !== req.user.companyId?.toString()) {
        throw new ApiError(400, "Employee does not belong to your company");
    }

    // Check duplicate
    const existing = await EmployeeProject.findOne({ projectId, employeeId });
    if (existing) {
        if (existing.isActive) throw new ApiError(409, "Employee already assigned to this project");
        // Re-activate if previously removed
        existing.isActive = true;
        existing.assignedAt = new Date();
        existing.assignedBy = req.user._id;
        await existing.save();
        return res.status(200).json(
            new ApiResponse(200, existing, "Employee re-assigned to project successfully")
        );
    }

    const assignment = await EmployeeProject.create({
        projectId,
        employeeId,
        managerId: project.managerId,
        companyId: req.user.companyId,
        assignedBy: req.user._id,
    });

    return res.status(201).json(
        new ApiResponse(201, assignment, "Employee assigned to project successfully")
    );
});

// GET /api/v1/projects/:id/employees  (Admin/Manager)
export const getProjectEmployees = asyncHandler(async (req, res) => {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    // Manager can only view their own project's employees
    if (
        req.user.role === "manager" &&
        project.managerId.toString() !== req.user._id.toString()
    ) {
        throw new ApiError(403, "Access denied");
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

    return res.status(200).json(
        new ApiResponse(200, assignment, "Employee removed from project successfully")
    );
});