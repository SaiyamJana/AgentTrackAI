import mongoose, { Schema } from "mongoose";

/*
 * WorkloadSnapshot — point-in-time workload calculation for one employee.
 *
 * Created by the workloadAgent (daily cron at 2 AM) and on-demand via
 * POST /api/v1/workloads/recalculate.
 *
 * Replaces the previous commented-out stub. No existing data is lost
 * because the stub was never populated.
 */
const workloadSnapshotSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    // Projects contributing active tasks to this snapshot
    projectIds: [{ type: Schema.Types.ObjectId, ref: "Project" }],

    // ── Composite scores (0–100) ──────────────────────────────────────
    workloadScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    capacityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    burnoutRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ── Raw metrics ───────────────────────────────────────────────────
    activeTasksCount:     { type: Number, default: 0 },
    delayedTasksCount:    { type: Number, default: 0 },
    completedLast7Days:   { type: Number, default: 0 },
    totalActiveHours:     { type: Number, default: 0 }, // sum of estimatedPersonalHours for active assignments
    capacityHoursPerWeek: { type: Number, default: 40 }, // copied from User at snapshot time
    utilizationPct:       { type: Number, default: 0 },  // totalActiveHours / capacityHoursPerWeek × 100

    // ── Status ────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["underutilized", "optimal", "at-risk", "overloaded", "critical"],
      default: "optimal",
    },

    // ── AI layer (Gemini enrichment) ──────────────────────────────────
    aiSummary: {
      type: String,
      default: "",
    },
    aiRecommendations: [{ type: String }],
    usedAI: {
      type: Boolean,
      default: false,
    },

    // ── Metadata ──────────────────────────────────────────────────────
    calculatedAt: {
      type: Date,
      default: Date.now,
    },
    snapshotType: {
      type: String,
      enum: ["scheduled", "manual", "on-demand"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

workloadSnapshotSchema.index({ employeeId: 1, calculatedAt: -1 });
workloadSnapshotSchema.index({ companyId: 1, status: 1 });
workloadSnapshotSchema.index({ companyId: 1, calculatedAt: -1 });

export const Workload = mongoose.model("Workload", workloadSnapshotSchema);
