import express from "express";
import {
    assignEmployee,
    getProjectEmployees,
    removeEmployee,
    setEmployeeProjectRole,
} from "../controllers/employeeProject.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(verifyJWT);

// PDF Phase 2 Step 4: Admin assigns employees to a project
router.post("/",        authorizeRoles("admin"),            assignEmployee);
router.get("/",         authorizeRoles("admin", "manager"), getProjectEmployees);
router.delete("/:eid",  authorizeRoles("admin"),            removeEmployee);

// PDF Phase 3 Step 5: Manager delegates a Sub-Manager / Task Lead
router.patch("/:eid/role", authorizeRoles("manager"), setEmployeeProjectRole);

export default router;
