import express from "express";
import {
    generateReport,
    getReports,
    getReportById,
    deleteReport,
} from "../controllers/report.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

// Generate a new AI report for a project (controller checks projectRole)
router.post("/generate", authorizeRoles("admin", "employee"), generateReport);

// List reports for a project
router.get("/",           authorizeRoles("admin", "employee"), getReports);

// Single report
router.get("/:id",        authorizeRoles("admin", "employee"), getReportById);
router.delete("/:id",     authorizeRoles("admin", "employee"), deleteReport);

export default router;
