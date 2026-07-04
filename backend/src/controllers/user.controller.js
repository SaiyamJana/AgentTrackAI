import { User }    from "../models/User.js";
import { Company } from "../models/Company.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ActivityLog } from "../models/activityLogs.model.js";

const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

const withOnlineStatus = (user) => ({
    ...user,
    isOnline: user.lastSeen
        ? (Date.now() - new Date(user.lastSeen).getTime()) < ONLINE_THRESHOLD_MS
        : false,
});
// POST /api/v1/users/register  ← PUBLIC
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, inviteCode, department, designation } = req.body;

    if (!name || !email || !password || !inviteCode) {
        throw new ApiError(400, "name, email, password, inviteCode are required");
    }

    const company = await Company.findOne({ inviteCode, isActive: true });
    if (!company) {
        throw new ApiError(404, "Invalid invite code. Ask your Admin for the correct code.");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "A user with this email already exists");

    const user = await User.create({
        name, email, password,
        role:      "employee",
        department, designation,
        companyId: company._id,
    });

    await ActivityLog.create({
        userId: user._id,
        companyId: company._id,
        action: "employee_created",
        entityType: "User",
        entityId: user._id,
        details: `${user.name} joined the company via invite code.`,
        adminOnly: false,
    });

    const accessToken  = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken  = refreshToken;
    await user.save({ validateBeforeSave: false });
    user.password     = undefined;
    user.refreshToken = undefined;

    return res.status(201).json(
        new ApiResponse(201, { user, accessToken, refreshToken }, "Registered successfully")
    );
});

// POST /api/v1/users/login  ← PUBLIC
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password, companyId } = req.body;

    if (!email || !password || !companyId) {
        throw new ApiError(400, "email, password, and companyId are required");
    }

    // companyId from frontend is actually the inviteCode
    const company = await Company.findOne({
        inviteCode: companyId,
        isActive: true,
    });

    if (!company) {
        throw new ApiError(404, "Invalid Company ID");
    }

    const user = await User.findOne({
        email,
        companyId: company._id,
    });

    if (!user) {
        throw new ApiError(404, "No account found with this email in the given company");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    await ActivityLog.create({
        userId: user._id,
        companyId: user.companyId,
        action: "user_login",
        entityType: "User",
        entityId: user._id,
        details: `${user.name} (${user.role}) logged in.`,
        adminOnly: true,
    });

    user.password = undefined;
    user.refreshToken = undefined;

    return res.status(200).json(
        new ApiResponse(
            200,
            { user, accessToken, refreshToken },
            "Login successful"
        )
    );
});

// POST /api/v1/users  (Admin — manually create employee)
export const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, department, designation } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "name, email, password are required");
    }

    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, "A user with this email already exists");

    const user = await User.create({
        name, email, password,
        role:      "employee",        // always employee
        companyId: req.user.companyId, // inherits admin's companyId
        department, designation,
    });

    await ActivityLog.create({
        userId: req.user._id,
        companyId: req.user.companyId,
        action: "employee_created",
        entityType: "User",
        entityId: user._id,
        details: `${user.name} was added as a new employee by ${req.user.name}.`,
        adminOnly: false,
    });

    user.password     = undefined;
    user.refreshToken = undefined;

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

    const usersWithStatus = users.map(withOnlineStatus);

    return res.status(200).json(new ApiResponse(200, usersWithStatus, "Users fetched successfully"));
});

// GET /api/v1/users/:id  (Admin)
export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password -refreshToken").lean();
    if (!user) throw new ApiError(404, "User not found");
    return res.status(200).json(new ApiResponse(200, withOnlineStatus(user), "User fetched successfully"));
});

// PATCH /api/v1/users/:id  (Admin)
// PATCH /api/v1/users/:id  (Admin)
export const updateUser = asyncHandler(async (req, res) => {
    const { name, department, designation, isActive } = req.body;

    const previousUser = await User.findById(req.params.id).select("isActive name department designation");
    if (!previousUser) throw new ApiError(404, "User not found");

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, department, designation, isActive },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (isActive !== undefined && isActive !== previousUser.isActive) {
        await ActivityLog.create({
            userId: req.user._id,
            companyId: req.user.companyId,
            action: isActive ? "employee_reactivated" : "employee_deactivated",
            entityType: "User",
            entityId: user._id,
            details: isActive
                ? `${user.name} was reactivated by ${req.user.name}.`
                : `${user.name} was deactivated by ${req.user.name}.`,
            adminOnly: false,
        });
    }

    const fieldChanged =
        (name        !== undefined && name        !== previousUser.name) ||
        (department  !== undefined && department  !== previousUser.department) ||
        (designation !== undefined && designation !== previousUser.designation);

    if (fieldChanged) {
        await ActivityLog.create({
            userId: req.user._id,
            companyId: req.user.companyId,
            action: "employee_updated",
            entityType: "User",
            entityId: user._id,
            details: `${user.name}'s profile was updated by ${req.user.name}.`,
            adminOnly: false,
        });
    }

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