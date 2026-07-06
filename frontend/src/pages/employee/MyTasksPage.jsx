import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useMyTasks } from "../../hooks/useTasks";

const priorityCfg = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const statusCfg = {
  pending: { color: "bg-slate-100 text-slate-600", label: "Pending" },
  "in-progress": { color: "bg-primary-light text-primary", label: "In Progress" },
  completed: { color: "bg-emerald-50 text-emerald-700", label: "Completed" },
};
const formatDl = (date) => {
  if (!date) return { label: "No deadline", overdue: false };
  const diff = Math.round((new Date(date) - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  return { label: `Due in ${diff}d`, overdue: false };
};

// ── Update Modal ──────────────────────────────────────────────────────────────
const UpdateModal = ({ task, onClose, onSave }) => {
  const [pct, setPct] = useState(task.completionPercentage ?? 0);
  const [status, setStatus] = useState(task.status);
  const [hours, setHours] = useState(task.actualHours ?? 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [remarks, setRemarks] = useState(task.remarks ?? "");

  const submit = async () => {
    setSaving(true);
    setErr("");
    try {
      await onSave(task._id, {
        completionPercentage: pct,
        actualHours: hours,
        remarks,
      });
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Update Progress
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {task.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {err && (
            <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-xl border border-red-200">
              {err}
            </div>
          )}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500">
                Completion
              </label>
              <span className="text-sm font-bold text-primary">{pct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPct(v);
                if (v === 100) setStatus("completed");
                else if (v > 0 && status === "pending")
                  setStatus("in-progress");
              }}
              className="w-full accent-blue-600"
            />
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 50 ? "bg-primary-light0" : "bg-amber-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Status
            </label>
            <div className="flex gap-2">
              {["pending", "in-progress", "completed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${status === s ? "border-blue-400 bg-primary-light text-primary" : "border-slate-200 text-slate-500"}`}
                >
                  {statusCfg[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Actual Hours{" "}
              <span className="font-normal text-slate-400">
                (est: {task.estimatedHours ?? 0}h)
              </span>
            </label>
            <input
              type="number"
              value={hours}
              min={0}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              What are you working on?{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Describe what you're currently doing on this task..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-400 transition-all resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onUpdate }) => {
  const p = priorityCfg[task.priority] ?? priorityCfg.medium;
  const s = statusCfg[task.status] ?? statusCfg.pending;
  const dl = formatDl(task.deadline);
  return (
    <div
      className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 ${dl.overdue ? "border-red-200" : "border-slate-100"}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p}`}
          >
            {task.priority?.toUpperCase()}
          </span>
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg ${s.color}`}
          >
            {s.label}
          </span>
        </div>
        <span
          className={`text-xs flex items-center gap-1 shrink-0 ${dl.overdue ? "text-red-500 font-semibold" : "text-slate-400"}`}
        >
          <Icon name="clock" className="w-3 h-3" />
          {dl.label}
        </span>
      </div>
      <h3 className="text-sm font-bold text-slate-800 mb-1">{task.title}</h3>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
        {task.description}
      </p>
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-bold text-slate-600">
            {task.completionPercentage ?? 0}%
          </span>
        </div>
        {task.remarks && (
          <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
            <Icon
              name="edit"
              className="w-3 h-3 text-slate-400 mt-0.5 shrink-0"
            />
            <p className="text-xs text-slate-500 line-clamp-2">
              {task.remarks}
            </p>
          </div>
        )}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${task.status === "completed" ? "bg-emerald-500" : (task.completionPercentage ?? 0) > 50 ? "bg-primary-light0" : "bg-amber-400"}`}
            style={{ width: `${task.completionPercentage ?? 0}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Icon name="folder" className="w-3 h-3" />
          {task.projectId?.title ?? "—"}
        </span>
        {task.status !== "completed" ? (
          <button
            onClick={() => onUpdate(task)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-light text-primary hover:bg-primary-light transition-colors"
          >
            Update
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Icon name="checkCircle" className="w-3.5 h-3.5" />
            Done
          </span>
        )}
        {(task.subManagerId || task.teamMembers?.length > 0) && (
  <div className="flex items-center gap-1.5 mb-3">
    {task.subManagerId && (
      <div className="relative shrink-0" title={`${task.subManagerId.name} (Sub-Manager) — ${task.subManagerId.isOnline ? "Online" : "Offline"}`}>
        <div className="w-6 h-6 rounded-full bg-violet-200 flex items-center justify-center text-[9px] font-bold text-violet-700">
          {task.subManagerId.name?.[0]?.toUpperCase()}
        </div>
        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white ${
          task.subManagerId.isOnline ? "bg-emerald-500" : "bg-slate-300"
        }`} />
      </div>
    )}
    {task.teamMembers?.slice(0, 4).map(member => (
      <div key={member._id} className="relative shrink-0" title={`${member.name} — ${member.isOnline ? "Online" : "Offline"}`}>
        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
          {member.name?.[0]?.toUpperCase()}
        </div>
        <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-white ${
          member.isOnline ? "bg-emerald-500" : "bg-slate-300"
        }`} />
      </div>
    ))}
    {task.teamMembers?.length > 4 && (
      <span className="text-[10px] font-semibold text-slate-400 ml-0.5">
        +{task.teamMembers.length - 4}
      </span>
    )}
  </div>
)}
      </div>
    </div>
  );
};

const TaskIcon = (p) => <Icon name="task" {...p} />;
const CheckIcon = (p) => <Icon name="checkCircle" {...p} />;
const ClockIcon = (p) => <Icon name="clock" {...p} />;
const WarnIcon = (p) => <Icon name="exclamation" {...p} />;

export default function MyTasksPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [updateTask, setUpdateTask] = useState(null);

  const { tasks, stats, loading, error, updateProgress } = useMyTasks({
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterPriority ? { priority: filterPriority } : {}),
  });

  // Backend derives status automatically from completionPercentage — one call only
  const handleSave = async (taskId, payload) => {
    await updateProgress(taskId, {
      completionPercentage: payload.completionPercentage,
      actualHours: payload.actualHours,
      remarks: payload.remarks,
    });
  };

  return (
    <DashboardLayout title="My Tasks">
      <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">My Tasks</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {loading
            ? "Loading…"
            : stats.overdue > 0
              ? `${stats.overdue} overdue task${stats.overdue > 1 ? "s" : ""} need your attention.`
              : "You're on track — keep it up!"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard
          label="Total"
          value={loading ? "…" : stats.total}
          sub="assigned to me"
          icon={TaskIcon}
          color="blue"
        />
        <StatCard
          label="Completed"
          value={loading ? "…" : stats.completed}
          sub="this sprint"
          icon={CheckIcon}
          color="green"
        />
        <StatCard
          label="In Progress"
          value={loading ? "…" : stats.inProgress}
          sub="active"
          icon={ClockIcon}
          color="purple"
        />
        <StatCard
          label="Overdue"
          value={loading ? "…" : stats.overdue}
          sub="need attention"
          icon={WarnIcon}
          color={stats.overdue > 0 ? "red" : "slate"}
        />
      </div>

      <div className="flex gap-3 flex-wrap mb-5 page-enter-delay-2">
        {["", "pending", "in-progress", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filterStatus === s ? "bg-primary text-white border-primary shadow-sm shadow-blue-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
          >
            {s === "" ? "All" : statusCfg[s]?.label}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 focus:outline-none bg-white"
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 animate-pulse h-40"
            />
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
                <Icon name="checkCircle" className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                No tasks found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {filterStatus || filterPriority
                  ? "Try a different filter."
                  : "Your manager hasn't assigned any tasks yet."}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task._id} task={task} onUpdate={setUpdateTask} />
            ))
          )}
        </div>
      )}

      {updateTask && (
        <UpdateModal
          task={updateTask}
          onClose={() => setUpdateTask(null)}
          onSave={handleSave}
        />
      )}
    </DashboardLayout>
  );
}
