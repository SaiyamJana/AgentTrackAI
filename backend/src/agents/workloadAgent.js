import { generateText } from "../services/aiClient.service.js";
import { Task }           from "../models/Task.js";
import { TaskAssignment } from "../models/TaskAssignment.js";
import { User }           from "../models/User.js";
import { Company }        from "../models/Company.js";
import { Project }        from "../models/Project.js";
import { EmployeeProject }from "../models/EmployeeProject.js";
import { Risk }           from "../models/risks.model.js";
import { Workload }       from "../models/workloads.model.js";
import { Notification }   from "../models/Notification.js";
import {
  computeEffortScore,
  computeWorkloadScore,
  computeCapacityScore,
  computeBurnoutRiskScore,
  computePersonalHours,
  getWorkloadStatus,
  BURNOUT_THRESHOLDS,
  WORKLOAD_THRESHOLDS,
} from "../services/workloadCalculation.service.js";

// ── Gemini setup (mirrors reportingAgent.service.js pattern) ─────────────────

// ── AI enrichment ─────────────────────────────────────────────────────────────

function buildWorkloadPrompt({ employee, snapshot, activeTasks }) {
  const taskLines = activeTasks
    .slice(0, 8) // cap at 8 to avoid huge prompts
    .map(t =>
      `- "${t.title}" | Priority: ${t.priority} | Complexity: ${t.complexityScore ?? 5}/10 | Due in ${Math.round((new Date(t.deadline) - Date.now()) / 86400000)}d | Contribution: ${t._contribution ?? 100}% | Est. ${t._personalHours ?? 0}h`
    )
    .join("\n");

  return `You are a workload management AI for a software project management platform called AgentTrack AI.
Analyze this employee's current workload and provide concise, actionable recommendations.

Employee: ${employee.name} | Department: ${employee.department ?? "N/A"}
Capacity: ${snapshot.capacityHoursPerWeek}h/week | Utilization: ${snapshot.utilizationPct}%
Workload Score: ${snapshot.workloadScore}/100 | Burnout Risk: ${snapshot.burnoutRiskScore}/100
Status: ${snapshot.status}

Active Tasks (${snapshot.activeTasksCount} total):
${taskLines || "No active tasks."}

Delayed Tasks: ${snapshot.delayedTasksCount}
Completed last 7 days: ${snapshot.completedLast7Days}

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "summary": "2-3 sentence professional summary of their workload situation",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
  "managerAlert": "one sentence for the manager if status is overloaded/critical, else null"
}`;
}

function buildFallbackAI(snapshot) {
  const statusMap = {
    underutilized: {
      summary: `${snapshot.status === "underutilized" ? "This employee has" : "You have"} a low workload score of ${snapshot.workloadScore}/100 with ${snapshot.utilizationPct}% capacity utilized. There is significant available bandwidth for additional task assignments.`,
      recommendations: [
        "Check in with their manager to identify tasks that can be delegated.",
        "Consider this person when redistributing work from overloaded team members.",
        "Review if the low utilization reflects blocked work or simply light period.",
      ],
    },
    optimal: {
      summary: `Workload score is ${snapshot.workloadScore}/100 — within the optimal range. Capacity is ${snapshot.utilizationPct}% utilized with ${snapshot.activeTasksCount} active task(s).`,
      recommendations: [
        "Maintain current task distribution.",
        "Monitor deadline proximity on active tasks.",
        "Prioritize completing delayed tasks first.",
      ],
    },
    "at-risk": {
      summary: `Workload score of ${snapshot.workloadScore}/100 indicates an at-risk level. ${snapshot.delayedTasksCount} task(s) are delayed. Capacity is ${snapshot.utilizationPct}% utilized.`,
      recommendations: [
        "Review and reprioritize active tasks immediately.",
        "Consider extending deadlines on lower-priority tasks.",
        "Check if any tasks can be reassigned to reduce pressure.",
      ],
    },
    overloaded: {
      summary: `Workload score of ${snapshot.workloadScore}/100 indicates overload. ${snapshot.delayedTasksCount} task(s) delayed, ${snapshot.utilizationPct}% capacity used. Immediate action needed.`,
      recommendations: [
        "Reassign lower-priority tasks to team members with available capacity.",
        "Escalate deadline conflicts to project manager.",
        "Reduce contribution percentage on shared tasks where others can absorb more.",
      ],
    },
    critical: {
      summary: `Critical workload: score ${snapshot.workloadScore}/100, ${snapshot.utilizationPct}% utilization. ${snapshot.delayedTasksCount} overdue tasks. Risk of burnout and delivery failure is high.`,
      recommendations: [
        "Immediately halt new task assignments.",
        "Escalate to admin for resource rebalancing.",
        "Identify and remove blockers on delayed tasks with highest business impact.",
      ],
    },
  };
  const cfg = statusMap[snapshot.status] ?? statusMap.optimal;
  return { ...cfg, managerAlert: ["overloaded","critical"].includes(snapshot.status)
    ? `${snapshot.status === "critical" ? "⚠️ CRITICAL" : "⚠️ OVERLOADED"}: This employee's workload score is ${snapshot.workloadScore}/100 and requires immediate attention.`
    : null
  };
}

