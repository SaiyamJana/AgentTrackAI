import express from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    assignManager,
} from "../controllers/project.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/",   authorizeRoles("admin"), createProject);
router.get("/",    authorizeRoles("admin"), getAllProjects);
router.get("/:id", authorizeRoles("admin", "manager"), getProjectById);
router.patch("/:id", authorizeRoles("admin", "manager"), updateProject);
router.patch("/:id/manager", authorizeRoles("admin"), assignManager);

export default router;