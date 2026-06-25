import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getMyWorkload,
  getTeamWorkload,
  getCompanyWorkload,
  getEmployeeWorkload,
  getWorkloadAlerts,
  getWorkloadHistory,
  triggerRecalculation,
  updateContribution,
  updateCapacity,
} from "../controllers/workload.controller.js";

const router = Router();

// All workload routes require authentication
router.use(verifyJWT);

// ── Employee routes ───────────────────────────────────────────────────────────
router.get("/me",          getMyWorkload);       // Any authenticated user

// ── Manager / Admin routes ────────────────────────────────────────────────────
router.get("/team",        getTeamWorkload);     // ?projectId=
router.get("/alerts",      getWorkloadAlerts);   // overloaded/at-risk members
router.get("/history",     getWorkloadHistory);  // ?employeeId=&days=
router.get("/company",     getCompanyWorkload);  // Admin only
router.get("/employee/:employeeId", getEmployeeWorkload); // Manager/Admin

// ── Mutation routes ───────────────────────────────────────────────────────────
router.post("/recalculate",  triggerRecalculation);  // Manual cron trigger
router.patch("/capacity",    updateCapacity);         // Admin: set hours/week
router.patch(
  "/assignments/:assignmentId/contribution",
  updateContribution                                   // Manager: set contribution%
);

export default router;
