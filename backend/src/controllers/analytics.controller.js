import { Task }            from "../models/Task.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { TaskAssignment }  from "../models/TaskAssignment.js";
import { Workload }        from "../models/workloads.model.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";
import { computeTeamMetrics } from "../services/workloadCalculation.service.js";

/* ── date range resolution ─────────────────────────────────────────────────── */
function resolveRange(query, anchorDate) {
  const { range = "30d", from, to } = query;
  const now = new Date();

  if (range === "custom") {
    if (!from || !to) throw new ApiError(400, "Custom range requires 'from' and 'to' query parameters");
    const start = new Date(from);
    const end   = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "custom" };
  }

  if (range === "overall") {
    const start = anchorDate ? new Date(anchorDate) : null;
    return { start, end: now, label: "overall" };
  }

  const days  = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 }[range] ?? 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end: now, label: ["1d","7d","30d","90d"].includes(range) ? range : "30d" };
}

const DAY_MS = 86400000;

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function buildDayBuckets(start, end) {
  const days     = [];
  const startDay = start ? new Date(start) : new Date(end.getTime() - 30 * DAY_MS);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  let cursor = new Date(startDay);
  let guard  = 0;
  while (cursor <= endDay && guard < 120) {
    days.push(dayKey(cursor));
    cursor = new Date(cursor.getTime() + DAY_MS);
    guard++;
  }
  if (days.length === 0) days.push(dayKey(endDay));
  return days;
}

function emptyBreakdown() {
  return { pending: 0, "in-progress": 0, completed: 0 };
}

function computeTaskAnalytics(allTasks, { start, end }) {
  const now     = Date.now();
  const startMs = start ? start.getTime() : -Infinity;
  const endMs   = end.getTime();

  const windowTasks = allTasks.filter(t => {
    const created = new Date(t.createdAt).getTime();
    return created >= startMs && created <= endMs;
  });

  const statusBreakdown   = emptyBreakdown();
  const priorityBreakdown = { low: 0, medium: 0, high: 0 };
  let overdue = 0;
  let totalCompletionPct = 0;

  for (const t of windowTasks) {
    statusBreakdown[t.status]       = (statusBreakdown[t.status]       ?? 0) + 1;
    priorityBreakdown[t.priority]   = (priorityBreakdown[t.priority]   ?? 0) + 1;
    if (t.status !== "completed" && new Date(t.deadline).getTime() < now) overdue++;
    totalCompletionPct += t.completionPercentage ?? 0;
  }

  const total         = windowTasks.length;
  const avgCompletion = total > 0 ? Math.round(totalCompletionPct / total) : 0;

  const completedInWindow = windowTasks.filter(t => t.status === "completed");
  const completedTotal    = completedInWindow.length;
  const completedOnTime   = completedInWindow.filter(
    t => new Date(t.updatedAt).getTime() <= new Date(t.deadline).getTime()
  ).length;
  const onTimeRate = completedTotal > 0 ? Math.round((completedOnTime / completedTotal) * 100) : 0;

  let cycleSum = 0, cycleCount = 0;
  for (const t of completedInWindow) {
    const created = new Date(t.createdAt).getTime();
    const done    = new Date(t.updatedAt).getTime();
    if (done > created) { cycleSum += (done - created) / 3600000; cycleCount++; }
  }
  const avgCycleTimeHours = cycleCount > 0 ? Math.round(cycleSum / cycleCount) : 0;

  const buckets        = buildDayBuckets(start, end);
  const completedByDay = Object.fromEntries(buckets.map(d => [d, 0]));
  const createdByDay   = Object.fromEntries(buckets.map(d => [d, 0]));

  for (const t of allTasks) {
    const createdK = dayKey(t.createdAt);
    if (createdByDay[createdK]   !== undefined) createdByDay[createdK]++;
    if (t.status === "completed") {
      const doneK = dayKey(t.updatedAt);
      if (completedByDay[doneK] !== undefined) completedByDay[doneK]++;
    }
  }

  const trend = buckets.map(d => ({
    date: d,
    completed: completedByDay[d],
    created:   createdByDay[d],
  }));

  const estimatedHours = windowTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
  const actualHours    = windowTasks.reduce((s, t) => s + (t.actualHours    ?? 0), 0);

  return {
    windowTasks,
    summary: {
      totalTasks: total,
      completedTasks: statusBreakdown.completed,
      inProgressTasks: statusBreakdown["in-progress"],
      pendingTasks: statusBreakdown.pending,
      overdueTasks: overdue,
      avgCompletionPercentage: avgCompletion,
      completedInPeriod: completedTotal,
      onTimeCompletionRate: onTimeRate,
      avgCycleTimeHours,
      estimatedHours: Math.round(estimatedHours),
      actualHours:    Math.round(actualHours),
    },
    statusBreakdown,
    priorityBreakdown,
    trend,
  };
}

