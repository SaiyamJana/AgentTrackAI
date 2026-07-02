// chat.controller.js
import mongoose                from "mongoose";
import { Conversation }        from "../models/Conversation.js";
import { Message }             from "../models/Message.js";
import { MessageRead }         from "../models/MessageRead.js";
import { User }                from "../models/User.js";
import { Task }                from "../models/Task.js";
import { Project }             from "../models/Project.js";
import { EmployeeProject }     from "../models/EmployeeProject.js";
import { ApiError }            from "../utils/ApiError.js";
import { ApiResponse }         from "../utils/ApiResponse.js";
import { asyncHandler }        from "../utils/asyncHandler.js";
import {
    canUsersChat,
    assertConversationAccess,
    getAdminGroupConversationIds,
    syncTaskGroupMembers,
    syncProjectGroupMembers,
} from "../socket/chatPermissions.js";
import { getIO }               from "../socket/socket.js";

const PAGE_SIZE = 30; // messages per page

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/*
 * unreadCountsForUser(userId, conversationIds)
 * Returns a Map<convId, unreadCount> for sidebar badges.
 *
 * Strategy: count messages in each conversation that have NO MessageRead
 * record with seenAt set for this user.  We use an aggregation pipeline
 * so this is a single DB round-trip regardless of how many conversations.
 */
const unreadCountsForUser = async (userId, conversationIds) => {
    // Get the IDs of all messages the user has already seen
    const seenMsgIds = await MessageRead.distinct("messageId", {
        userId,
        conversationId: { $in: conversationIds },
        seenAt: { $ne: null },
    });

    // Count unseen messages per conversation
    const results = await Message.aggregate([
        {
            $match: {
                conversationId: { $in: conversationIds },
                senderId:       { $ne: userId },              // don't count own messages
                _id:            { $nin: seenMsgIds },
                deletedForEveryone: false,
                deletedFor:     { $ne: userId },
            },
        },
        {
            $group: { _id: "$conversationId", count: { $sum: 1 } },
        },
    ]);

    const map = new Map();
    for (const r of results) map.set(String(r._id), r.count);
    return map;
};

// ─────────────────────────────────────────────────────────────────────────────
// Conversation endpoints
// ─────────────────────────────────────────────────────────────────────────────

/*
 * GET /api/v1/chat/conversations
 * Returns all active conversations the requester is a member of,
 * sorted by lastMessage.sentAt desc.  Includes unread badge counts.
 */
export const getMyConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // ── ADMIN: company-wide view of every Project Group + Task Group ────────
    // Admin is NOT inserted into `members`, so we query by companyId + type
    // instead. Direct Messages are never returned to Admin. Unread counts
    // are intentionally always 0 for Admin — Admin browsing group chats
    // should not create per-message "unread" badges across the whole company.
    if (req.user.role === "admin") {
        const conversations = await Conversation.find({
            companyId: req.user.companyId,
            type:      { $in: ["project_group", "task_group"] },
            isActive:  true,
        })
            .populate("members", "name email")
            .populate("lastMessage.senderId", "name")
            .sort({ "lastMessage.sentAt": -1 })
            .lean();

        const withBadges = conversations.map((c) => ({ ...c, unreadCount: 0 }));

        return res.status(200).json(
            new ApiResponse(200, withBadges, "Conversations fetched successfully")
        );
    }

    // ── EMPLOYEE / MANAGER / SUB-MANAGER: membership-based listing ─────────
    const conversations = await Conversation.find({
        members:  userId,
        isActive: true,
    })
        .populate("members", "name email")
        .populate("lastMessage.senderId", "name")
        .sort({ "lastMessage.sentAt": -1 })
        .lean();

    const convIds = conversations.map((c) => c._id);
    const unread  = await unreadCountsForUser(userId, convIds);

    const withBadges = conversations.map((c) => ({
        ...c,
        unreadCount: unread.get(String(c._id)) ?? 0,
    }));

    return res.status(200).json(
        new ApiResponse(200, withBadges, "Conversations fetched successfully")
    );
});

/*
 * POST /api/v1/chat/conversations/direct
 * Open (or retrieve existing) a 1-to-1 DM with another user.
 *
 * Body: { targetUserId, contextProjectId?, contextTaskId? }
 *
 * The contextProjectId / contextTaskId is where the two users discovered
 * each other.  Used by the permission engine to verify the relationship.
 */
