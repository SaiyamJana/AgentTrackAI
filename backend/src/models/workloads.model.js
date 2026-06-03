// {
// "_id": "ObjectId",
// "employeeId": "ObjectId", // Reference to users
// "totalAssignedHours": "Number",
// "activeTasksCount": "Number",
// "completedTasksCount": "Number",
// "status": "underutilized" | "optimal" | "overloaded",
// "aiRecommendation": "String",
// "calculatedAt": "Date"
// }

import mongoose , {Schema} from 'mongoose';

const workloadsSchema = new Schema({
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalAssignedHours: {
        type: Number,
        required: true
    },
    activeTasksCount: {
        type: Number,
        required: true
    },
    completedTasksCount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["underutilized", "optimal", "overloaded"],
        required: true
    },
    aiRecommendation: {
        type: String,
        required: true
    },
    calculatedAt: {
        type: Date,
        default: Date.now
    }
},{timestamps: true});

export const Workload = mongoose.model("Workload", workloadsSchema);