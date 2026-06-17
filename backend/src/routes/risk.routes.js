import express from "express";
import {
    getRisks,
    resolveRisk,
    triggerRiskScan,
} from "../controllers/risk.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

// Admin and employees (managers/sub-managers) can view risks
// Controller scopes to companyId; manager-specific filtering done via projectId param
router.get("/", authorizeRoles("admin", "employee"), getRisks);

// Mark resolved — manager or admin
router.patch("/:id/resolve", authorizeRoles("admin", "employee"), resolveRisk);

// Manually trigger scan — admin only (for testing)
router.post("/scan", authorizeRoles("admin"), triggerRiskScan);

export default router;