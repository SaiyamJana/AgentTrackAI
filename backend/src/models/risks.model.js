// {
// "_id": "ObjectId",
// "projectId": "ObjectId", // Reference to projects
// "taskId": "ObjectId", // Reference to tasks
// "riskLevel": "low" | "medium" | "high",
// "reason": "String",
// "recommendation": "String",
// "resolved": "Boolean",
// "resolvedAt": "Date",
// "createdAt": "Date"
// }

import mongoose , {Schema} from 'mongoose';

const risksSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    taskId: {
        type: Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
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
    }
},{timestamps: true});

export const Risk = mongoose.model("Risk", risksSchema);