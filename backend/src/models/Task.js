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
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ subManagerId: 1, status: 1 });
taskSchema.index({ companyId: 1, subManagerId: 1 });
taskSchema.index({ deadline: 1, status: 1 });

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