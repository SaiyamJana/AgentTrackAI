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
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    reportType: {
        type: String,
        enum: ["daily", "weekly", "project-summary"],
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    summary: {
        type: String,
        required: true
    },
    metrics: {
        type: Schema.Types.Mixed,
        default: {}
    },
    generatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    periodStart: {
        type: Date
    },
    periodEnd: {
        type: Date
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
},{timestamps: true});

reportsSchema.index({ projectId: 1, reportType: 1, generatedAt: -1 });// Compound index to optimize queries for reports by project and type, sorted by generation date
reportsSchema.index({ companyId: 1, generatedAt: -1 });// Index to optimize queries for reports by company, sorted by generation date

export const Report = mongoose.model("Report", reportsSchema);