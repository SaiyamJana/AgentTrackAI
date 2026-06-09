import { User }    from "../models/User.js";
import { Company } from "../models/Company.js";
import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/users/register  ← PUBLIC
 *
 * PDF Phase 1 Step 2: "Employee Sign Up"
 * Employees self-register using the Company ID given by Admin.
 * Role is ALWAYS forced to "employee" — Admins and Managers are
 * created by Admin only via POST /api/v1/users  (protected route).
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, department, designation, companyId } = req.body;

    if (!name || !email || !password || !companyId) {
        throw new ApiError(400, "name, email, password, companyId are required");
    }

    // Validate company exists
    const company = await Company.findById(companyId);
    if (!company || !company.isActive) {
        throw new ApiError(404, "Invalid Company ID. Please ask your Admin for the correct ID.");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "User already exists");

    // Role is ALWAYS employee for self-registration
    const user = await User.create({
        name, email, password,
        role: "employee",          // ← enforced, not from body
        department, designation,
        companyId,
    });

    const accessToken  = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken  = refreshToken;
    await user.save({ validateBeforeSave: false });

    user.password      = undefined;
    user.refreshToken  = undefined;

    return res.status(201).json(
        new ApiResponse(201, { user, accessToken, refreshToken }, "Registered successfully")
    );
});

// POST /api/v1/users/login  ← PUBLIC
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) throw new ApiError(400, "email and password are required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid password");

    if (!user.isActive) throw new ApiError(403, "Account is deactivated");

    const accessToken  = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken  = refreshToken;
    user.lastLoginAt   = new Date();
    await user.save({ validateBeforeSave: false });

    user.password      = undefined;
    user.refreshToken  = undefined;

    return res.status(200).json(
        new ApiResponse(200, { user, accessToken, refreshToken }, "Login successful")
    );
});

/**
 * POST /api/v1/users  (Admin only)
 *
 * PDF Note: "Admins can also manually create users via the /api/v1/users endpoint"
 * Admin can create managers or employees directly without self-registration.
 */
export const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, department, designation } = req.body;

    if (!name || !email || !password || !role) {
        throw new ApiError(400, "name, email, password, role are required");
    }

    if (!["manager", "employee"].includes(role)) {
        throw new ApiError(400, "Admin can only create users with role 'manager' or 'employee'");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "User already exists");

    const user = await User.create({
        name, email, password, role,
        department, designation,
        companyId: req.user.companyId,  // inherit admin's company
    });

    user.password = undefined;

    return res.status(201).json(
        new ApiResponse(201, user, "User created successfully")
    );
});

// GET /api/v1/users  (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
    const { role } = req.query;

    const filter = { companyId: req.user.companyId };
    if (role) filter.role = role;

    const users = await User.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

// GET /api/v1/users/:id  (Admin)
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select("-password -refreshToken")
        .lean();

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

// PATCH /api/v1/users/:id  (Admin)
export const updateUser = asyncHandler(async (req, res) => {
    const { name, department, designation, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, department, designation, role, isActive },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

// DELETE /api/v1/users/:id  (Admin — soft delete)
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(new ApiResponse(200, user, "User deactivated successfully"));
});