async function enrichWithAI(employee, snapshot, activeTasks) {
  const prompt = buildWorkloadPrompt({ employee, snapshot, activeTasks });

  try {
    const text = await generateText(prompt);
    if (!text) return { ...buildFallbackAI(snapshot), usedAI: false };

    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      summary: parsed.summary ?? "",
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      managerAlert: parsed.managerAlert ?? null,
      usedAI: true,
    };
  } catch (err) {
    console.error("[WorkloadAgent] Groq error:", err.message);
    return { ...buildFallbackAI(snapshot), usedAI: false };
  }
}

// ── Step 1: Refresh effortScore on all active Tasks ───────────────────────────

export async function refreshEffortScores(companyId = null) {
  const filter = { status: { $ne: "completed" } };
  if (companyId) filter.companyId = companyId;

  const tasks = await Task.find(filter).lean();

  // Batch risk counts
  const riskCounts = {};
  if (tasks.length > 0) {
    const taskIds = tasks.map(t => t._id);
    const risks   = await Risk.find({ taskId: { $in: taskIds }, resolved: false }).lean();
    for (const r of risks) {
      const key = r.taskId.toString();
      riskCounts[key] = (riskCounts[key] ?? 0) + 1;
    }
  }

  let updated = 0;
  for (const task of tasks) {
    const openRisks = riskCounts[task._id.toString()] ?? 0;
    const newScore  = computeEffortScore(task, openRisks);
    await Task.findByIdAndUpdate(task._id, { effortScore: newScore });
    updated++;
  }

  return { tasksUpdated: updated };
}

// ── Step 2: Build snapshot for one employee ───────────────────────────────────

