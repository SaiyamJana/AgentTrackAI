import mongoose from "mongoose";

/*
 * MessageRead — tracks whether a specific user has seen a specific message.
 *
 * Why a separate collection (not embedded in Message)?
 *
 *   In a group chat with 20 members, embedding read receipts inside
 *   Message would mean the message document grows by 20 entries and
 *   every "mark as read" call rewrites the entire message document.
 *   A separate collection lets us:
 *     - Insert one tiny document per user per message (cheap write)
 *     - Query "unread count for user X in conversation Y" with a
 *       single indexed count query (no message doc scan)
 *     - Fan-out "seen by" info to the sender via a targeted query
 *
 * deliveredAt  — when the message arrived in the user's socket/client.
 *                Set server-side on socket delivery; if the user was
 *                offline it is set when they reconnect and pull history.
 *
 * seenAt       — when the user actually viewed the message (chat window
 *                was open and the message scrolled into the viewport).
 *                Sent from the client as an explicit "mark seen" event.
 */
const messageReadSchema = new mongoose.Schema(
    {
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            required: true,
        },

        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        deliveredAt: {
            type: Date,
            default: null,
        },

        seenAt: {
            type: Date,
            default: null,
        },
    },
    {
        /*
         * Disable createdAt/updatedAt — we only care about deliveredAt
         * and seenAt which carry more semantic meaning.
         */
        timestamps: false,
    }
);

// One receipt record per user per message
messageReadSchema.index(
    { messageId: 1, userId: 1 },
    { unique: true }
);

// Unread count query: "messages in this conversation that have no seenAt for this user"
messageReadSchema.index({ conversationId: 1, userId: 1, seenAt: 1 });

// "Seen by" query: "who has seen this message?"
messageReadSchema.index({ messageId: 1, seenAt: 1 });

export const MessageRead = mongoose.model("MessageRead", messageReadSchema);