export const openDirectConversation = asyncHandler(async (req, res) => {
    const { targetUserId, contextProjectId, contextTaskId } = req.body;

    if (!targetUserId) throw new ApiError(400, "targetUserId is required");
    if (!contextProjectId && !contextTaskId)
        throw new ApiError(400, "contextProjectId or contextTaskId is required");

    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) throw new ApiError(404, "Target user not found");

    // Permission check — both directions
    const { allowed, reason } = await canUsersChat(req.user, targetUser);
    if (!allowed) throw new ApiError(403, reason);

    // Check if a DM already exists between these two users
    const existingConv = await Conversation.findOne({
        type:     "direct",
        members:  { $all: [req.user._id, targetUserId], $size: 2 },
        isActive: true,
    })
        .populate("members", "name email")
        .lean();

    if (existingConv) {
        return res.status(200).json(
            new ApiResponse(200, existingConv, "Existing conversation retrieved")
        );
    }

    // Create new DM
    const conv = await Conversation.create({
        companyId: req.user.companyId,
        type:      "direct",
        members:   [req.user._id, targetUserId],
        projectId: contextProjectId || null,
        taskId:    contextTaskId    || null,
    });

    const populated = await Conversation.findById(conv._id)
        .populate("members", "name email")
        .lean();

    // Tell both participants' sockets about the new conversation. The
    // initiator needs this too (not just the target) so that other tabs/
    // devices they're logged in on stay in sync — the tab that made this
    // very request updates its own local state directly (see
    // openDirectConversation in api.js / MemberListWithChat.jsx).
    const io = getIO();
    if (io) {
        io.to(`user:${String(targetUserId)}`).emit("conv:new", populated);
        io.to(`user:${String(req.user._id)}`).emit("conv:new", populated);
    }

    return res.status(201).json(
        new ApiResponse(201, populated, "Direct conversation created")
    );
});

/*
 * GET /api/v1/chat/conversations/:id
 * Get a single conversation with full member details.
 * Caller must be a member.
 */
