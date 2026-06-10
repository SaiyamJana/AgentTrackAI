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

/*
 * All task endpoints allow "employee" at the route level.
 * The task controller's getProjectRole() helper then checks the
 * caller's EmployeeProject.projectRole to enforce manager/sub-manager
 * vs plain member permissions.
 */

// Employee-specific (any project member)
router.get("/my",             authorizeRoles("employee"), getMyTasks);
router.patch("/:id/status",   authorizeRoles("employee"), updateTaskStatus);
router.patch("/:id/progress", authorizeRoles("employee"), updateTaskProgress);

// Manager / sub-manager (+ admin) — enforced in controller
router.get("/kanban", authorizeRoles("admin", "employee"), getKanbanTasks);
router.get("/",       authorizeRoles("admin", "employee"), getTasksByProject);
router.post("/",      authorizeRoles("admin", "employee"), createTask);
router.get("/:id",    authorizeRoles("admin", "employee"), getTaskById);
router.patch("/:id",  authorizeRoles("admin", "employee"), updateTask);
router.delete("/:id", authorizeRoles("admin", "employee"), deleteTask);

export default router;
