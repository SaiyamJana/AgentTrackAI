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
        enum: ["risk_detected", "task_assigned", "task_completed", "project_assigned", "manager_promoted", "report_ready", "workload_alert"],
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
            enum: ["risk", "task", "project", "report"],
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