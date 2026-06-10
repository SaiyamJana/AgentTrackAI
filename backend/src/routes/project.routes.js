import express from "express";
import {
    createProject,
    getAllProjects,
    getMyProjects,
    getProjectById,
    updateProject,
    assignManager,
} from "../controllers/project.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

// Employee sees all projects they are on (member / sub-manager / manager)
router.get("/my", authorizeRoles("employee"), getMyProjects);

// Admin creates; Admin + Employee (acting as manager) can list
router.post("/", authorizeRoles("admin"),              createProject);
router.get("/",  authorizeRoles("admin", "employee"),  getAllProjects); // controller filters for manager

// Single project — all roles, scoped in controller
router.get("/:id",           authorizeRoles("admin", "employee"), getProjectById);
router.patch("/:id",         authorizeRoles("admin", "employee"), updateProject);   // controller checks manager role
router.patch("/:id/manager", authorizeRoles("admin"),             assignManager);

export default router;
