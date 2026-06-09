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

// PDF Phase 3 (Employee): Employee sees their own assigned projects
router.get("/my", authorizeRoles("employee"), getMyProjects);

// Admin creates project; Admin + Manager list projects (each scoped)
router.post("/",   authorizeRoles("admin"),             createProject);
router.get("/",    authorizeRoles("admin", "manager"),  getAllProjects);

// Admin + Manager + Employee can view a single project (each scoped in controller)
router.get("/:id",          authorizeRoles("admin", "manager", "employee"), getProjectById);
router.patch("/:id",        authorizeRoles("admin", "manager"),             updateProject);
router.patch("/:id/manager",authorizeRoles("admin"),                        assignManager);

export default router;
