import express from "express";
import {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
} from "../controllers/notification.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

// Any authenticated user — their own notifications
router.get("/", authorizeRoles("admin", "employee"), getMyNotifications);
router.patch("/read-all",  authorizeRoles("admin", "employee"), markAllAsRead);
router.patch("/:id/read",  authorizeRoles("admin", "employee"), markAsRead);

export default router;