async function buildEmployeeSnapshot(employee, companyId, snapshotType) {
  const now       = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  // All active assignments for this employee
  const activeAssignments = await TaskAssignment.find({
    employeeId: employee._id,
    status: { $ne: "completed" },
  })
  .populate("taskId")
  .lean();

  // Filter to tasks that still exist and belong to this company
  const validAssignments = activeAssignments.filter(
    a => a.taskId && a.taskId.companyId?.toString() === companyId.toString()
  );

  // Completed in last 7 days
  const completedLast7 = await TaskAssignment.countDocuments({
    employeeId: employee._id,
    status: "completed",
    completedAt: { $gte: sevenDaysAgo },
  });

  // 4-week average completions per week
  const completedLast30 = await TaskAssignment.countDocuments({
    employeeId: employee._id,
    status: "completed",
    completedAt: { $gte: thirtyDaysAgo },
  });
  const avgPerWeek = completedLast30 / 4;

  // Delayed tasks
  const delayedCount = validAssignments.filter(a => {
    const task = a.taskId;
    return task && task.status !== "completed" && new Date(task.deadline) < now;
  }).length;

  // Active projects
  const projectIds = [...new Set(validAssignments.map(a => a.taskId?.projectId?.toString()).filter(Boolean))];

  // Update contributionPercentage & estimatedPersonalHours for null contributions
  // (equal split per task)
  const taskMemberCounts = {};
  for (const a of validAssignments) {
    const tid = a.taskId._id.toString();
    if (!taskMemberCounts[tid]) {
      const cnt = await TaskAssignment.countDocuments({ taskId: a.taskId._id });
      taskMemberCounts[tid] = cnt;
    }
  }

  let totalActiveHours = 0;
  const enrichedAssignments = validAssignments.map(a => {
    const task          = a.taskId;
    const memberCount   = taskMemberCounts[task._id.toString()] ?? 1;
    const contribution  = a.contributionPercentage ?? (100 / memberCount);
    const personalHours = computePersonalHours(task.estimatedHours, contribution, memberCount);
    totalActiveHours   += personalHours;

    return {
      ...a,
      _contribution:  contribution,
      _personalHours: personalHours,
      task,
    };
  });

  // Compute scores
  const workloadScore = computeWorkloadScore(enrichedAssignments);
  const { utilizationPct, capacityScore } = computeCapacityScore(
    totalActiveHours,
    employee.capacityHoursPerWeek ?? 40
  );

  // Previous snapshot to detect consecutive overloaded days
  const prevSnapshot = await Workload.findOne({ employeeId: employee._id })
    .sort({ calculatedAt: -1 })
    .lean();

  let consecutiveOverloadedDays = 0;
  if (prevSnapshot && ["overloaded","critical"].includes(prevSnapshot.status)) {
    consecutiveOverloadedDays = (prevSnapshot._consecutiveOverloadedDays ?? 0) + 1;
  }

  const burnoutRiskScore = computeBurnoutRiskScore({
    workloadScore,
    activeTasksCount:   validAssignments.length,
    delayedTasksCount:  delayedCount,
    completedLast7Days: completedLast7,
    avgCompletedPerWeek: avgPerWeek,
    consecutiveOverloadedDays,
  });

  const status = getWorkloadStatus(workloadScore);

  const snapshot = {
    employeeId:           employee._id,
    companyId,
    projectIds:           projectIds.map(id => id),
    workloadScore,
    capacityScore,
    burnoutRiskScore,
    activeTasksCount:     validAssignments.length,
    delayedTasksCount:    delayedCount,
    completedLast7Days:   completedLast7,
    totalActiveHours:     Math.round(totalActiveHours * 10) / 10,
    capacityHoursPerWeek: employee.capacityHoursPerWeek ?? 40,
    utilizationPct,
    status,
    calculatedAt: now,
    snapshotType,
    _consecutiveOverloadedDays: consecutiveOverloadedDays,
  };

  // AI enrichment
  const ai = await enrichWithAI(employee, snapshot, enrichedAssignments.map(a => ({
    ...a.task,
    _contribution:  a._contribution,
    _personalHours: a._personalHours,
  })));

  snapshot.aiSummary         = ai.summary;
  snapshot.aiRecommendations = ai.recommendations;
  snapshot.usedAI            = ai.usedAI;

  return { snapshot, activeTasks: enrichedAssignments, managerAlert: ai.managerAlert };
}

// ── Step 3: Notifications ─────────────────────────────────────────────────────

