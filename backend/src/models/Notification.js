import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    type: {
    type: String,
    enum: [
      "risk_detected", "task_assigned", "task_updated", "task_completed", "task_removed",
      "task_deleted", "task_member_added", "task_member_removed", "task_progress_updated",
      "project_assigned", "project_removed", "manager_promoted", "role_changed",
      "project_status_changed", "project_completed", "report_ready", "workload_alert",
      // ── Chat notifications ────────────────────────────────────────
      "chat_message",  // new message in a DM or group the user is in
      "chat_mention"   // user was @-mentioned in a message
    ],
    required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    relatedEntity: {
        type: {
            type: String,
            enum: ["risk", "task", "project", "report", "conversation"],
        },
        id: {
            type: Schema.Types.ObjectId,
        }
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ companyId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);