import mongoose , {Schema} from 'mongoose';

const activityLogsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: [
            "Project_Created",
            "Task_Created",
            "Task_Updated",
            "Task_Completed",
        ],
        required: true
    },
    entityType: {
        type: String,
        enum: ["Project", "Task"],
        required: true
    },
    entityId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    details: {
        type: String,
        trim: true
    }
},{timestamps: true});

export const ActivityLog = mongoose.model("ActivityLog", activityLogsSchema);