async function sendWorkloadNotifications(employee, snapshot, companyId) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // De-duplicate: don't re-notify within 24h for the same type unless score shifted ≥10
  const recentNotif = await Notification.findOne({
    userId: employee._id,
    type: "workload_alert",
    createdAt: { $gte: oneDayAgo },
  }).lean();

  if (recentNotif) return; // already notified within 24h

  const notifications = [];

  if (snapshot.status === "critical" || snapshot.status === "overloaded") {
    // Notify the employee
    notifications.push(Notification.create({
      userId:    employee._id,
      companyId,
      type:      "workload_alert",
      title:     snapshot.status === "critical" ? "⚠️ Critical Workload" : "⚠️ Overloaded",
      message:   `Your workload score is ${snapshot.workloadScore}/100 (${snapshot.status}). Consider discussing timeline adjustments with your manager.`,
      relatedEntity: { type: "task", id: employee._id },
      read: false,
    }));

    // Notify project managers on this employee's active projects
    if (snapshot.projectIds?.length > 0) {
      const projects = await Project.find({ _id: { $in: snapshot.projectIds } }).lean();
      const managerIds = [...new Set(projects.map(p => p.managerId?.toString()).filter(Boolean))];

      for (const managerId of managerIds) {
        if (managerId === employee._id.toString()) continue;
        notifications.push(Notification.create({
          userId:    managerId,
          companyId,
          type:      "workload_alert",
          title:     `Team Member ${snapshot.status === "critical" ? "Critical" : "Overloaded"}`,
          message:   `${employee.name}'s workload score is ${snapshot.workloadScore}/100. Workload rebalancing may be needed.`,
          relatedEntity: { type: "task", id: employee._id },
          read: false,
        }));
      }
    }
  } else if (snapshot.burnoutRiskScore >= BURNOUT_THRESHOLDS.critical) {
    notifications.push(Notification.create({
      userId:    employee._id,
      companyId,
      type:      "workload_alert",
      title:     "🔴 Burnout Risk — Critical",
      message:   `Your burnout risk score is ${snapshot.burnoutRiskScore}/100. Please discuss workload with your manager immediately.`,
      relatedEntity: { type: "task", id: employee._id },
      read: false,
    }));
  } else if (snapshot.burnoutRiskScore >= BURNOUT_THRESHOLDS.warning) {
    notifications.push(Notification.create({
      userId:    employee._id,
      companyId,
      type:      "workload_alert",
      title:     "⚠️ Burnout Risk — Warning",
      message:   `Your burnout risk score is ${snapshot.burnoutRiskScore}/100. Consider reviewing task priorities.`,
      relatedEntity: { type: "task", id: employee._id },
      read: false,
    }));
  }

  if (notifications.length > 0) {
    await Promise.all(notifications);
  }

  return notifications.length;
}

// ── Main export: runWorkloadAgent ─────────────────────────────────────────────

/*
 * runWorkloadAgent
 *
 * Mirrors the riskAgent pattern:
 *   1. Refresh effortScores on all active tasks
 *   2. For each employee in the company, build a WorkloadSnapshot
 *   3. Persist the snapshot
 *   4. Send notifications for overloaded/burnout employees
 *
 * @param {ObjectId|null} companyId — null = scan all companies
 * @param {string} snapshotType     — "scheduled" | "manual" | "on-demand"
 * @returns {Object} summary
 */
export const runWorkloadAgent = async (companyId = null, snapshotType = "scheduled") => {
  const now = new Date();
  console.log(`[WorkloadAgent] Starting scan (company=${companyId ?? "all"}, type=${snapshotType})`);

  // ── Refresh effortScores ──
  const effortResult = await refreshEffortScores(companyId);
  console.log(`[WorkloadAgent] effortScores refreshed: ${effortResult.tasksUpdated} tasks`);

  // ── Find all employees to process ──
  const userFilter = { role: "employee", isActive: true };
  if (companyId) userFilter.companyId = companyId;
  const employees = await User.find(userFilter).select("-password -refreshToken").lean();

  let snapshotsCreated  = 0;
  let notificationsSent = 0;
  let errors            = 0;

  for (const employee of employees) {
    try {
      const { snapshot, notifs, managerAlert } = await buildEmployeeSnapshot(
        employee,
        employee.companyId,
        snapshotType
      ).then(async (result) => {
        const snap = await Workload.create(result.snapshot);
        // Also update TaskAssignment.estimatedPersonalHours for active assignments
        for (const a of result.activeTasks) {
          await TaskAssignment.findByIdAndUpdate(a._id, {
            estimatedPersonalHours: a._personalHours,
          });
        }
        return { snapshot: snap, activeTasks: result.activeTasks, managerAlert: result.managerAlert };
      });

      snapshotsCreated++;

      const n = await sendWorkloadNotifications(employee, snapshot, employee.companyId);
      notificationsSent += (n ?? 0);

    } catch (err) {
      console.error(`[WorkloadAgent] Error for employee ${employee._id}:`, err.message);
      errors++;
    }
  }

  const summary = {
    scannedAt: now,
    employeesProcessed: employees.length,
    snapshotsCreated,
    notificationsSent,
    errors,
    effortScoresRefreshed: effortResult.tasksUpdated,
  };

  console.log("[WorkloadAgent] Scan complete:", summary);
  return summary;
};
