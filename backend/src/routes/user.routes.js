import express from "express";
import {
    registerUser,
    loginUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
} from "../controllers/user.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login",    loginUser);

// Admin only
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.get("/",       getAllUsers);
router.get("/:id",    getUserById);
router.patch("/:id",  updateUser);   // name/dept/designation/isActive only — no role field
router.delete("/:id", deleteUser);

export default router;
