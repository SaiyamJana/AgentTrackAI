import express from "express";
import {
    assignEmployee,
    getProjectEmployees,
    removeEmployee,
} from "../controllers/employeeProject.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });
router.use(verifyJWT);

router.post("/",       authorizeRoles("admin"),             assignEmployee);
router.get("/",        authorizeRoles("admin", "employee"), getProjectEmployees);
router.delete("/:eid", authorizeRoles("admin"),              removeEmployee);

export default router;