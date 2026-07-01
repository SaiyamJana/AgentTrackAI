import { Server }          from "socket.io";
import { socketAuth }      from "./socketAuth.js";
import {
    assertConversationAccess,
    getAdminGroupConversationIds,
} from "./chatPermissions.js";
import { Conversation }    from "../models/Conversation.js";
import { Message }         from "../models/Message.js";
import { MessageRead }     from "../models/MessageRead.js";
import { Notification }    from "../models/Notification.js";
import { User }            from "../models/User.js";

/*
 * onlineUsers — in-memory map: userId (string) → Set of socketIds.
 *
 * A user can have multiple browser tabs/devices connected simultaneously,
 * so we map to a Set.  When the Set becomes empty the user goes offline.
 *
 * This is intentionally in-memory (not Redis) for simplicity.  A
 * production cluster would need Redis pub/sub; for a single-process
 * Node server this is correct and performant.
 */
const onlineUsers = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────────

const addOnlineUser = (userId, socketId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
    const sockets = onlineUsers.get(userId);
    if (!sockets) return;
    sockets.delete(socketId);
    if (sockets.size === 0) onlineUsers.delete(userId);
};

const isOnline = (userId) => onlineUsers.has(String(userId));

/*
 * getUserConversationIds(userId)
 * Returns all active conversation IDs the user belongs to via membership.
 * Used at connect-time to auto-join all rooms.
 */
const getUserConversationIds = async (userId) => {
    const convs = await Conversation.find({
        members: userId,
        isActive: true,
    }).select("_id").lean();
    return convs.map((c) => String(c._id));
};

/*
 * getRoomIdsForUser(user)
 * Role-aware room resolution — mirrors assertConversationAccess:
 *   - Employees/managers/sub-managers: rooms from conversation membership.
 *   - Admin: rooms from EVERY Project Group + Task Group in their company
 *            (company-wide access, no membership row required). Direct
 *            Messages are never included for Admin.
 * Used at connect-time to decide which "conv:*" rooms a socket should join.
 */
const getRoomIdsForUser = async (user) => {
    if (user.role === "admin") {
        return getAdminGroupConversationIds(user.companyId);
    }
    return getUserConversationIds(user._id);
};

/*
 * broadcastOnlineStatus(io, user, status)
 * Emits "user:status" to every room the user has access to,
 * so all their contacts (or, for Admin, every group chat) see the
 * online/offline change.
 */
const broadcastOnlineStatus = async (io, user, status) => {
    const convIds = await getRoomIdsForUser(user);
    for (const convId of convIds) {
        io.to(`conv:${convId}`).emit("user:status", {
            userId: String(user._id),
            status,        // "online" | "offline"
            lastSeen: status === "offline" ? new Date() : null,
        });
    }
};

/*
 * createNotification(params)
 * Thin wrapper around Notification.create that also pushes a real-time
 * "notification:new" event to the recipient if they're connected.
 */
