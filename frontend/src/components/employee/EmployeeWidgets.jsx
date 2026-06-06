import { useState } from "react";
import Badge from "../shared/Badge";
import ProgressBar from "../shared/ProgressBar";
import Avatar from "../shared/Avatar";
import Icon from "../shared/Icon";

// ── My Tasks List ─────────────────────────────────────────────────────────────
export const MyTasksList = ({ tasks = [], onUpdateProgress }) => {
  const [expanded, setExpanded] = useState(null);

  const urgency = (deadline) => {
    const diff = (new Date(deadline) - Date.now()) / 86400000;
    if (diff < 0)  return "text-red-600 bg-red-50 border border-red-200";
    if (diff < 2)  return "text-amber-600 bg-amber-50 border border-amber-200";
    return "text-slate-500 bg-slate-50 border border-slate-200";
  };

  const urgencyLabel = (deadline) => {
    const diff = (new Date(deadline) - Date.now()) / 86400000;
    if (diff < 0) return "Overdue";
    if (diff < 1) return "Due today";
    if (diff < 2) return "Due tomorrow";
    return `${Math.ceil(diff)}d left`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-700">My Tasks</h2>
        <span className="text-xs text-slate-400">{tasks.length} assigned</span>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <Icon name="task" className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">No tasks assigned yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {tasks.map((task) => (
            <div key={task._id}>
              {/* Task row */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/70 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === task._id ? null : task._id)}
              >
                {/* Status icon */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                  {task.status === "completed" && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge status={task.priority} />
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${urgency(task.deadline)}`}>
                      {urgencyLabel(task.deadline)}
                    </span>
                  </div>
                </div>

                {/* Progress + status */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20 hidden sm:block">
                    <ProgressBar value={task.completionPercentage} showLabel size="sm" />
                  </div>
                  <Badge status={task.status} showDot />
                  <Icon name="arrow" className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${expanded === task._id ? "rotate-90" : ""}`} />
                </div>
              </div>

              {/* Expanded update panel */}
              {expanded === task._id && (
                <div className="px-5 pb-4 bg-slate-50/60 border-t border-slate-100">
                  <div className="pt-4 space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>

                    {/* Progress slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-slate-600">Update Progress</span>
                        <span className="text-xs font-bold text-blue-600">{task.completionPercentage}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={task.completionPercentage}
                        onChange={(e) => onUpdateProgress(task._id, Number(e.target.value))}
                        className="w-full accent-blue-600 h-1.5"
                      />
                    </div>

                    {/* Status dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Status:</span>
                      <select
                        value={task.status}
                        onChange={(e) => onUpdateProgress(task._id, task.completionPercentage, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 outline-none focus:border-blue-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => onUpdateProgress(task._id, task.completionPercentage, task.status, true)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Icon name="checkCircle" className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── My Projects List ──────────────────────────────────────────────────────────
export const MyProjectsList = ({ projects = [] }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5">
    <h2 className="text-sm font-bold text-slate-700 mb-4">My Projects</h2>

    {projects.length === 0 ? (
      <div className="text-center py-6 text-slate-400 text-xs">
        <Icon name="folder" className="w-6 h-6 mx-auto mb-1 text-slate-300" />
        Not assigned to any project yet
      </div>
    ) : (
      <div className="space-y-3">
        {projects.map((p) => (
          <div key={p._id} className="group">
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                  {p.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {p.myTaskCount} of {p.totalTasks} tasks · due{" "}
                  {new Date(p.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <Badge status={p.status} showDot />
            </div>
            <ProgressBar value={p.progressPercentage} showLabel size="sm" />
          </div>
        ))}
      </div>
    )}
  </div>
);

// ── Deadline Countdown Chips ──────────────────────────────────────────────────
export const UpcomingDeadlines = ({ deadlines = [] }) => {
  const diff = (d) => Math.ceil((new Date(d) - Date.now()) / 86400000);

  const chipColor = (d) => {
    const days = diff(d);
    if (days < 0)  return "bg-red-50 border-red-200 text-red-700";
    if (days < 2)  return "bg-amber-50 border-amber-200 text-amber-700";
    if (days < 7)  return "bg-blue-50 border-blue-200 text-blue-700";
    return "bg-slate-50 border-slate-200 text-slate-600";
  };

  const chipLabel = (d) => {
    const days = diff(d);
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days}d left`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="clock" className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-bold text-slate-700">Upcoming Deadlines</h2>
      </div>

      {deadlines.length === 0 ? (
        <div className="text-center py-4 text-slate-400 text-xs">All caught up! 🎉</div>
      ) : (
        <div className="space-y-2.5">
          {[...deadlines].sort((a, b) => new Date(a.date) - new Date(b.date)).map((d, i) => (
            <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${chipColor(d.date)}`}>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{d.title}</p>
                <p className="text-[10px] opacity-70 truncate">{d.project}</p>
              </div>
              <span className="text-[10px] font-bold ml-2 flex-shrink-0">{chipLabel(d.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Progress Summary Card ─────────────────────────────────────────────────────
export const ProgressSummary = ({ tasks = [] }) => {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProg    = tasks.filter(t => t.status === "in-progress").length;
  const pending   = tasks.filter(t => t.status === "pending").length;
  const avgPct    = total ? Math.round(tasks.reduce((a, t) => a + t.completionPercentage, 0) / total) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h2 className="text-sm font-bold text-slate-700 mb-4">My Progress</h2>

      {/* Circle indicator (CSS only) */}
      <div className="flex items-center gap-5 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="#2563eb" strokeWidth="3"
              strokeDasharray={`${avgPct} ${100 - avgPct}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-black text-slate-800">{avgPct}%</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-xs text-slate-600">{completed} Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-xs text-slate-600">{inProg} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 flex-shrink-0" />
            <span className="text-xs text-slate-600">{pending} Pending</span>
          </div>
        </div>
      </div>

      <ProgressBar value={avgPct} showLabel color={avgPct >= 70 ? "bg-emerald-500" : avgPct >= 40 ? "bg-blue-500" : "bg-amber-400"} />
      <p className="text-[10px] text-slate-400 mt-1.5 text-center">Average completion across {total} task{total !== 1 ? "s" : ""}</p>
    </div>
  );
};
