import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/v1/users/register
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, department, designation, companyId } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "name, email, password are required");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "User already exists");

    const user = await User.create({
        name, email, password, role, department, designation, companyId: companyId || null
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshToken = undefined;

    return res.status(201).json(
        new ApiResponse(201, { user, accessToken, refreshToken }, "User registered successfully")
    );
});

// POST /api/v1/users/login
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) throw new ApiError(400, "email and password are required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid password");

    if (!user.isActive) throw new ApiError(403, "Account is deactivated");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshToken = undefined;

    return res.status(200).json(
        new ApiResponse(200, { user, accessToken, refreshToken }, "Login successful")
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

    return res.status(200).json(
        new ApiResponse(200, users, "Users fetched successfully")
    );
});

// GET /api/v1/users/:id  (Admin)
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select("-password -refreshToken")
        .lean();

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(200, user, "User fetched successfully")
    );
});

// PATCH /api/v1/users/:id  (Admin)
export const updateUser = asyncHandler(async (req, res) => {
    const { name, department, designation, companyId, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, department, designation, companyId, role, isActive },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(200, user, "User updated successfully")
    );
});

// DELETE /api/v1/users/:id  (Admin — soft delete)
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
        new ApiResponse(200, user, "User deactivated successfully")
    );
});