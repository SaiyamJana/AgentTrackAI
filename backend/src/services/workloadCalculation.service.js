/*
 * workloadCalculation.service.js
 *
 * Pure math functions — no DB writes, no Gemini calls, no side effects.
 * Called by workloadAgent.js (cron) and workload.controller.js (on-demand).
 *
 * All scoring functions are deterministic and testable in isolation.
 */

// ── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_WEIGHT = { low: 1, medium: 2, high: 3 };
const STATUS_MULTIPLIER = { pending: 1.0, "in-progress": 1.2, completed: 0.0 };

// Thresholds for WorkloadSnapshot.status
export const WORKLOAD_THRESHOLDS = {
  underutilized: 25,  // score < 25
  optimal:       60,  // 25–60
  atRisk:        75,  // 60–75
  overloaded:    88,  // 75–88
  // critical: > 88
};

// Thresholds for burnout notifications
export const BURNOUT_THRESHOLDS = {
  warning:  55,
  critical: 75,
};

// ── effortScore per Task (0–10) ──────────────────────────────────────────────

/*
 * computeEffortScore
 * Blends priority, complexity, and deadline proximity into a single 0–10 score.
 *
 * @param {Object} task  — plain task object with priority, complexityScore, deadline, status
 * @param {number} openRiskCount — number of unresolved risks linked to this task
 * @returns {number} 0–10 (2 decimal places)
 */
export function computeEffortScore(task, openRiskCount = 0) {
  if (task.status === "completed") return 0;

  const priorityNorm    = (PRIORITY_WEIGHT[task.priority] ?? 2) / 3;          // 0.33–1.0
  const complexityNorm  = Math.min(10, Math.max(1, task.complexityScore ?? 5)) / 10; // 0.1–1.0

  // deadline_pressure: 1.0 if overdue, 0.5 at 7 days, 0.0 at 14+ days
  const daysUntilDeadline = task.deadline
    ? (new Date(task.deadline).getTime() - Date.now()) / 86400000
    : 7;
  const deadlinePressure = Math.max(0, Math.min(1, 1 - daysUntilDeadline / 14));

  const riskWeight = openRiskCount > 0 ? 1 : 0;

  const raw =
    priorityNorm   * 0.30 +
    complexityNorm * 0.30 +
    deadlinePressure * 0.25 +
    riskWeight     * 0.15;

  return Math.round(raw * 10 * 100) / 100; // 0–10, 2dp
}

// ── workloadScore per Employee (0–100) ───────────────────────────────────────

/*
 * computeWorkloadScore
 *
 * @param {Array} assignments — TaskAssignment docs with populated task field
 *   Each item: { status, contributionPercentage, task: { effortScore, status } }
 * @returns {number} 0–100
 *
 * Formula:
 *   raw = Σ (effortScore × contribution/100 × statusMultiplier)
 *   score = min(100, (raw / NORMALIZER) × 100)
 *
 * NORMALIZER = 5.0 — a "full" workload is ~5 average-effort tasks at 100% contribution.
 */
export function computeWorkloadScore(assignments) {
  const NORMALIZER = 5.0;
  let raw = 0;

  for (const a of assignments) {
    const taskStatus    = a.task?.status ?? a.status ?? "pending";
    if (taskStatus === "completed") continue;

    const effortScore   = a.task?.effortScore ?? 5;
    const contribution  = (a.contributionPercentage ?? 100) / 100;
    const multiplier    = STATUS_MULTIPLIER[a.status] ?? 1.0;

    raw += effortScore * contribution * multiplier;
  }

  return Math.min(100, Math.round((raw / NORMALIZER) * 100));
}

// ── capacityScore per Employee (0–100) ──────────────────────────────────────

/*
 * computeCapacityScore
 * How much headroom remains before the employee is at capacity.
 *
 * @param {number} totalActivePersonalHours — sum of estimatedPersonalHours on active assignments
 * @param {number} capacityHoursPerWeek     — from User model (default 40)
 * @returns {{ utilizationPct: number, capacityScore: number }}
 */
export function computeCapacityScore(totalActivePersonalHours, capacityHoursPerWeek = 40) {
  const utilizationPct = Math.round((totalActivePersonalHours / capacityHoursPerWeek) * 100);
  const capacityScore  = Math.max(0, 100 - utilizationPct);
  return { utilizationPct, capacityScore };
}

