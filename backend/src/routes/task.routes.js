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

// Employee routes
router.get("/employee/tasks", authorizeRoles("employee"), getMyTasks);

// Manager routes
router.get("/kanban",  authorizeRoles("manager"), getKanbanTasks);
router.get("/",        authorizeRoles("manager"), getTasksByProject);
router.post("/",       authorizeRoles("manager"), createTask);

// Shared routes (Manager + Employee)
router.get("/:id",     authorizeRoles("manager", "employee"), getTaskById);
router.patch("/:id",   authorizeRoles("manager"), updateTask);
router.delete("/:id",  authorizeRoles("manager"), deleteTask);

// Employee progress routes
router.patch("/:id/status",   authorizeRoles("employee"), updateTaskStatus);
router.patch("/:id/progress", authorizeRoles("employee"), updateTaskProgress);

export default router;