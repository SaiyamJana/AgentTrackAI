import express from "express";
import {
    getMyConversations,
    openDirectConversation,
    getConversationById,
    createProjectGroupChat,
    createTaskGroupChat,
    getMessages,
    sendMessage,
    deleteMessage,
    markMessagesSeen,
    searchMessages,
    globalSearch,
    getTaskChatMembers,
    getProjectChatMembers,
} from "../controllers/chat.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All chat routes require a valid JWT
router.use(verifyJWT);

// ── Conversations ─────────────────────────────────────────────────────────────
// GET  /api/v1/chat/conversations           — sidebar list with unread counts
router.get(
    "/conversations",
    authorizeRoles("admin", "employee"),
    getMyConversations
);

// POST /api/v1/chat/conversations/direct    — open or get a 1-to-1 DM
router.post(
    "/conversations/direct",
    authorizeRoles("admin", "employee"),
    openDirectConversation
);

// POST /api/v1/chat/conversations/project-group  — create project group chat
// (called internally from project.controller.js — also exposed as REST for admin tools)
router.post(
    "/conversations/project-group",
    authorizeRoles("admin", "employee"),
    createProjectGroupChat
);

// POST /api/v1/chat/conversations/task-group     — create task group chat
// (called internally from task.controller.js)
router.post(
    "/conversations/task-group",
    authorizeRoles("admin", "employee"),
    createTaskGroupChat
);

// GET  /api/v1/chat/conversations/:id      — single conversation detail
router.get(
    "/conversations/:id",
    authorizeRoles("admin", "employee"),
    getConversationById
);

// ── Messages ──────────────────────────────────────────────────────────────────
// GET    /api/v1/chat/conversations/:id/messages?before=<id>&limit=30
router.get(
    "/conversations/:id/messages",
    authorizeRoles("admin", "employee"),
    getMessages
);

// POST   /api/v1/chat/conversations/:id/messages  — REST fallback send
router.post(
    "/conversations/:id/messages",
    authorizeRoles("admin", "employee"),
    sendMessage
);

// POST   /api/v1/chat/conversations/:id/seen
router.post(
    "/conversations/:id/seen",
    authorizeRoles("admin", "employee"),
    markMessagesSeen
);

// GET    /api/v1/chat/conversations/:id/search?q=
router.get(
    "/conversations/:id/search",
    authorizeRoles("admin", "employee"),
    searchMessages
);

// DELETE /api/v1/chat/messages/:messageId?everyone=true|false
router.delete(
    "/messages/:messageId",
    authorizeRoles("admin", "employee"),
    deleteMessage
);

// ── Global search ─────────────────────────────────────────────────────────────
// GET /api/v1/chat/search?q=
router.get(
    "/search",
    authorizeRoles("admin", "employee"),
    globalSearch
);

// ── Chat member context panels ────────────────────────────────────────────────
// GET /api/v1/chat/task/:taskId/members
router.get(
    "/task/:taskId/members",
    authorizeRoles("admin", "employee"),
    getTaskChatMembers
);

// GET /api/v1/chat/project/:projectId/members
router.get(
    "/project/:projectId/members",
    authorizeRoles("admin", "employee"),
    getProjectChatMembers
);

export default router;
