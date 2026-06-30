import mongoose, { Schema } from 'mongoose';

const activityLogsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: false, // some actions (e.g. employee-level) may not be project-scoped
    },
    action: {
        type: String,
        enum: [
            "project_created",
            "project_updated",
            "project_status_changed",
            "manager_assigned",
            "employee_assigned",
            "employee_removed",
            "task_created",
            "task_updated",
            "task_deleted",
            "task_member_added",
            "task_member_removed",
            "task_progress_updated",
            "task_completed",
            "project_completed",
            "project_deleted",
        ],
        required: true,
    },
    entityType: {
        type: String,
        enum: ["Project", "Task", "EmployeeProject"],
        required: true,
    },
    entityId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    details: {
        type: String,
        trim: true,
    },
    adminOnly: {
        type: Boolean,
        default: false, // true = hidden from manager view
    },
}, { timestamps: true });

activityLogsSchema.index({ companyId: 1, projectId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogsSchema);