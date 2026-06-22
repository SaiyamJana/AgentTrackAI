// Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status:   { type: String, enum: ["active", "completed", "on-hold"], default: "active" },
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ managerId: 1 });

// ── Activity Log hooks ──────────────────────────────────────────────
projectSchema.pre('save', function () {
  this.wasNew = this.isNew;
});

projectSchema.post('save', async function (doc) {
  if (!doc._performedBy) return;

  const { ActivityLog } = await import("./activityLogs.model.js");

  if (doc.wasNew) {
    await ActivityLog.create({
      userId: doc._performedBy,
      companyId: doc.companyId,
      projectId: doc._id,
      action: "project_created",
      entityType: "Project",
      entityId: doc._id,
      details: `Project "${doc.title}" was created.`,
    });
    return;
  }

  // Existing project re-saved (e.g. progress recalculation from task updates)
  if (doc._justCompleted) {
    await ActivityLog.create({
      userId: doc._performedBy,
      companyId: doc.companyId,
      projectId: doc._id,
      action: "project_completed",
      entityType: "Project",
      entityId: doc._id,
      details: `Project "${doc.title}" reached 100% completion.`,
    });
  }
});

projectSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;
  const update = this.getUpdate();
  const performedBy = this.options?._performedBy;
  if (!performedBy) return;

  const { ActivityLog } = await import("./activityLogs.model.js");

  if (update.status) {
    await ActivityLog.create({
      userId: performedBy,
      companyId: doc.companyId,
      projectId: doc._id,
      action: "project_status_changed",
      entityType: "Project",
      entityId: doc._id,
      details: `Project "${doc.title}" status changed to "${update.status}".`,
    });
  }

  if (update.managerId) {
    await ActivityLog.create({
      userId: performedBy,
      companyId: doc.companyId,
      projectId: doc._id,
      action: "manager_assigned",
      entityType: "Project",
      entityId: doc._id,
      details: `Manager re-assigned on project "${doc.title}".`,
      adminOnly: true,
    });
  }

  if (update.progressPercentage === 100) {
    await ActivityLog.create({
      userId: performedBy,
      companyId: doc.companyId,
      projectId: doc._id,
      action: "project_completed",
      entityType: "Project",
      entityId: doc._id,
      details: `Project "${doc.title}" reached 100% completion.`,
    });
  }
});

export const Project = mongoose.model("Project", projectSchema);