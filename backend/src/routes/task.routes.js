import express from "express";
import {
    createTask,
    getTasksByProject,
    getKanbanTasks,
    getTaskById,
    updateTask,
    deleteTask,
    getMyTasks,
    updateTaskStatus,
    updateTaskProgress,
} from "../controllers/task.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

// ── Employee routes ───────────────────────────────────────────────────────────
// PDF Phase 3 Step 7: Employee views their tasks (assigned by Manager OR Sub-Manager)
router.get("/my",             authorizeRoles("employee"), getMyTasks);
router.patch("/:id/status",   authorizeRoles("employee"), updateTaskStatus);
router.patch("/:id/progress", authorizeRoles("employee"), updateTaskProgress);

// ── Manager / Sub-Manager routes ──────────────────────────────────────────────
// Sub-managers have role="employee" but projectRole="sub-manager" in EmployeeProject.
// The controller's isAuthorisedTaskManager() helper enforces this — so we allow
// both "manager" and "employee" roles on these endpoints; the controller gates further.
router.get("/kanban", authorizeRoles("manager", "employee"), getKanbanTasks);
router.get("/",       authorizeRoles("manager", "employee"), getTasksByProject);
router.post("/",      authorizeRoles("manager", "employee"), createTask);

// ── Shared routes ─────────────────────────────────────────────────────────────
router.get("/:id",    authorizeRoles("manager", "employee"), getTaskById);
router.patch("/:id",  authorizeRoles("manager", "employee"), updateTask);
router.delete("/:id", authorizeRoles("manager", "employee"), deleteTask);

export default router;
