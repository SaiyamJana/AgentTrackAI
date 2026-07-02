import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    console.log("verifyJWT called:", req.originalUrl);
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Unauthorized: No token provided");
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password -refreshToken");
    if (!user) throw new ApiError(401, "Unauthorized: Invalid token");
    if (!user.isActive) throw new ApiError(403, "Account is deactivated");
    req.user = user;

    // 🟢 Update lastSeen — fire-and-forget, never blocks the request
    User.findByIdAndUpdate(user._id, { lastSeen: new Date() }).catch(err =>
        console.error("[lastSeen] update failed:", err.message)
    );

    next();
});

/*
 * authorizeRoles — checks req.user.role (only "admin" or "employee")
 * Use for broad access control at the route level.
 */
export const authorizeRoles = (...roles) => {
    return (req, _, next) => {
        if (!roles.includes(req.user?.role)) {
            throw new ApiError(403, `Access denied: requires [${roles.join(", ")}]`);
        }
        next();
    };
};

/*
 * requireProjectRole — middleware factory for project-level role checks.
 *
 * Usage in routes:
 *   router.post("/", verifyJWT, requireProjectRole("manager", "sub-manager"), createTask)
 *
 * It reads :projectId from req.params or req.query and checks the caller's
 * projectRole in EmployeeProject.  Admins always pass through.
 */
export const requireProjectRole = (...projectRoles) => {
    return asyncHandler(async (req, _, next) => {
        // Admins bypass project-level role checks entirely
        if (req.user.role === "admin") return next();

        const projectId = req.params.projectId || req.params.id || req.query.projectId;
        if (!projectId) throw new ApiError(400, "projectId is required");

        const assignment = await EmployeeProject.findOne({
            projectId,
            employeeId: req.user._id,
            isActive: true,
        });

        if (!assignment) throw new ApiError(403, "You are not assigned to this project");

        if (!projectRoles.includes(assignment.projectRole)) {
            throw new ApiError(
                403,
                `Project role required: [${projectRoles.join(", ")}]. Your role: ${assignment.projectRole}`
            );
        }

        // Attach project role to request for controllers to use if needed
        req.projectRole = assignment.projectRole;
        next();
    });
};
