// Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    subManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    deadline: { type: Date, required: true },
    estimatedHours: { type: Number, min: 0 },
    actualHours: { type: Number, min: 0, default: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    tags: [{ type: String }],

    /*
     * complexityScore — cognitive/effort complexity, independent of urgency.
     * 1 = trivial fix; 10 = deep architectural work.
     * Allows workload engine to distinguish a "high priority" 1-hour bug from
     * a "medium priority" 60-hour refactor.
     */
    complexityScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },

    /*
     * effortScore — composite pre-computed score (0–10) blending priority,
     * complexity and deadline pressure. Recalculated by the workload cron
     * every 6 hours. Stored for fast aggregation without re-running math
     * on every workload dashboard load.
     */
    effortScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },

    /*
     * startedAt — set automatically when any TaskAssignment first moves to
     * "in-progress". Used for accurate cycle-time calculation.
     */
    startedAt: {
      type: Date,
      default: null,
    },

    /*
     * completedAt — set automatically when task status reaches "completed".
     * More accurate than updatedAt which changes on any field mutation.
     */
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ subManagerId: 1, status: 1 });
taskSchema.index({ companyId: 1, subManagerId: 1 });
taskSchema.index({ deadline: 1, status: 1 });
taskSchema.index({ companyId: 1, effortScore: -1 }); // workload queries

// ── Activity Log hooks ──────────────────────────────────────────────
taskSchema.pre('save', function () {
  this.wasNew = this.isNew;
});

taskSchema.post('save', async function (doc) {
  if (!doc._performedBy) return;

  const { ActivityLog } = await import("./activityLogs.model.js");

  if (doc.wasNew) {
    await ActivityLog.create({
      userId: doc._performedBy,
      companyId: doc.companyId,
      projectId: doc.projectId,
      action: "task_created",
      entityType: "Task",
      entityId: doc._id,
      details: `Task "${doc.title}" was created.`,
    });
    return;
  }

  if (doc._statusJustCompleted) {
    await ActivityLog.create({
      userId: doc._performedBy,
      companyId: doc.companyId,
      projectId: doc.projectId,
      action: "task_completed",
      entityType: "Task",
      entityId: doc._id,
      details: `Task "${doc.title}" was completed.`,
    });
  }

  // ── NEW: member added/removed ──
  if (doc._memberActionType === "added") {
    await ActivityLog.create({
      userId: doc._performedBy,
      companyId: doc.companyId,
      projectId: doc.projectId,
      action: "task_member_added",
      entityType: "Task",
      entityId: doc._id,
      details: `Team member(s) added to task "${doc.title}".`,
    });
  }

  if (doc._memberActionType === "removed") {
    await ActivityLog.create({
      userId: doc._performedBy,
      companyId: doc.companyId,
      projectId: doc.projectId,
      action: "task_member_removed",
      entityType: "Task",
      entityId: doc._id,
      details: `Team member removed from task "${doc.title}".`,
    });
  }
});
// Task.js — COMPLETE version, add these two hooks back before export
taskSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;
  const performedBy = this.options?._performedBy;
  if (!performedBy) return;

  const { ActivityLog } = await import("./activityLogs.model.js");
  await ActivityLog.create({
    userId: performedBy,
    companyId: doc.companyId,
    projectId: doc.projectId,
    action: "task_updated",
    entityType: "Task",
    entityId: doc._id,
    details: `Task "${doc.title}" was updated.`,
  });
});

taskSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;
  const performedBy = this.options?._performedBy;
  if (!performedBy) return;

  const { ActivityLog } = await import("./activityLogs.model.js");
  await ActivityLog.create({
    userId: performedBy,
    companyId: doc.companyId,
    projectId: doc.projectId,
    action: "task_deleted",
    entityType: "Task",
    entityId: doc._id,
    details: `Task "${doc.title}" was deleted.`,
  });
});

export const Task = mongoose.model("Task", taskSchema);