// ── burnoutRiskScore per Employee (0–100) ────────────────────────────────────

/*
 * computeBurnoutRiskScore
 *
 * @param {Object} params
 *   workloadScore       — 0–100 composite score
 *   activeTasksCount    — number of active (non-completed) tasks
 *   delayedTasksCount   — tasks past deadline and not completed
 *   completedLast7Days  — tasks completed in last 7 days
 *   avgCompletedPerWeek — 4-week rolling average
 *   consecutiveOverloadedDays — days score has been ≥ overloaded threshold
 * @returns {number} 0–100
 */
export function computeBurnoutRiskScore({
  workloadScore,
  activeTasksCount,
  delayedTasksCount,
  completedLast7Days,
  avgCompletedPerWeek = 2,
  consecutiveOverloadedDays = 0,
}) {
  const overduePenalty = activeTasksCount > 0
    ? Math.min(100, (delayedTasksCount / activeTasksCount) * 100)
    : 0;

  const velocityDrop = avgCompletedPerWeek > 0
    ? Math.max(0, (1 - (completedLast7Days / avgCompletedPerWeek)) * 100)
    : 0;

  const streakPenalty = Math.min(100, consecutiveOverloadedDays * 5);

  const raw =
    workloadScore    * 0.40 +
    overduePenalty   * 0.30 +
    velocityDrop     * 0.20 +
    streakPenalty    * 0.10;

  return Math.min(100, Math.round(raw));
}

// ── workload status label ────────────────────────────────────────────────────

/*
 * getWorkloadStatus
 * Maps a workloadScore to a status string consistent with WorkloadSnapshot.status enum.
 */
export function getWorkloadStatus(workloadScore) {
  if (workloadScore > 88) return "critical";
  if (workloadScore > 75) return "overloaded";
  if (workloadScore > 60) return "at-risk";
  if (workloadScore > 25) return "optimal";
  return "underutilized";
}

// ── estimatedPersonalHours helper ───────────────────────────────────────────

/*
 * computePersonalHours
 * The hour burden one person carries on a task given their contribution %.
 * Falls back to equal split if contributionPercentage is null.
 *
 * @param {number} estimatedHours      — task-level hours
 * @param {number|null} contribution   — 0–100, or null for equal split
 * @param {number} totalMembers        — used only when contribution is null
 * @returns {number}
 */
export function computePersonalHours(estimatedHours = 0, contribution = null, totalMembers = 1) {
  if (!estimatedHours) return 0;
  const pct = contribution !== null ? contribution : (100 / Math.max(1, totalMembers));
  return Math.round((estimatedHours * pct / 100) * 10) / 10; // 1dp
}

// ── Team utilization metrics ─────────────────────────────────────────────────

/*
 * computeTeamMetrics
 * Aggregate workload metrics across all members of a team/project.
 *
 * @param {Array} snapshots — array of WorkloadSnapshot docs
 * @returns {Object}
 */
export function computeTeamMetrics(snapshots) {
  if (!snapshots || snapshots.length === 0) {
    return {
      teamSize: 0,
      avgWorkloadScore: 0,
      overloadedCount: 0,
      atRiskCount: 0,
      burnoutRiskCount: 0,
      avgUtilizationPct: 0,
      teamBalanceScore: 0,
    };
  }

  const scores = snapshots.map(s => s.workloadScore ?? 0);
  const avg    = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Standard deviation for balance score
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
  const stdDev   = Math.sqrt(variance);
  // Perfect balance = stddev 0 → score 100; stddev 100 → score 0
  const teamBalanceScore = Math.max(0, Math.round(100 - stdDev));

  const avgUtilization = snapshots.reduce((s, snap) => s + (snap.utilizationPct ?? 0), 0) / snapshots.length;

  return {
    teamSize:          snapshots.length,
    avgWorkloadScore:  Math.round(avg),
    overloadedCount:   snapshots.filter(s => ["overloaded","critical"].includes(s.status)).length,
    atRiskCount:       snapshots.filter(s => s.status === "at-risk").length,
    burnoutRiskCount:  snapshots.filter(s => (s.burnoutRiskScore ?? 0) >= BURNOUT_THRESHOLDS.warning).length,
    avgUtilizationPct: Math.round(avgUtilization),
    teamBalanceScore,
  };
}