export const getConversationById = asyncHandler(async (req, res) => {
    await assertConversationAccess(req.params.id, req.user);

    const conv = await Conversation.findById(req.params.id)
        .populate("members",           "name email designation department")
        .populate("lastMessage.senderId", "name")
        .lean();

    if (!conv) throw new ApiError(404, "Conversation not found");

    return res.status(200).json(
        new ApiResponse(200, conv, "Conversation fetched")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Auto-creation helpers (called from project / task controllers)
// ─────────────────────────────────────────────────────────────────────────────

/*
 * POST /api/v1/chat/conversations/project-group
 * Internal helper — called by project.controller.js after createProject.
 * Creates the project group chat if it doesn't already exist.
 *
 * Body: { projectId }
 * Auth: admin only (called server-to-server style from project controller)
 */
export const createProjectGroupChat = asyncHandler(async (req, res) => {
    const { projectId } = req.body;
    if (!projectId) throw new ApiError(400, "projectId is required");

    // Idempotent — don't duplicate
    const existing = await Conversation.findOne({ type: "project_group", projectId });
    if (existing) {
        return res.status(200).json(
            new ApiResponse(200, existing, "Project group chat already exists")
        );
    }

    const project = await Project.findById(projectId).lean();
    if (!project) throw new ApiError(404, "Project not found");

    // Seed with all current project members
    const members = await EmployeeProject.find({ projectId, isActive: true })
        .select("employeeId").lean();
    const memberIds = members.map((m) => m.employeeId);

    const conv = await Conversation.create({
        companyId: project.companyId,
        type:      "project_group",
        name:      `${project.title} — Project Chat`,
        members:   memberIds,
        projectId,
    });

    // Push to all members' sockets. Admin isn't a member, but has
    // company-wide access — notify the admin room and pull any
    // already-connected admin sockets into the new room so live updates
    // work without a reconnect.
    const io = getIO();
    if (io) {
        for (const memberId of memberIds) {
            io.to(`user:${String(memberId)}`).emit("conv:new", conv);
        }
        const adminRoom = `admin:${String(project.companyId)}`;
        io.to(adminRoom).emit("conv:new", conv);
        io.in(adminRoom).socketsJoin(`conv:${String(conv._id)}`);
    }

    return res.status(201).json(
        new ApiResponse(201, conv, "Project group chat created")
    );
});

/*
 * POST /api/v1/chat/conversations/task-group
 * Internal helper — called by task.controller.js after createTask.
 * Creates the task group chat if it doesn't already exist.
 *
 * Body: { taskId }
 */
export const createTaskGroupChat = asyncHandler(async (req, res) => {
    const { taskId } = req.body;
    if (!taskId) throw new ApiError(400, "taskId is required");

    const existing = await Conversation.findOne({ type: "task_group", taskId });
    if (existing) {
        return res.status(200).json(
            new ApiResponse(200, existing, "Task group chat already exists")
        );
    }

    const task = await Task.findById(taskId).lean();
    if (!task) throw new ApiError(404, "Task not found");

    const project = await Project.findById(task.projectId).lean();
    if (!project) throw new ApiError(404, "Parent project not found");

    // Members: subManager + teamMembers + project manager
    const memberSet = new Set([
        String(task.subManagerId),
        ...task.teamMembers.map(String),
        String(project.managerId),
    ]);

    const conv = await Conversation.create({
        companyId: task.companyId,
        type:      "task_group",
        name:      `${task.title} — Task Chat`,
        members:   [...memberSet],
        projectId: task.projectId,
        taskId,
    });

    const io = getIO();
    if (io) {
        for (const memberId of memberSet) {
            io.to(`user:${memberId}`).emit("conv:new", conv);
        }
        const adminRoom = `admin:${String(task.companyId)}`;
        io.to(adminRoom).emit("conv:new", conv);
        io.in(adminRoom).socketsJoin(`conv:${String(conv._id)}`);
    }

    return res.status(201).json(
        new ApiResponse(201, conv, "Task group chat created")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Message endpoints
// ─────────────────────────────────────────────────────────────────────────────

/*
 * GET /api/v1/chat/conversations/:id/messages?before=<messageId>&limit=30
 *
 * Paginated message history — cursor-based using the message _id.
 * - First load: omit `before` — returns the 30 most recent messages.
 * - Subsequent pages: pass the oldest messageId from the previous page.
 *
 * Messages where:
 *   - deletedForEveryone = true  → content replaced with tombstone
 *   - sender is in deletedFor[]  → filtered out (only for that user)
 */
export const getMessages = asyncHandler(async (req, res) => {
    const { id: conversationId } = req.params;
    const { before, limit = PAGE_SIZE } = req.query;

    await assertConversationAccess(conversationId, req.user);

    const filter = {
        conversationId,
        deletedFor: { $ne: req.user._id },
    };
    if (before) {
        filter._id = { $lt: new mongoose.Types.ObjectId(before) };
    }

    const messages = await Message.find(filter)
        .populate("senderId", "name email")
        .populate("replyTo",  "content senderId createdAt")
        .populate("mentions", "name")
        .sort({ _id: -1 })
        .limit(Number(limit))
        .lean();

    // Replace deleted-for-everyone content with tombstone
    const sanitized = messages.map((m) => {
        if (m.deletedForEveryone) {
            return {
                ...m,
                content:  null,
                _deleted: true,
            };
        }
        return m;
    });

    // Attach read receipts summary to each message
    const messageIds = sanitized.map((m) => m._id);
    const readReceipts = await MessageRead.find({
        messageId: { $in: messageIds },
        seenAt:    { $ne: null },
    })
        .select("messageId userId seenAt")
        .lean();

    const receiptMap = new Map();
    for (const r of readReceipts) {
        const key = String(r.messageId);
        if (!receiptMap.has(key)) receiptMap.set(key, []);
        receiptMap.get(key).push({ userId: r.userId, seenAt: r.seenAt });
    }

    const withReceipts = sanitized.map((m) => ({
        ...m,
        seenBy: receiptMap.get(String(m._id)) ?? [],
    }));

    // Mark retrieved messages as delivered for this user
    // (handles the offline → online case)
    const undelivered = await MessageRead.find({
        messageId:   { $in: messageIds },
        userId:      req.user._id,
        deliveredAt: null,
    }).select("_id").lean();

    if (undelivered.length > 0) {
        await MessageRead.updateMany(
            { _id: { $in: undelivered.map((r) => r._id) } },
            { $set: { deliveredAt: new Date() } }
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {
            messages: withReceipts.reverse(), // chronological order for UI
            hasMore:  messages.length === Number(limit),
        }, "Messages fetched")
    );
});

/*
 * POST /api/v1/chat/conversations/:id/messages
 * Send a message via REST (fallback for when Socket.IO is unavailable).
 *
 * Body: { content, replyTo?, mentions? }
 */
export const sendMessage = asyncHandler(async (req, res) => {
    const { id: conversationId } = req.params;
    const { content, replyTo, mentions = [] } = req.body;

    const conv = await assertConversationAccess(conversationId, req.user);

    if (!content?.trim()) {
        throw new ApiError(400, "Message content is required");
    }

    const message = await Message.create({
        conversationId,
        senderId:    req.user._id,
        content:     content.trim(),
        replyTo:     replyTo || null,
        mentions:    mentions || [],
        deliveredAt: new Date(),
    });

    const populated = await Message.findById(message._id)
        .populate("senderId", "name email")
        .populate("replyTo",  "content senderId createdAt")
        .lean();

    // Update lastMessage snapshot on conversation
    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
            senderId: req.user._id,
            content:  content.trim(),
            sentAt:   message.createdAt,
        },
    });

    // Emit to Socket.IO room so real-time clients get it instantly
    const io = getIO();
    if (io) {
        io.to(`conv:${conversationId}`).emit("message:new", populated);
    }

    return res.status(201).json(
        new ApiResponse(201, populated, "Message sent")
    );
});

/*
 * DELETE /api/v1/chat/messages/:messageId
 * Soft-delete a message.
 *
 * Query: ?everyone=true   → delete for everyone (sender only, within 60 min)
 *        ?everyone=false  → delete for me only
 */
export const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const deleteForEveryone = req.query.everyone === "true";

    const message = await Message.findById(messageId);
    if (!message) throw new ApiError(404, "Message not found");

    await assertConversationAccess(String(message.conversationId), req.user);

    if (deleteForEveryone) {
        if (String(message.senderId) !== String(req.user._id)) {
            throw new ApiError(403, "Only the sender can delete a message for everyone");
        }
        const sixtyMins = 60 * 60 * 1000;
        if (Date.now() - message.createdAt.getTime() > sixtyMins) {
            throw new ApiError(400, "Delete for everyone is only available within 60 minutes of sending");
        }
        message.deletedForEveryone = true;
        message.content            = null;
        await message.save();

        const io = getIO();
        if (io) {
            io.to(`conv:${String(message.conversationId)}`).emit("message:deleted", {
                messageId,
                conversationId:    String(message.conversationId),
                deleteForEveryone: true,
            });
        }
    } else {
        if (!message.deletedFor.map(String).includes(String(req.user._id))) {
            message.deletedFor.push(req.user._id);
            await message.save();
        }
    }

    return res.status(200).json(new ApiResponse(200, {}, "Message deleted"));
});

// ─────────────────────────────────────────────────────────────────────────────
// Read receipts
// ─────────────────────────────────────────────────────────────────────────────

/*
 * POST /api/v1/chat/conversations/:id/seen
 * Mark an array of messages as seen by the current user.
 * Body: { messageIds: string[] }
 */
export const markMessagesSeen = asyncHandler(async (req, res) => {
    const { id: conversationId } = req.params;
    const { messageIds }         = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new ApiError(400, "messageIds must be a non-empty array");
    }

    await assertConversationAccess(conversationId, req.user);

    const now = new Date();
    await MessageRead.bulkWrite(
        messageIds.map((msgId) => ({
            updateOne: {
                filter: { messageId: msgId, userId: req.user._id },
                update: {
                    $set:         { seenAt: now, conversationId },
                    $setOnInsert: { deliveredAt: now },
                },
                upsert: true,
            },
        }))
    );

    // Notify senders via socket
    const io = getIO();
    if (io) {
        io.to(`conv:${conversationId}`).emit("messages:seen", {
            conversationId,
            messageIds,
            seenBy: String(req.user._id),
            seenAt: now,
        });
    }

    return res.status(200).json(new ApiResponse(200, {}, "Messages marked as seen"));
});

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

