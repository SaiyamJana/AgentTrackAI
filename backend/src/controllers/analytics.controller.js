import { Task }            from "../models/Task.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/* ── date range resolution ─────────────────────────────────────────
 * range: "7d" | "30d" | "90d" | "1d" | "all" | "custom"
 * custom requires `from` and `to` (ISO date strings)
 */
function resolveRange(query) {
  const { range = "30d", from, to } = query;
  const now = new Date();

  if (range === "custom" && from && to) {
    return { start: new Date(from), end: new Date(to), label: "custom" };
  }

  const days = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 }[range];
  if (!days) return { start: null, end: now, label: "all" }; // "all"

  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end: now, label: range };
}

const DAY_MS = 86400000;

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10); // YYYY-MM-DD
}

// Builds an array of YYYY-MM-DD keys spanning [start, end] inclusive (capped at 120 points)
function buildDayBuckets(start, end) {
  const days = [];
  const startDay = start ? new Date(start) : new Date(end.getTime() - 30 * DAY_MS);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  let cursor = new Date(startDay);
  let guard = 0;
  while (cursor <= endDay && guard < 120) {
    days.push(dayKey(cursor));
    cursor = new Date(cursor.getTime() + DAY_MS);
    guard++;
  }
  return days;
}

function emptyBreakdown() {
  return { pending: 0, "in-progress": 0, completed: 0 };
}

/*
 * computeTaskAnalytics — shared core: given a list of tasks (already scoped
 * to the right user/project) and a time window, produce the full analytics
 * payload used by both the personal and team endpoints.
 */
function computeTaskAnalytics(tasks, { start, end }) {
  const now = Date.now();

  // Tasks "active" within the window: created OR updated within range
  const inWindow = (t) => {
    if (!start) return true;
    const created = new Date(t.createdAt).getTime();
    const updated = new Date(t.updatedAt).getTime();
    return created >= start.getTime() || updated >= start.getTime();
  };

  const windowTasks = tasks.filter(inWindow);

  // ── Status & priority breakdowns (current snapshot, all assigned tasks) ──
  const statusBreakdown   = emptyBreakdown();
  const priorityBreakdown = { low: 0, medium: 0, high: 0 };
  let overdue = 0;
  let totalCompletionPct = 0;

  for (const t of tasks) {
    statusBreakdown[t.status] = (statusBreakdown[t.status] ?? 0) + 1;
    priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] ?? 0) + 1;
    if (t.status !== "completed" && new Date(t.deadline).getTime() < now) overdue++;
    totalCompletionPct += t.completionPercentage ?? 0;
  }

  const total = tasks.length;
  const avgCompletion = total > 0 ? Math.round(totalCompletionPct / total) : 0;

  // ── Completed-in-window count + on-time rate ──
  const completedInWindow = windowTasks.filter(t => t.status === "completed");
  const completedTotal    = completedInWindow.length;
  const completedOnTime   = completedInWindow.filter(
    t => new Date(t.updatedAt).getTime() <= new Date(t.deadline).getTime()
  ).length;
  const onTimeRate = completedTotal > 0 ? Math.round((completedOnTime / completedTotal) * 100) : 100;

  // ── Avg cycle time (created -> completed) in hours, for tasks completed in window ──
  let cycleSum = 0, cycleCount = 0;
  for (const t of completedInWindow) {
    const created = new Date(t.createdAt).getTime();
    const done    = new Date(t.updatedAt).getTime();
    if (done > created) {
      cycleSum += (done - created) / 3600000;
      cycleCount++;
    }
  }
  const avgCycleTimeHours = cycleCount > 0 ? Math.round(cycleSum / cycleCount) : 0;

  // ── Daily trend: tasks completed per day + tasks created per day ──
  const buckets = buildDayBuckets(start, end);
  const completedByDay = Object.fromEntries(buckets.map(d => [d, 0]));
  const createdByDay   = Object.fromEntries(buckets.map(d => [d, 0]));

  for (const t of tasks) {
    const createdK = dayKey(t.createdAt);
    if (createdByDay[createdK] !== undefined) createdByDay[createdK]++;

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

  // ── Hours: estimated vs actual ──
  const estimatedHours = tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
  const actualHours    = tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0);

  return {
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
      actualHours: Math.round(actualHours),
    },
    statusBreakdown,
    priorityBreakdown,
    trend,
  };
}

// ── GET /api/v1/analytics/me?range=&from=&to= ──────────────────────────────
// Personal analytics for the logged-in employee (also used by managers
// to view their own personal stats).
export const getMyAnalytics = asyncHandler(async (req, res) => {
  const { start, end, label } = resolveRange(req.query);

  const tasks = await Task.find({ assignedTo: req.user._id })
    .select("status priority deadline completionPercentage estimatedHours actualHours createdAt updatedAt projectId")
    .populate("projectId", "title status progressPercentage")
    .lean();

  const analytics = computeTaskAnalytics(tasks, { start, end });

  // Per-project breakdown for this employee
  const byProject = {};
  for (const t of tasks) {
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

  return res.status(200).json(new ApiResponse(200, {
    range: label,
    period: { start, end },
    ...analytics,
    projectBreakdown: Object.values(byProject).sort((a, b) => b.total - a.total),
  }, "Personal analytics fetched"));
});

// ── GET /api/v1/analytics/project/:projectId?range=&from=&to= ──────────────
// Team analytics for a project — manager / sub-manager / admin only.
export const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { start, end, label } = resolveRange(req.query);

  const isAdmin = req.user.role === "admin";
  let role = isAdmin ? "admin" : null;
  if (!isAdmin) {
    const ep = await EmployeeProject.findOne({ projectId, employeeId: req.user._id, isActive: true });
    role = ep ? ep.projectRole : null;
  }
  if (!["admin", "manager", "sub-manager"].includes(role))
    throw new ApiError(403, "Access denied");

  const project = await Project.findById(projectId).lean();
  if (!project) throw new ApiError(404, "Project not found");

  const tasks = await Task.find({ projectId })
    .select("status priority deadline completionPercentage estimatedHours actualHours createdAt updatedAt assignedTo")
    .populate("assignedTo", "name email")
    .lean();

  const analytics = computeTaskAnalytics(tasks, { start, end });

  // Per-member breakdown
  const byMember = {};
  const now = Date.now();
  for (const t of tasks) {
    const uid = t.assignedTo?._id?.toString() ?? "unknown";
    if (!byMember[uid]) {
      byMember[uid] = {
        employeeId: uid,
        name: t.assignedTo?.name ?? "Unknown",
        total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0,
        completionSum: 0,
      };
    }
    const m = byMember[uid];
    m.total++;
    if (t.status === "completed")   m.completed++;
    if (t.status === "in-progress") m.inProgress++;
    if (t.status === "pending")     m.pending++;
    if (t.status !== "completed" && new Date(t.deadline).getTime() < now) m.overdue++;
    m.completionSum += t.completionPercentage ?? 0;
  }

  const memberBreakdown = Object.values(byMember).map(m => ({
    employeeId: m.employeeId,
    name: m.name,
    total: m.total,
    completed: m.completed,
    inProgress: m.inProgress,
    pending: m.pending,
    overdue: m.overdue,
    avgCompletion: m.total > 0 ? Math.round(m.completionSum / m.total) : 0,
  })).sort((a, b) => b.total - a.total);

  return res.status(200).json(new ApiResponse(200, {
    range: label,
    period: { start, end },
    project: { _id: project._id, title: project.title, status: project.status, progressPercentage: project.progressPercentage },
    ...analytics,
    memberBreakdown,
  }, "Project analytics fetched"));
});