const createNotification = async (io, { userId, companyId, type, title, message, relatedEntity }) => {
    const notif = await Notification.create({
        userId,
        companyId,
        type,
        title,
        message,
        relatedEntity,
        read: false,
    });

    // Push to the user's personal room (joined in the connect handler)
    io.to(`user:${String(userId)}`).emit("notification:new", notif);
    return notif;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main init function — call this ONCE from server.js with the httpServer
// ─────────────────────────────────────────────────────────────────────────────

export const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
        /*
         * pingTimeout / pingInterval — keep-alive settings.
         * 25s ping interval, 60s timeout before the server declares
         * the client disconnected.  These are slightly more generous
         * than the defaults to handle slower connections.
         */
        pingTimeout:  60000,
        pingInterval: 25000,
    });

    // ── Authentication middleware — runs on every connection ─────────────────
    io.use(socketAuth);

    // ── Connection handler ───────────────────────────────────────────────────
    io.on("connection", async (socket) => {
        const user = socket.user; // populated by socketAuth
        const userId = String(user._id);

        console.log(`[Socket] Connected: ${user.name} (${userId})`);

        // 1. Register in online map
        addOnlineUser(userId, socket.id);

        // 2. Join personal room — used for targeted notifications
        socket.join(`user:${userId}`);

        // 3. Auto-join conversation rooms.
        //    - Employees/managers/sub-managers: rooms from membership.
        //    - Admin: every Project Group + Task Group room in their
        //      company, PLUS a company-wide "admin:<companyId>" room so
        //      newly-created group chats can be socketsJoin()-ed onto
        //      this socket later without a reconnect (see chat.controller.js
        //      createProjectGroupChat / createTaskGroupChat).
        try {
            if (user.role === "admin") {
                socket.join(`admin:${String(user.companyId)}`);
            }
            const convIds = await getRoomIdsForUser(user);
            for (const convId of convIds) {
                socket.join(`conv:${convId}`);
            }
        } catch (err) {
            console.error(`[Socket] Room join error for ${userId}:`, err.message);
        }

        // 4. Broadcast online status to all conversation partners
        //    (for Admin: to every group chat room, since Admin isn't a
        //    "member" but employees should still see Admin's presence).
        try {
            await broadcastOnlineStatus(io, user, "online");
        } catch (err) {
            console.error(`[Socket] Status broadcast error:`, err.message);
        }

        // 5. Send the current online-users list to THIS socket only
        //    (so the client can render which contacts are online immediately)
        socket.emit("users:online", [...onlineUsers.keys()]);

        // ── Event: join a specific conversation room ──────────────────────────
        // Called by the client when it opens a conversation window.
        // We re-verify membership here even though the user joined all rooms
        // at connect-time — this is a safe guard for rooms added after connect.
        socket.on("conv:join", async ({ conversationId }, callback) => {
            try {
                await assertConversationAccess(conversationId, user);
                socket.join(`conv:${conversationId}`);
                if (callback) callback({ success: true });
            } catch (err) {
                if (callback) callback({ success: false, message: err.message });
            }
        });

        // ── Event: send a message ─────────────────────────────────────────────
        socket.on("message:send", async (payload, callback) => {
            try {
                const { conversationId, content, replyTo = null, mentions = [] } = payload;

                // 1. Permission — member (employee/manager/sub-manager) OR
                //    Admin with company-wide access to this group conversation.
                const conv = await assertConversationAccess(conversationId, user);

                // 2. Validate — message content is required
                if (!content?.trim()) {
                    throw new Error("Message content is required");
                }

                // 3. Save to DB
                const message = await Message.create({
                    conversationId,
                    senderId: user._id,
                    content:     content.trim(),
                    replyTo:     replyTo || null,
                    mentions:    mentions || [],
                    deliveredAt: new Date(),
                });

                // 4. Populate sender for broadcast
                const populated = await Message.findById(message._id)
                    .populate("senderId", "name email")
                    .populate("replyTo", "content senderId createdAt")
                    .lean();

                // 5. Update conversation lastMessage snapshot
                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: {
                        senderId: user._id,
                        content:  content.trim(),
                        sentAt:   message.createdAt,
                    },
                });

                // 6. Broadcast to everyone in the room (including sender)
                io.to(`conv:${conversationId}`).emit("message:new", populated);

                // 7. Create MessageRead "delivered" records for all members
                //    who are currently online (offline members get theirs
                //    when they reconnect and pull history).
                const onlineMembers = conv.members.filter(
                    (m) => String(m) !== userId && isOnline(m)
                );
                if (onlineMembers.length > 0) {
                    await MessageRead.insertMany(
                        onlineMembers.map((memberId) => ({
                            messageId:      message._id,
                            conversationId: conv._id,
                            userId:         memberId,
                            deliveredAt:    new Date(),
                        })),
                        { ordered: false }
                    );
                }

                // 8. Notifications for offline members + @mentions
                const offlineMembers = conv.members.filter(
                    (m) => String(m) !== userId && !isOnline(m)
                );

                const mentionSet = new Set(mentions.map(String));

                // Batch-fetch companyId for every member who might need a
                // notification, instead of one User.findById per member
                // (avoids N+1 queries on large group chats).
                const membersNeedingNotif = conv.members.filter((m) => String(m) !== userId);
                const memberDocs = await User.find({ _id: { $in: membersNeedingNotif } })
                    .select("companyId")
                    .lean();
                const companyIdByMember = new Map(
                    memberDocs.map((m) => [String(m._id), m.companyId])
                );

                for (const memberId of conv.members) {
                    if (String(memberId) === userId) continue;

                    const isMentioned = mentionSet.has(String(memberId));
                    const isOffline   = !isOnline(memberId);
                    const companyId   = companyIdByMember.get(String(memberId));
                    if (!companyId) continue; // member doc missing — skip notification safely

                    // Send mention notification regardless of online status
                    if (isMentioned) {
                        await createNotification(io, {
                            userId:     memberId,
                            companyId,
                            type:       "chat_mention",
                            title:      `${user.name} mentioned you`,
                            message:    content.slice(0, 100),
                            relatedEntity: { type: "conversation", id: conv._id },
                        });
                    } else if (isOffline) {
                        // New message notification for offline non-mentioned members
                        const convName = conv.name || user.name;
                        await createNotification(io, {
                            userId:     memberId,
                            companyId,
                            type:       "chat_message",
                            title:      `New message in ${convName}`,
                            message:    content.slice(0, 100),
                            relatedEntity: { type: "conversation", id: conv._id },
                        });
                    }
                }

                if (callback) callback({ success: true, message: populated });
            } catch (err) {
                console.error("[Socket] message:send error:", err.message);
                if (callback) callback({ success: false, message: err.message });
            }
        });

        // ── Event: typing indicator ───────────────────────────────────────────
        socket.on("typing:start", async ({ conversationId }) => {
            try {
                await assertConversationAccess(conversationId, user);
                socket.to(`conv:${conversationId}`).emit("typing:start", {
                    conversationId,
                    userId,
                    name: user.name,
                });
            } catch { /* silent — typing events are non-critical */ }
        });

        socket.on("typing:stop", async ({ conversationId }) => {
            try {
                socket.to(`conv:${conversationId}`).emit("typing:stop", {
                    conversationId,
                    userId,
                });
            } catch { /* silent */ }
        });

        // ── Event: mark messages as seen ─────────────────────────────────────
        // Client sends this when the user has the conversation open and
        // new messages scroll into view.
        socket.on("messages:seen", async ({ conversationId, messageIds }, callback) => {
            try {
                await assertConversationAccess(conversationId, user);

                const now = new Date();

                // Upsert read receipts for all provided messageIds
                await MessageRead.bulkWrite(
                    messageIds.map((msgId) => ({
                        updateOne: {
                            filter: { messageId: msgId, userId: user._id },
                            update: {
                                $set:      { seenAt: now, conversationId },
                                $setOnInsert: { deliveredAt: now },
                            },
                            upsert: true,
                        },
                    }))
                );

                // Notify the sender(s) that their messages were seen
                socket.to(`conv:${conversationId}`).emit("messages:seen", {
                    conversationId,
                    messageIds,
                    seenBy: userId,
                    seenAt: now,
                });

                if (callback) callback({ success: true });
            } catch (err) {
                if (callback) callback({ success: false, message: err.message });
            }
        });

        // ── Event: delete message for everyone ───────────────────────────────
        socket.on("message:delete", async ({ messageId, deleteForEveryone = false }, callback) => {
            try {
                const message = await Message.findById(messageId);
                if (!message) throw new Error("Message not found");

                // Must be a member OR Admin with company-wide group access
                await assertConversationAccess(String(message.conversationId), user);

                if (deleteForEveryone) {
                    // Only the sender can delete for everyone, within 60 minutes
                    if (String(message.senderId) !== userId) {
                        throw new Error("Only the sender can delete a message for everyone");
                    }
                    const sixtyMins = 60 * 60 * 1000;
                    if (Date.now() - message.createdAt.getTime() > sixtyMins) {
                        throw new Error("Delete for everyone is only available within 60 minutes of sending");
                    }
                    message.deletedForEveryone = true;
                    message.content = null;
                    await message.save();

                    io.to(`conv:${String(message.conversationId)}`).emit("message:deleted", {
                        messageId,
                        conversationId: String(message.conversationId),
                        deleteForEveryone: true,
                    });
                } else {
                    // Delete for me only
                    if (!message.deletedFor.includes(user._id)) {
                        message.deletedFor.push(user._id);
                        await message.save();
                    }
                    // Only emit to this socket — others don't see this action
                    socket.emit("message:deleted", {
                        messageId,
                        conversationId: String(message.conversationId),
                        deleteForEveryone: false,
                    });
                }

                if (callback) callback({ success: true });
            } catch (err) {
                if (callback) callback({ success: false, message: err.message });
            }
        });

        // ── Event: request current online status of specific users ────────────
        // Client calls this to populate the online dots in a member list.
        socket.on("users:status", ({ userIds }, callback) => {
            const result = {};
            for (const uid of userIds) {
                result[uid] = isOnline(uid) ? "online" : "offline";
            }
            if (callback) callback(result);
        });

        // ── Disconnect ────────────────────────────────────────────────────────
        socket.on("disconnect", async (reason) => {
            console.log(`[Socket] Disconnected: ${user.name} (${userId}) — ${reason}`);

            removeOnlineUser(userId, socket.id);

            // Only broadcast offline if ALL tabs/devices are gone
            if (!isOnline(userId)) {
                try {
                    await broadcastOnlineStatus(io, user, "offline");
                } catch (err) {
                    console.error(`[Socket] Offline broadcast error:`, err.message);
                }
            }
        });
    });

    console.log("[Socket] Socket.IO initialized");
    return io;
};

/*
 * getIO() — for controllers that need to emit socket events
 * (e.g., chat.controller.js auto-emits after REST message creation).
 *
 * This is set once by initSocket and exported so the rest of the app
 * can access the io instance without circular imports.
 */
let _io = null;
export const setIO  = (io) => { _io = io; };
export const getIO  = ()   => _io;
