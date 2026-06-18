import { Task }            from "../models/Task.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { TaskAssignment }  from "../models/TaskAssignment.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";

/* ── date range resolution ─────────────────────────────────────────
 * range: "1d" | "7d" | "30d" | "90d" | "overall" | "custom"
 * custom requires `from` and `to` (ISO date strings)
 * "overall" spans from `anchorDate` (e.g. user/project createdAt) to now.
 */
function resolveRange(query, anchorDate) {
  const { range = "30d", from, to } = query;
  const now = new Date();

  if (range === "custom") {
    if(!from || !to) throw new ApiError(400, "Custom range requires 'from' and 'to' query parameters");
    const start = new Date(from);
    const end   = new Date(to);
    // include the full "to" day
    end.setHours(23, 59, 59, 999);
    return { start, end, label: "custom" };
  }

  if (range === "overall") {
    const start = anchorDate ? new Date(anchorDate) : null;
    return { start, end: now, label: "overall" };
  }

  const days = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 }[range] ?? 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end: now, label: ["1d","7d","30d","90d"].includes(range) ? range : "30d" };
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
  // Always include at least the end day
  if (days.length === 0) days.push(dayKey(endDay));
  return days;
}

function emptyBreakdown() {
  return { pending: 0, "in-progress": 0, completed: 0 };
}

/*
 * computeTaskAnalytics — shared core: given the FULL list of tasks for a
 * user/project and a time window, produce the full analytics payload.
 *
 * Every metric (counts, breakdowns, hours, etc.) is scoped to tasks CREATED
 * within [start, end] — this is what makes every KPI box respond to the
 * selected duration. Current status/overdue reflect the live state of
 * those in-window tasks.
 */
function computeTaskAnalytics(allTasks, { start, end }) {
  const now = Date.now();
  const startMs = start ? start.getTime() : -Infinity;
  const endMs   = end.getTime();

  const windowTasks = allTasks.filter(t => {
    const created = new Date(t.createdAt).getTime();
    return created >= startMs && created <= endMs;
  });

  // ── Status & priority breakdowns (within window) ──
  const statusBreakdown   = emptyBreakdown();
  const priorityBreakdown = { low: 0, medium: 0, high: 0 };
  let overdue = 0;
  let totalCompletionPct = 0;

  for (const t of windowTasks) {
    statusBreakdown[t.status] = (statusBreakdown[t.status] ?? 0) + 1;
    priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] ?? 0) + 1;
    if (t.status !== "completed" && new Date(t.deadline).getTime() < now) overdue++;
    totalCompletionPct += t.completionPercentage ?? 0;
  }

  const total = windowTasks.length;
  const avgCompletion = total > 0 ? Math.round(totalCompletionPct / total) : 0;

  // ── Completed (within window) + on-time rate ──
  const completedInWindow = windowTasks.filter(t => t.status === "completed");
  const completedTotal    = completedInWindow.length;
  const completedOnTime   = completedInWindow.filter(
    t => new Date(t.updatedAt).getTime() <= new Date(t.deadline).getTime()
  ).length;
  const onTimeRate = completedTotal > 0 ? Math.round((completedOnTime / completedTotal) * 100) : 0;

  // ── Avg cycle time (created -> completed) in hours ──
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

  // ── Daily trend: tasks created per day + tasks completed per day ──
  // Trend always reflects activity within [start, end], independent of
  // which set a task "belongs" to — i.e. a task created earlier but
  // completed inside the window still shows up on its completion day.
  const buckets = buildDayBuckets(start, end);
  const completedByDay = Object.fromEntries(buckets.map(d => [d, 0]));
  const createdByDay   = Object.fromEntries(buckets.map(d => [d, 0]));

  for (const t of allTasks) {
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

  // ── Hours: estimated vs actual (within window) ──
  const estimatedHours = windowTasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0);
  const actualHours    = windowTasks.reduce((s, t) => s + (t.actualHours ?? 0), 0);

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
      actualHours: Math.round(actualHours),
    },
    statusBreakdown,
    priorityBreakdown,
    trend,
  };
}

// ── GET /api/v1/analytics/me?range=&from=&to= ──────────────────────────────
export const getMyAnalytics = asyncHandler(async (req, res) => {
  const { start, end, label } = resolveRange(req.query, req.user.createdAt);

  const assignments = await TaskAssignment.find({
    employeeId: req.user._id,
  }).select("taskId");

  const taskIds = assignments.map(a => a.taskId);

  const tasks = await Task.find({ _id : {$in: taskIds} })
    .select("status priority deadline completionPercentage estimatedHours actualHours createdAt updatedAt projectId")
    .populate("projectId", "title status progressPercentage")
    .lean();

  const { windowTasks, summary, statusBreakdown, priorityBreakdown, trend } =
    computeTaskAnalytics(tasks, { start, end });

  // Per-project breakdown — scoped to windowTasks
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

  return res.status(200).json(new ApiResponse(200, {
    range: label,
    period: { start, end },
    summary, statusBreakdown, priorityBreakdown, trend,
    projectBreakdown: Object.values(byProject).sort((a, b) => b.total - a.total),
  }, "Personal analytics fetched"));
});

// ── GET /api/v1/analytics/project/:projectId?range=&from=&to= ──────────────
export const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const isAdmin = req.user.role === "admin";
  let role = isAdmin ? "admin" : null;
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

  // Per-member breakdown — scoped to windowTasks
  const assignments = await TaskAssignment.find({
    taskId: { $in: windowTasks.map(t => t._id) }
  }).populate("employeeId", "name email").lean();

  const byMember = {};
  for(const assignment of assignments) {
    const emp = assignment.employeeId;
    if (!emp) continue;

    const empId = emp._id.toString();

    if(!byMember[empId]) {
      byMember[empId] = {
        employeeId: empId,
        name: emp.name,
        email: emp.email,
        total: 0, completed: 0, inProgress: 0, 
        pending: 0,
        avgCompletion: 0,
        completionSum: 0,
      };
    }

    const member = byMember[empId];
    member.total++;

    if(assignment.status === "completed") member.completed++;
    if(assignment.status === "in-progress") member.inProgress++;
    if(assignment.status === "pending") member.pending++;

    member.completionSum += assignment.completionPercentage ?? 0;
  }

  const memberBreakdown = Object.values(byMember).map(member => ({
    employeeId: member.employeeId,
    name: member.name,
    email: member.email,
    total: member.total,
    completed: member.completed,
    inProgress: member.inProgress,
    pending: member.pending,
    avgCompletion: member.total > 0 ? Math.round(member.completionSum / member.total) : 0,
  }))
  .sort((a, b) => b.total - a.total);

  return res.status(200).json(new ApiResponse(200, {
    range: label,
    period: { start, end },
    project: { _id: project._id, title: project.title, status: project.status, progressPercentage: project.progressPercentage },
    summary, statusBreakdown, priorityBreakdown, trend,
    memberBreakdown,
  }, "Project analytics fetched"));
});
