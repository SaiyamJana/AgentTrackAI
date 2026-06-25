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

    /*
     * contributionPercentage — what fraction of this task this employee "owns".
     * null = equal split (100 / total members) until manager sets explicit values.
     * Sum across all assignments for a task should not exceed 100.
     * Example: Task with 3 members at [60%, 30%, 10%] means their personal
     * hour burden = estimatedHours × (contribution / 100).
     */
    contributionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
    },

    /*
     * estimatedPersonalHours — derived: task.estimatedHours × (contributionPercentage / 100).
     * Stored for fast aggregation (avoids join + multiply on every workload query).
     * Recalculated whenever contributionPercentage or task.estimatedHours changes.
     */
    estimatedPersonalHours: {
        type: Number,
        min: 0,
        default: null,
    },

    /*
     * workloadScore — this assignment's contribution to the employee's total
     * workload score. Computed by workloadCalculation.service.js and stored
     * so dashboard queries can simply SUM this field.
     */
    workloadScore: {
        type: Number,
        min: 0,
        default: null,
    },

    /*
     * startedAt — when this member began work (first non-zero progress update).
     * completedAt — when this member finished their part (progress = 100).
     */
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
},
{
    timestamps: true,
}
);

taskAssignmentSchema.index({ taskId: 1, employeeId: 1 }, { unique: true });
taskAssignmentSchema.index({ employeeId: 1, status: 1 }); // workload: employee's active tasks
taskAssignmentSchema.index({ taskId: 1 });                 // progress update aggregation

export const TaskAssignment = mongoose.model("TaskAssignment", taskAssignmentSchema);
