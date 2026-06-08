import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized: No token provided");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(401, "Unauthorized: Invalid token");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }

    req.user = user;
    next();
});

// Role guard — pass one or more allowed roles
// e.g. authorizeRoles("admin", "manager")
export const authorizeRoles = (...roles) => {
    return (req, _, next) => {
        if (!roles.includes(req.user?.role)) {
            throw new ApiError(
                403,
                `Access denied: requires role(s) [${roles.join(", ")}]`
            );
        }
        next();
    };
};
