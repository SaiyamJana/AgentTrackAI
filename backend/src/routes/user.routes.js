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

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Admin protected routes
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.get("/",        getAllUsers);
router.get("/:id",     getUserById);
router.patch("/:id",   updateUser);
router.delete("/:id",  deleteUser);

export default router;