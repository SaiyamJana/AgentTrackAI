import mongoose from "mongoose";

const taskAssignmentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        required: true,
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "in-progress", "completed"],
        default: "pending",
    },
    completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    actualHours: {
        type: Number,
        min: 0,
        default: 0,
    },
    remarks: {
        type: String,
        default: "",
    },
},
{
    timestamps: true,
}
);

taskAssignmentSchema.index({ taskId: 1 , employeeId: 1} , { unique: true });


export const TaskAssignment = mongoose.model("TaskAssignment", taskAssignmentSchema);