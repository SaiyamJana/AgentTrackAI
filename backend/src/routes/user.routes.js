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

// Public
router.post("/register", registerUser);
router.post("/login",    loginUser);

// Admin only
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.post("/",      createUser);   // Admin manually creates employee
router.get("/",       getAllUsers);
router.get("/:id",    getUserById);
router.patch("/:id",  updateUser);
router.delete("/:id", deleteUser);

export default router;