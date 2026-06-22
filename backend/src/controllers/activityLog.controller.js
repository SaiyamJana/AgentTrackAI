// activityLog.controller.js
import { ActivityLog }     from "../models/activityLogs.model.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/*
 * GET /api/v1/activity-logs?projectId=
 *
 * Admin: sees everything for the company (optionally scoped to a project).
 * Manager: sees only logs for projects they manage, and never sees
 *          adminOnly:true entries (security/visibility rule).
 */
export const getActivityLogs = asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  const filter = { companyId: req.user.companyId };

  if (req.user.role === "admin") {
    if (projectId) filter.projectId = projectId;
  } else {
    // Manager-only access — verify they actually manage this project
    if (!projectId) {
      throw new ApiError(400, "projectId is required for manager view");
    }

    const isManager = await EmployeeProject.findOne({
      projectId,
      employeeId: req.user._id,
      projectRole: "manager",
      isActive: true,
    });

    if (!isManager) {
      throw new ApiError(403, "Only the project manager or admin can view activity logs");
    }

    filter.projectId = projectId;
    filter.adminOnly = false; // hide admin-only entries from manager view
  }

  const logs = await ActivityLog.find(filter)
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .limit(200) // safety cap — avoid unbounded queries as logs grow
    .lean();

  return res.status(200).json(new ApiResponse(200, logs, "Activity logs fetched successfully"));
});