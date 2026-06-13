import mongoose, { Schema } from 'mongoose';

const risksSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: false
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    category: {
        type: String,
        enum: ["overdue_task", "delayed_project", "overloaded_team"],
        default: "overdue_task"
    },
    riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    recommendation: {
        type: String,
        required: true
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

risksSchema.index({ projectId: 1, resolved: 1 });
risksSchema.index({ companyId: 1, riskLevel: 1 });
risksSchema.index({ taskId: 1 });

export const Risk = mongoose.model("Risk", risksSchema);