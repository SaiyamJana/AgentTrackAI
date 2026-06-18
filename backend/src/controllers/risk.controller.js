import { Risk } from "../models/risks.model.js";
import { ApiError }     from "../utils/ApiError.js";
import { ApiResponse }  from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/*
 * GET /api/v1/risks?projectId=...
 * Manager/Admin — list active (unresolved) risks.
 * - Admin: all risks in company (optionally filtered by projectId)
 * - Employee (manager/sub-manager): only risks for projects they manage
 */
export const getRisks = asyncHandler(async (req, res) => {
    const { projectId, resolved } = req.query;

    const filter = { companyId: req.user.companyId };
    if (projectId) filter.projectId = projectId;
    if(resolved === "true") filter.resolved = true;
    else if(resolved === "false") filter.resolved = false;

    const risks = await Risk.find(filter)
        .populate("projectId", "title status")
        .populate("taskId", "title deadline status")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(
        new ApiResponse(200, risks, "Risks fetched successfully")
    );
});

/*
 * PATCH /api/v1/risks/:id/resolve
 * Manager/Admin — mark a risk as resolved.
 */
export const resolveRisk = asyncHandler(async (req, res) => {
    const risk = await Risk.findOne({ _id: req.params.id, companyId: req.user.companyId });
    if (!risk) throw new ApiError(404, "Risk not found");

    if (risk.resolved) throw new ApiError(400, "Risk is already resolved");

    risk.resolved   = true;
    risk.resolvedAt = new Date();
    risk.resolvedBy = req.user._id;
    await risk.save();

    return res.status(200).json(
        new ApiResponse(200, risk, "Risk marked as resolved")
    );
});

/*
 * POST /api/v1/risks/scan
 * Admin (or system/cron) — manually trigger the Risk Agent scan.
 * Useful for testing without waiting for the cron schedule.
 */
export const triggerRiskScan = asyncHandler(async (req, res) => {
    if(req.user.role !== "admin"){
        throw new ApiError(
        403,
        "Only admin can trigger risk scans"
        );
    }
    const { runRiskAgent } = await import("../agents/riskAgent.js");
    const result = await runRiskAgent(req.user.companyId);

    return res.status(200).json(
        new ApiResponse(200, result, "Risk scan completed")
    );
});