/*
 * GET /api/v1/chat/conversations/:id/search?q=<query>
 * Full-text search within a single conversation.
 * Searches content field using MongoDB regex (case-insensitive).
 * Returns up to 20 results with surrounding context.
 */
export const searchMessages = asyncHandler(async (req, res) => {
    const { id: conversationId } = req.params;
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        throw new ApiError(400, "Search query must be at least 2 characters");
    }

    await assertConversationAccess(conversationId, req.user);

    const messages = await Message.find({
        conversationId,
        deletedForEveryone: false,
        deletedFor:         { $ne: req.user._id },
        content:            { $regex: q.trim(), $options: "i" },
    })
        .populate("senderId", "name email")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, messages, `Found ${messages.length} results`)
    );
});

/*
 * GET /api/v1/chat/search?q=<query>
 * Search across ALL conversations the user is in
 * (conversation names + message content).
 * Returns grouped results: { conversations: [], messages: [] }
 */
export const globalSearch = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
        throw new ApiError(400, "Search query must be at least 2 characters");
    }

    // Admin searches every Project Group + Task Group in the company
    // (never Direct Messages). Everyone else searches only conversations
    // they're a member of.
    const userConvIds = req.user.role === "admin"
        ? await getAdminGroupConversationIds(req.user.companyId)
        : await Conversation.distinct("_id", {
              members:  req.user._id,
              isActive: true,
          });

    // Matching conversations by name
    const matchingConvs = await Conversation.find({
        _id:  { $in: userConvIds },
        name: { $regex: q.trim(), $options: "i" },
    })
        .populate("members", "name email")
        .limit(10)
        .lean();

    // Matching messages across all user's conversations
    const matchingMessages = await Message.find({
        conversationId:     { $in: userConvIds },
        deletedForEveryone: false,
        deletedFor:         { $ne: req.user._id },
        content:            { $regex: q.trim(), $options: "i" },
    })
        .populate("senderId",       "name email")
        .populate("conversationId", "name type")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, {
            conversations: matchingConvs,
            messages:      matchingMessages,
        }, "Search results")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// Members helper for chat context in Task / Project views
