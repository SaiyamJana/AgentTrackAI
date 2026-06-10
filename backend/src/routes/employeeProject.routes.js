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

// Admin assigns/removes employees; manager + admin can view the list
router.post("/",       authorizeRoles("admin"),            assignEmployee);       // body: { employeeId, projectRole: "manager"|"member" }
router.get("/",        authorizeRoles("admin", "employee"), getProjectEmployees);
router.delete("/:eid", authorizeRoles("admin"),            removeEmployee);

// Project manager elevates a member to sub-manager (or back to member)
router.patch("/:eid/role", authorizeRoles("employee"), setEmployeeProjectRole);  // controller verifies caller is the project manager

export default router;
