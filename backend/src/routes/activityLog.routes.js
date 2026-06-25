import express from "express";
import { getActivityLogs } from "../controllers/activityLog.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

// Admin sees company-wide (or project-scoped) logs;
// Manager sees only their own project's logs (filtered in controller)
router.get("/", authorizeRoles("admin", "employee"), getActivityLogs);

export default router;