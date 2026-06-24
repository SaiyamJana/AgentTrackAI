/*
 * TaskPriorityQueue
 * Shows the employee's active tasks in AI-suggested execution order.
 * Uses the priorityQueue array returned from GET /workloads/me.
 */

const PRIORITY_COLORS = {
  high:   { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
  medium: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  low:    { bg: "#dcfce7", text: "#166534", dot: "#22c55e" },
};

const STATUS_COLORS = {
  pending:      { bg: "#f1f5f9", text: "#475569" },
  "in-progress":{ bg: "#dbeafe", text: "#1e40af" },
  completed:    { bg: "#d1fae5", text: "#065f46" },
};

export default function TaskPriorityQueue({ tasks = [] }) {
  if (!tasks.length) {
    return (
      <div className="flex items-center justify-center h-28 text-sm text-slate-400 bg-slate-50 rounded-xl">
        No active tasks. You're all clear!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, idx) => {
        const pc     = PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium;
        const sc     = STATUS_COLORS[task.status] ?? STATUS_COLORS.pending;
        const daysLeft = task.daysLeft ?? 0;
        const isOverdue = daysLeft < 0;

        return (
          <div
            key={task.taskId}
            className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-start gap-3"
          >
            {/* Priority number badge */}
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
              {idx + 1}
            </div>

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                {isOverdue && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full shrink-0">
                    OVERDUE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Priority badge */}
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: pc.bg, color: pc.text }}
                >
                  {task.priority}
                </span>

                {/* Status badge */}
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: sc.bg, color: sc.text }}
                >
                  {task.status}
                </span>

                {/* Complexity */}
                <span className="text-[10px] text-slate-400">
                  Complexity: {task.complexityScore}/10
                </span>

                {/* Due date */}
                <span className={`text-[10px] font-medium ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
                  {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${task.completionPercentage ?? 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {task.completionPercentage ?? 0}%
                </span>
              </div>

              {/* Project + hours */}
              <p className="text-[10px] text-slate-400 mt-1">
                {task.project?.title ?? "—"}
                {task.estimatedPersonalHours
                  ? ` · ~${task.estimatedPersonalHours}h estimated`
                  : ""}
                {task.contributionPct !== null && task.contributionPct !== undefined
                  ? ` · ${Math.round(task.contributionPct)}% contribution`
                  : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
