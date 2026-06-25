/*
 * migrateWorkload.js
 *
 * One-time migration script — safe to run multiple times (idempotent).
 * Run ONCE after deploying the updated schemas before starting the server.
 *
 * Usage:
 *   node src/scripts/migrateWorkload.js
 *
 * What it does:
 *   1. Sets Task.complexityScore = 5 (neutral) on all tasks where it's null/undefined
 *   2. Sets Task.effortScore = null (will be filled by first cron run) on all tasks
 *   3. Sets User.capacityHoursPerWeek = 40 on all users that don't have it
 *   4. For every TaskAssignment with contributionPercentage = null:
 *      - Counts total members on the task
 *      - Sets contributionPercentage = Math.floor(100 / memberCount)
 *      - Sets estimatedPersonalHours accordingly
 */

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../db/index.js";
import { Task }           from "../models/Task.js";
import { TaskAssignment } from "../models/TaskAssignment.js";
import { User }           from "../models/User.js";
import { computePersonalHours } from "../services/workloadCalculation.service.js";

async function run() {
  await connectDB();
  console.log("✅ DB connected — starting workload migration...\n");

  // ── 1. Tasks: set complexityScore = 5 where missing ──────────────────────
  const taskResult = await Task.updateMany(
    { complexityScore: { $exists: false } },
    { $set: { complexityScore: 5 } }
  );
  console.log(`Tasks — complexityScore backfill: ${taskResult.modifiedCount} updated`);

  // ── 2. Users: set capacityHoursPerWeek = 40 where missing ─────────────────
  const userResult = await User.updateMany(
    { capacityHoursPerWeek: { $exists: false } },
    { $set: { capacityHoursPerWeek: 40 } }
  );
  console.log(`Users — capacityHoursPerWeek backfill: ${userResult.modifiedCount} updated`);

  // ── 3. TaskAssignments: equal-split contribution backfill ─────────────────
  // Group assignments by taskId to compute member counts efficiently
  const allAssignments = await TaskAssignment.find({}).lean();

  // Build taskId → count map
  const memberCounts = {};
  for (const a of allAssignments) {
    const tid = a.taskId.toString();
    memberCounts[tid] = (memberCounts[tid] ?? 0) + 1;
  }

  // Fetch task estimatedHours for personal hour calculation
  const taskIds   = [...new Set(allAssignments.map(a => a.taskId.toString()))];
  const tasks     = await Task.find({ _id: { $in: taskIds } }).select("_id estimatedHours").lean();
  const taskHours = Object.fromEntries(tasks.map(t => [t._id.toString(), t.estimatedHours ?? 0]));

  let assignmentUpdated = 0;
  let assignmentSkipped = 0;

  for (const a of allAssignments) {
    // Skip if already explicitly set by a manager
    if (a.contributionPercentage !== null && a.contributionPercentage !== undefined) {
      assignmentSkipped++;
      continue;
    }

    const tid         = a.taskId.toString();
    const count       = memberCounts[tid] ?? 1;
    const contribution = Math.floor(100 / count);
    const personalHours = computePersonalHours(taskHours[tid] ?? 0, contribution, count);

    await TaskAssignment.findByIdAndUpdate(a._id, {
      contributionPercentage:  contribution,
      estimatedPersonalHours:  personalHours,
    });
    assignmentUpdated++;
  }

  console.log(`TaskAssignments — contribution backfill: ${assignmentUpdated} updated, ${assignmentSkipped} already set`);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n✅ Migration complete. Run the server — the workload cron will generate snapshots at 2 AM,");
  console.log("   or call POST /api/v1/workloads/recalculate to generate immediately.\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
