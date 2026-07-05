import mongoose from "mongoose";

/*
 * Message — a single chat message inside a Conversation.
 *
 * deletedFor  — array of userIds who chose "Delete for me".
 *               The message still exists in DB; the frontend
 *               filters it out when rendering for those users.
 *
 * deletedForEveryone — set by sender within the configurable
 *               deletion window (default: 60 minutes after send).
 *               When true the content is replaced with a tombstone
 *               and the frontend renders "This message was deleted."
 *
 * replyTo     — ObjectId reference to the parent Message.
 *               Stored as a ref so the frontend can render a
 *               quoted preview without embedding the full parent.
 */
const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        /*
         * content — plain text body of the message. Required.
         */
        content: {
            type: String,
            trim: true,
            required: true,
        },

        /*
         * replyTo — shallow reference; the frontend fetches the
         * quoted preview from the already-loaded message list or
         * makes a single targeted GET if the parent is paginated away.
         */
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        /*
         * mentions — userIds @-mentioned in the message body.
         * Stored so the notification system can efficiently find
         * mentions without regex-scanning content on every read.
         */
        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // ── Soft-delete fields ──────────────────────────────────────
        deletedFor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        deletedForEveryone: {
            type: Boolean,
            default: false,
        },

        /*
         * deliveredAt — set by the server the first time the message
         * is delivered to any recipient's socket.  Used as a fallback
         * "delivered" timestamp if per-user MessageRead records are
         * not yet created (e.g., recipient is offline).
         */
        deliveredAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Primary access pattern: fetch a page of messages for a conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Mention lookups for notification fan-out
messageSchema.index({ mentions: 1, createdAt: -1 }, { sparse: true });

// Sender's own messages (for "delete for everyone" ownership check)
messageSchema.index({ senderId: 1, conversationId: 1, createdAt: -1 });

export const Message = mongoose.model("Message", messageSchema);