// ── GET /api/v1/analytics/me?range=&from=&to= ─────────────────────────────────
export const getMyAnalytics = asyncHandler(async (req, res) => {
  const { start, end, label } = resolveRange(req.query, req.user.createdAt);

  const assignments = await TaskAssignment.find({ employeeId: req.user._id }).select("taskId");
  const taskIds     = assignments.map(a => a.taskId);

  const tasks = await Task.find({ _id: { $in: taskIds } })
    .select("status priority deadline completionPercentage estimatedHours actualHours createdAt updatedAt projectId")
    .populate("projectId", "title status progressPercentage")
    .lean();

  const { windowTasks, summary, statusBreakdown, priorityBreakdown, trend } =
    computeTaskAnalytics(tasks, { start, end });

  const byProject = {};
  for (const t of windowTasks) {
    const pid = t.projectId?._id?.toString() ?? "unknown";
    if (!byProject[pid]) {
      byProject[pid] = {
        projectId: pid,
        title: t.projectId?.title ?? "Unknown",
        total: 0, completed: 0, inProgress: 0, pending: 0,
      };
    }
    byProject[pid].total++;
    if (t.status === "completed")   byProject[pid].completed++;
    if (t.status === "in-progress") byProject[pid].inProgress++;
    if (t.status === "pending")     byProject[pid].pending++;
  }

  // ── NEW: append latest workload metrics for this employee ─────────────────
  const latestSnapshot = await Workload.findOne({ employeeId: req.user._id })
    .sort({ calculatedAt: -1 })
    .select("workloadScore burnoutRiskScore utilizationPct capacityScore status activeTasksCount totalActiveHours capacityHoursPerWeek calculatedAt")
    .lean();

  const workloadMetrics = latestSnapshot
    ? {
        workloadScore:        latestSnapshot.workloadScore,
        burnoutRiskScore:     latestSnapshot.burnoutRiskScore,
        utilizationPct:       latestSnapshot.utilizationPct,
        capacityScore:        latestSnapshot.capacityScore,
        status:               latestSnapshot.status,
        activeTasksCount:     latestSnapshot.activeTasksCount,
        totalActiveHours:     latestSnapshot.totalActiveHours,
        capacityHoursPerWeek: latestSnapshot.capacityHoursPerWeek,
        calculatedAt:         latestSnapshot.calculatedAt,
      }
    : null;

  return res.status(200).json(new ApiResponse(200, {
    range: label,
    period: { start, end },
    summary, statusBreakdown, priorityBreakdown, trend,
    projectBreakdown: Object.values(byProject).sort((a, b) => b.total - a.total),
    workloadMetrics, // NEW — null if no snapshot yet
  }, "Personal analytics fetched"));
});

// ── GET /api/v1/analytics/project/:projectId?range=&from=&to= ────────────────
export const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const isAdmin = req.user.role === "admin";
  let role      = isAdmin ? "admin" : null;
  if (!isAdmin) {
    const ep = await EmployeeProject.findOne({ projectId, employeeId: req.user._id, isActive: true });
    role = ep ? ep.projectRole : null;
  }
  if (!["admin", "manager"].includes(role))
    throw new ApiError(403, "Access denied");

  const project = await Project.findById(projectId).lean();
  if (!project) throw new ApiError(404, "Project not found");

  const { start, end, label } = resolveRange(req.query, project.createdAt);

  const tasks = await Task.find({ projectId })
    .select("status priority deadline completionPercentage estimatedHours actualHours createdAt updatedAt subManagerId teamMembers")
    .populate("subManagerId", "name email")
    .populate("teamMembers", "name email")
    .lean();

  const { windowTasks, summary, statusBreakdown, priorityBreakdown, trend } =
    computeTaskAnalytics(tasks, { start, end });

  const assignments = await TaskAssignment.find({
    taskId: { $in: windowTasks.map(t => t._id) },
  }).populate("employeeId", "name email").lean();

  const byMember = {};
  for (const assignment of assignments) {
    const emp = assignment.employeeId;
    if (!emp) continue;

    const empId = emp._id.toString();
    if (!byMember[empId]) {
      byMember[empId] = {
        employeeId: empId,
        name: emp.name, email: emp.email,
        total: 0, completed: 0, inProgress: 0, pending: 0,
        avgCompletion: 0, completionSum: 0,
      };
    }
    const member = byMember[empId];
    member.total++;
    if (assignment.status === "completed")   member.completed++;
    if (assignment.status === "in-progress") member.inProgress++;
    if (assignment.status === "pending")     member.pending++;
    member.completionSum += assignment.completionPercentage ?? 0;
  }

  const memberBreakdown = Object.values(byMember).map(m => ({
    employeeId:    m.employeeId,
    name:          m.name,
    email:         m.email,
    total:         m.total,
    completed:     m.completed,
    inProgress:    m.inProgress,
    pending:       m.pending,
    avgCompletion: m.total > 0 ? Math.round(m.completionSum / m.total) : 0,
  })).sort((a, b) => b.total - a.total);

  // ── NEW: append team workload metrics for this project ────────────────────
  const projectMembers = await require("../models/EmployeeProject.js").EmployeeProject
    ? [] // dynamic import guard
    : [];

  const { EmployeeProject: EP } = await import("../models/EmployeeProject.js");
  const projectMemberRecords = await EP.find({ projectId, isActive: true }).lean();
  const memberIds = projectMemberRecords.map(pm => pm.employeeId);

  const memberSnapshots = await Workload.find({
    employeeId: { $in: memberIds },
  })
  // For each employee, only keep the latest snapshot
  .sort({ calculatedAt: -1 })
  .lean();

  // Deduplicate to one snapshot per employee
  const seenEmployees = new Set();
  const latestSnapshots = memberSnapshots.filter(s => {
    const key = s.employeeId.toString();
    if (seenEmployees.has(key)) return false;
    seenEmployees.add(key);
    return true;
  });

  const workloadMetrics = computeTeamMetrics(latestSnapshots);

  return res.status(200).json(new ApiResponse(200, {
    range: label,
    period: { start, end },
    project: {
      _id: project._id,
      title: project.title,
      status: project.status,
      progressPercentage: project.progressPercentage,
    },
    summary, statusBreakdown, priorityBreakdown, trend,
    memberBreakdown,
    workloadMetrics, // NEW — team-level workload summary
  }, "Project analytics fetched"));
});
