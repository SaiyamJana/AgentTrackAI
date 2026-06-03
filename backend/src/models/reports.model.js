// {
// "_id": "ObjectId",
// "projectId": "ObjectId", // Reference to projects
// "reportType": "daily" | "weekly" | "project-summary",
// "summary": "String",
// "generatedAt": "Date"
// }

import mongoose , {Schema} from 'mongoose';

const reportsSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    reportType: {
        type: String,
        enum: ["daily", "weekly", "project-summary"],
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
},{timestamps: true});

export const Report = mongoose.model("Report", reportsSchema);