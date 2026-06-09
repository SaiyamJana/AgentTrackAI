import express from "express";
import {
    registerUser,
    loginUser,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from "../controllers/user.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
// PDF Phase 1 Step 2: Employee self-registration using companyId
router.post("/register", registerUser);
router.post("/login",    loginUser);

// ── Admin-only routes ─────────────────────────────────────────────────────────
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

// PDF Phase 1 Note: Admin can also manually create managers/employees
router.post("/",       createUser);
router.get("/",        getAllUsers);
router.get("/:id",     getUserById);
router.patch("/:id",   updateUser);
router.delete("/:id",  deleteUser);

export default router;
