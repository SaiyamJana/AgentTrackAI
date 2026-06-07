import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useMyTasks } from "../../hooks/useTasks";

// ── Helpers ───────────────────────────────────────────────────────────────────
const priorityConfig = {
  high:   { color: "bg-red-50 text-red-700 border-red-200" },
  medium: { color: "bg-amber-50 text-amber-700 border-amber-200" },
  low:    { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const statusConfig = {
  "pending":     { color: "bg-slate-100 text-slate-600",    label: "Pending" },
  "in-progress": { color: "bg-blue-50 text-blue-700",       label: "In Progress" },
  "completed":   { color: "bg-emerald-50 text-emerald-700", label: "Completed" },
};

const isOverdue = (task) =>
  task.status !== "completed" && new Date(task.deadline) < Date.now();

const formatDate = (date) => {
  if (!date) return { label: "No deadline", overdue: false };
  const diff = Math.round((new Date(date) - Date.now()) / 86400000);
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  return { label: `Due in ${diff}d`, overdue: false };
};

// ── Update Progress Modal ─────────────────────────────────────────────────────
const UpdateModal = ({ task, onClose, onSave }) => {
  const [percentage, setPercentage] = useState(task.completionPercentage ?? 0);
  const [status, setStatus]         = useState(task.status);
  const [actualHours, setActualHours] = useState(task.actualHours ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setSubmitting(true);
    setErr("");
    try {
      await onSave(task._id, { completionPercentage: percentage, status, actualHours });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Update Progress</h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {err && (
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-xl border border-red-200">{err}</div>
          )}

          {/* Progress slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500">Completion</label>
              <span className="text-sm font-bold text-blue-600">{percentage}%</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={percentage}
              onChange={e => {
                const val = Number(e.target.value);
                setPercentage(val);
                if (val === 100) setStatus("completed");
                else if (val > 0 && status === "pending") setStatus("in-progress");
              }}
              className="w-full accent-blue-600" />
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className={`h-full rounded-full transition-all ${percentage === 100 ? "bg-emerald-500" : percentage > 50 ? "bg-blue-500" : "bg-amber-500"}`}
                style={{ width: `${percentage}%` }} />
            </div>
          </div>

          {/* Status buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Status</label>
            <div className="flex gap-2">
              {["pending", "in-progress", "completed"].map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${status === s ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {statusConfig[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Actual hours */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Actual Hours Spent{" "}
              <span className="text-slate-400 font-normal">(estimated: {task.estimatedHours ?? 0}h)</span>
            </label>
            <input type="number" value={actualHours} onChange={e => setActualHours(Number(e.target.value))} min={0}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
            {submitting ? "Saving…" : "Save Progress"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onUpdate }) => {
  const p      = priorityConfig[task.priority] ?? priorityConfig.medium;
  const s      = statusConfig[task.status]     ?? statusConfig.pending;
  const dl     = formatDate(task.deadline);
  const overdue = isOverdue(task);

  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 ${overdue ? "border-red-200" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>
            {task.priority?.toUpperCase()}
          </span>
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg ${s.color}`}>
            {s.label}
          </span>
        </div>
        <span className={`text-xs font-medium flex items-center gap-1 flex-shrink-0 ${overdue ? "text-red-500" : "text-slate-400"}`}>
          <Icon name="clock" className="w-3 h-3" /> {dl.label}
        </span>
      </div>

      <h3 className="text-sm font-bold text-slate-800 mb-1">{task.title}</h3>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-bold text-slate-600">{task.completionPercentage ?? 0}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${task.status === "completed" ? "bg-emerald-500" : (task.completionPercentage ?? 0) > 50 ? "bg-blue-500" : "bg-amber-400"}`}
            style={{ width: `${task.completionPercentage ?? 0}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Icon name="folder" className="w-3 h-3" />
            {task.projectId?.title ?? "—"}
          </span>
          <span className="text-xs text-slate-400">
            {task.actualHours ?? 0}h / {task.estimatedHours ?? 0}h
          </span>
        </div>

        {task.status !== "completed" ? (
          <button onClick={() => onUpdate(task)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            Update
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Icon name="checkCircle" className="w-3.5 h-3.5" /> Done
          </span>
        )}
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyTasksPage() {
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [updateTask,     setUpdateTask]     = useState(null);

  const { tasks, stats, loading, error, updateTask: doUpdate } = useMyTasks({
    ...(filterStatus   ? { status: filterStatus }     : {}),
    ...(filterPriority ? { priority: filterPriority } : {}),
  });

  const TaskIcon  = (p) => <Icon name="task"        {...p} />;
  const CheckIcon = (p) => <Icon name="checkCircle" {...p} />;
  const ClockIcon = (p) => <Icon name="clock"       {...p} />;
  const WarnIcon  = (p) => <Icon name="exclamation" {...p} />;

  return (
    <DashboardLayout title="My Tasks">
      {/* Header */}
      <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">My Tasks 👋</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {stats.overdue > 0
            ? `${stats.overdue} overdue task${stats.overdue > 1 ? "s" : ""} need your attention.`
            : loading ? "Loading your tasks…" : "You're on track — keep it up!"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Total Tasks"  value={stats.total}      sub="assigned to me"   icon={TaskIcon}  color="blue"   />
        <StatCard label="Completed"    value={stats.completed}  sub="this sprint"       icon={CheckIcon} color="green"  />
        <StatCard label="In Progress"  value={stats.inProgress} sub="currently active"  icon={ClockIcon} color="purple" />
        <StatCard label="Overdue"      value={stats.overdue}    sub="need attention"    icon={WarnIcon}  color={stats.overdue > 0 ? "red" : "slate"} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-5 page-enter-delay-2">
        {["", "pending", "in-progress", "completed"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filterStatus === s ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            {s === "" ? "All" : statusConfig[s]?.label}
          </button>
        ))}
        <div className="ml-auto">
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 focus:outline-none bg-white">
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 animate-pulse h-40" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 page-enter-delay-3">
          {tasks.length === 0 ? (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="checkCircle" className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No tasks here</p>
              <p className="text-xs text-slate-400 mt-1">Try a different filter.</p>
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard key={task._id} task={task} onUpdate={setUpdateTask} />
            ))
          )}
        </div>
      )}

      {/* Update Modal */}
      {updateTask && (
        <UpdateModal
          task={updateTask}
          onClose={() => setUpdateTask(null)}
          onSave={doUpdate}
        />
      )}
    </DashboardLayout>
  );
}