// ─────────────────────────────────────────────────────────────────────────────

/*
 * GET /api/v1/chat/task/:taskId/members
 * Returns the members of a task with enough info to render the
 * "Task Members" chat-button panel.
 *
 * Each member includes:
 *   - Basic user info (name, email, designation)
 *   - Their role in this task (sub-manager | team-member)
 *   - The project manager info
 */
export const getTaskChatMembers = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
        .populate("subManagerId", "name email designation department")
        .populate("teamMembers",  "name email designation department")
        .populate("projectId",    "title managerId")
        .lean();

    if (!task) throw new ApiError(404, "Task not found");

    // Caller must be a member of this task
    const callerIsSubManager = String(task.subManagerId._id) === String(req.user._id);
    const callerIsTeamMember = task.teamMembers.some(
        (m) => String(m._id) === String(req.user._id)
    );
    const callerIsManager = await EmployeeProject.findOne({
        projectId:   task.projectId._id,
        employeeId:  req.user._id,
        projectRole: "manager",
        isActive:    true,
    }).lean();
    const callerIsAdmin = req.user.role === "admin";

    if (!callerIsSubManager && !callerIsTeamMember && !callerIsManager && !callerIsAdmin) {
        throw new ApiError(403, "You are not a member of this task");
    }

    const projectManager = await User.findById(task.projectId.managerId)
        .select("name email designation department")
        .lean();

    const members = [
        { ...task.subManagerId, taskRole: "sub-manager" },
        ...task.teamMembers.map((m) => ({ ...m, taskRole: "team-member" })),
    ];

    // Deduplicate (edge case: sub-manager also in teamMembers)
    const seen = new Set();
    const unique = members.filter((m) => {
        const key = String(m._id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return res.status(200).json(
        new ApiResponse(200, {
            taskId,
            taskTitle:      task.title,
            projectManager: { ...projectManager, taskRole: "project-manager" },
            members:        unique,
        }, "Task chat members fetched")
    );
});

/*
 * GET /api/v1/chat/project/:projectId/members
 * Returns all members of a project grouped by role.
 * Used by the Project detail view to render the "Project Members" chat panel.
 */
export const getProjectChatMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    // Caller must be in the project
    if (req.user.role !== "admin") {
        const membership = await EmployeeProject.findOne({
            projectId,
            employeeId: req.user._id,
            isActive:   true,
        }).lean();
        if (!membership) throw new ApiError(403, "You are not a member of this project");
    }

    const project = await Project.findById(projectId).lean();
    if (!project) throw new ApiError(404, "Project not found");

    const allMembers = await EmployeeProject.find({ projectId, isActive: true })
        .populate("employeeId", "name email designation department")
        .lean();

    const manager     = allMembers.find((m) => m.projectRole === "manager");
    const regularMembers = allMembers.filter((m) => m.projectRole !== "manager");

    // Find sub-managers: employees who are subManagerId on at least one task
    const subManagerIds = await Task.distinct("subManagerId", { projectId });
    const subManagerSet = new Set(subManagerIds.map(String));

    const subManagers = regularMembers.filter((m) =>
        subManagerSet.has(String(m.employeeId._id))
    );
    const employees = regularMembers.filter(
        (m) => !subManagerSet.has(String(m.employeeId._id))
    );

    return res.status(200).json(
        new ApiResponse(200, {
            projectId,
            projectTitle: project.title,
            manager:      manager ? { ...manager.employeeId, projectRole: "manager" } : null,
            subManagers:  subManagers.map((m) => ({ ...m.employeeId, projectRole: "sub-manager" })),
            employees:    employees.map((m) => ({ ...m.employeeId, projectRole: "member" })),
        }, "Project chat members fetched")
    );
});
