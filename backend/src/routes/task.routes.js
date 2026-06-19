import express from "express";
import {
    createTask,
    getTasksByProject,
    getKanbanTasks,
    getTaskById,
    updateTask,
    deleteTask,
    getMyTasks,
    addTaskMembers,
    removeTaskMembers,
    getTaskMembers,
    getTaskAssignments,
    updateAssignmentProgress,
} from "../controllers/task.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

// ✅ Specific routes FIRST — before /:id
router.get("/my",     authorizeRoles("admin", "employee"), getMyTasks);
router.get("/kanban", authorizeRoles("admin", "employee"), getKanbanTasks);

// ✅ Collection routes
router.get("/",  authorizeRoles("admin", "employee"), getTasksByProject);
router.post("/", authorizeRoles("admin", "employee"), createTask);

// ✅ ID routes
router.get("/:id",    authorizeRoles("admin", "employee"), getTaskById);
router.patch("/:id",  authorizeRoles("admin", "employee"), updateTask);
router.delete("/:id", authorizeRoles("admin", "employee"), deleteTask);

// ✅ Task members (team) management
router.get("/:id/members",          authorizeRoles("admin", "employee"), getTaskMembers);
router.post("/:id/members",         authorizeRoles("admin", "employee"), addTaskMembers);     // body: { employeeIds: [] }
router.delete("/:id/members/:employeeId", authorizeRoles("admin", "employee"), removeTaskMembers);

// ✅ Task assignments (per-employee progress tracking)
router.get("/:id/assignments",          authorizeRoles("admin", "employee"), getTaskAssignments);
router.patch("/:id/assignments/progress", authorizeRoles("admin", "employee"), updateAssignmentProgress);

export default router;