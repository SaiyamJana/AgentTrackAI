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

// ✅ Specific routes FIRST — before /:id
router.get("/my",             authorizeRoles("employee"),           getMyTasks);
router.get("/kanban",         authorizeRoles("admin", "employee"),  getKanbanTasks);

// ✅ Collection routes
router.get("/",               authorizeRoles("admin", "employee"),  getTasksByProject);
router.post("/",              authorizeRoles("admin", "employee"),  createTask);

// ✅ ID routes LAST
router.get("/:id",            authorizeRoles("admin", "employee"),  getTaskById);
router.patch("/:id",          authorizeRoles("admin", "employee"),  updateTask);
router.delete("/:id",         authorizeRoles("admin", "employee"),  deleteTask);
router.patch("/:id/status",   authorizeRoles("employee"),           updateTaskStatus);
router.patch("/:id/progress", authorizeRoles("employee"),           updateTaskProgress);

export default router;