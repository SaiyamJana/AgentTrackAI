import mongoose from "mongoose";

/*
 * Conversation — the top-level chat container.
 *
 * type:
 *   "direct"        — 1-to-1 between two users
 *   "project_group" — auto-created when a Project is created;
 *                     members = manager + all project employees
 *   "task_group"    — auto-created when a Task is created;
 *                     members = subManager + teamMembers + project manager
 *
 * Every conversation is always scoped to a company (companyId).
 * Every conversation is linked to either a project, a task, or both
 * so the permission engine always has context to validate membership.
 *
 * Direct messages also carry projectId/taskId — the context where the
 * two users discovered each other — so the permission system can verify
 * they are allowed to chat.
 */
const conversationSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },

        type: {
            type: String,
            enum: ["direct", "project_group", "task_group"],
            required: true,
        },

        /*
         * name — only meaningful for group chats.
         * Auto-set to project/task title on creation.
         * null for direct conversations.
         */
        name: {
            type: String,
            trim: true,
            default: null,
        },

        /*
         * members — all participants who can send/receive messages.
         * For groups this is kept in sync whenever members are
         * added/removed from the underlying project or task.
         */
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        /*
         * Context references — at least one must be set.
         * project_group → projectId required, taskId null
         * task_group    → taskId required, projectId set (parent project)
         * direct        → projectId or taskId set (where they met)
         */
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null,
        },
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            default: null,
        },

        /*
         * lastMessage — denormalized snapshot of the most recent message.
         * Stored here so the conversation list can render previews without
         * a separate messages query per conversation.
         */
        lastMessage: {
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
            content:  { type: String, default: null },
            sentAt:   { type: Date,   default: null },
        },

        /*
         * isActive — set to false when the linked project or task is deleted.
         * Archived conversations are hidden from the UI but messages are
         * preserved for audit purposes.
         */
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Fast lookup: all conversations a user is part of (conversation list load)
conversationSchema.index({ companyId: 1, members: 1, isActive: 1 });

// Accelerates the DM existence check in openDirectConversation(), which
// queries { type: "direct", members: { $all: [...], $size: 2 }, isActive }.
// True uniqueness for a DM pair is enforced at the application layer
// (see chat.controller.js openDirectConversation) since Mongo cannot
// express "exactly these two members" as a unique index constraint.
conversationSchema.index({ type: 1, members: 1, isActive: 1 });

// One group per project / one group per task
conversationSchema.index(
    { type: 1, projectId: 1 },
    { unique: true, partialFilterExpression: { type: "project_group" } }
);
conversationSchema.index(
    { type: 1, taskId: 1 },
    { unique: true, partialFilterExpression: { type: "task_group" } }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
