import express from "express";
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    deleteTask,
    getTasksByProject,
    getMyTasks,
    reassignTask,
    getTaskStatsOverview,
} from "../controllers/task.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All task routes require a valid JWT
router.use(verifyJWT);

// ── Employee routes ──────────────────────────────────────────────────────────

// GET /api/v1/tasks/my-tasks  →  Employee's own tasks + stats
router.get(
    "/my-tasks",
    authorizeRoles("employee", "manager", "admin"),
    getMyTasks
);

// ── Manager / Admin shared routes ────────────────────────────────────────────

// GET  /api/v1/tasks/stats/overview  →  KPI counts for dashboard
router.get(
    "/stats/overview",
    authorizeRoles("manager", "admin"),
    getTaskStatsOverview
);

// GET  /api/v1/tasks/project/:projectId  →  All tasks for a project (Kanban board)
router.get(
    "/project/:projectId",
    authorizeRoles("manager", "admin"),
    getTasksByProject
);

// POST /api/v1/tasks  →  Create a new task
router.post(
    "/",
    authorizeRoles("manager", "admin"),
    createTask
);

// GET  /api/v1/tasks  →  List tasks (role-filtered, paginated)
router.get(
    "/",
    authorizeRoles("manager", "admin", "employee"),
    getTasks
);

// GET    /api/v1/tasks/:taskId  →  Single task detail
router.get(
    "/:taskId",
    authorizeRoles("manager", "admin", "employee"),
    getTaskById
);

// PATCH  /api/v1/tasks/:taskId  →  Update task (manager: all fields; employee: status/progress)
router.patch(
    "/:taskId",
    authorizeRoles("manager", "admin", "employee"),
    updateTask
);

// PATCH  /api/v1/tasks/:taskId/reassign  →  Reassign to another employee
router.patch(
    "/:taskId/reassign",
    authorizeRoles("manager", "admin"),
    reassignTask
);

// DELETE /api/v1/tasks/:taskId  →  Delete task
router.delete(
    "/:taskId",
    authorizeRoles("manager", "admin"),
    deleteTask
);

export default router;
