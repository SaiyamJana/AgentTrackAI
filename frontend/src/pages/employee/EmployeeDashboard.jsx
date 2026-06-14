import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useAuth } from "../../context/AuthContext";
import { useMyTasks, useMyProjects } from "../../hooks/useTasks";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning"; if (h < 17) return "afternoon"; return "evening";
};

const TaskIcon  = (p) => <Icon name="task"        {...p} />;
const CheckIcon = (p) => <Icon name="checkCircle" {...p} />;
const WarnIcon  = (p) => <Icon name="exclamation" {...p} />;
const ClockIcon = (p) => <Icon name="clock"       {...p} />;
const FolderIcon = (p) => <Icon name="folder"     {...p} />;

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, message }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
      <Icon name={icon} className="w-6 h-6 text-slate-300" />
    </div>
    <p className="text-sm font-semibold text-slate-500">{title}</p>
    <p className="text-xs text-slate-400 mt-1">{message}</p>
  </div>
);

// ── Recent task card ──────────────────────────────────────────────────────────
const TaskCard = ({ task, onUpdate }) => {
  const statusCfg = {
    "pending":     { color: "bg-slate-100 text-slate-600", label: "Pending" },
    "in-progress": { color: "bg-blue-50 text-blue-700",    label: "In Progress" },
    "completed":   { color: "bg-emerald-50 text-emerald-700", label: "Done" },
  };
  const priCfg = {
    high:   "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const s   = statusCfg[task.status] ?? statusCfg.pending;
  const p   = priCfg[task.priority]  ?? priCfg.medium;
  const now = Date.now();
  const overdue = task.status !== "completed" && new Date(task.deadline) < now;
  const diff = Math.round((new Date(task.deadline) - now) / 86400000);
  const deadlineLabel = diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? "Due today" : `${diff}d left`;

  return (
    <div className={`bg-white rounded-2xl border p-4 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 transition-all ${overdue ? "border-red-200" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p}`}>{task.priority?.toUpperCase()}</span>
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg ${s.color}`}>{s.label}</span>
        </div>
        <span className={`text-xs flex items-center gap-1 shrink-0 ${overdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>
          <Icon name="clock" className="w-3 h-3" />{deadlineLabel}
        </span>
      </div>
      <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">{task.title}</h3>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-bold text-slate-600">{task.completionPercentage ?? 0}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${task.status === "completed" ? "bg-emerald-500" : (task.completionPercentage ?? 0) > 50 ? "bg-blue-500" : "bg-amber-400"}`}
            style={{ width: `${task.completionPercentage ?? 0}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Icon name="folder" className="w-3 h-3" />
          {task.projectId?.title ?? "—"}
        </span>
        {task.status !== "completed" ? (
          <button onClick={() => onUpdate(task)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">Update</button>
        ) : (
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><Icon name="checkCircle" className="w-3.5 h-3.5"/>Done</span>
        )}
      </div>
    </div>
  );
};

// ── Quick update modal ────────────────────────────────────────────────────────
const UpdateModal = ({ task, onClose, onSave }) => {
  const [pct,    setPct]    = useState(task.completionPercentage ?? 0);
  const [status, setStatus] = useState(task.status);
  const [hours,  setHours]  = useState(task.actualHours ?? 0);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const submit = async () => {
    setSaving(true); setErr("");
    try {
      await onSave(task._id, { completionPercentage: pct, status, actualHours: hours });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div><h2 className="text-base font-bold text-slate-800">Update Progress</h2><p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.title}</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><Icon name="x" className="w-4 h-4 text-slate-500"/></button>
        </div>
        <div className="p-5 space-y-5">
          {err && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-xl border border-red-200">{err}</div>}
          <div>
            <div className="flex justify-between mb-2"><label className="text-xs font-semibold text-slate-500">Completion</label><span className="text-sm font-bold text-blue-600">{pct}%</span></div>
            <input type="range" min={0} max={100} value={pct} onChange={e => { const v = Number(e.target.value); setPct(v); if (v===100) setStatus("completed"); else if (v>0 && status==="pending") setStatus("in-progress"); }} className="w-full accent-blue-600"/>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
              <div className={`h-full rounded-full transition-all ${pct===100?"bg-emerald-500":pct>50?"bg-blue-500":"bg-amber-500"}`} style={{width:`${pct}%`}}/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Status</label>
            <div className="flex gap-2">
              {["pending","in-progress","completed"].map(s => (
                <button key={s} onClick={() => setStatus(s)} className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${status===s?"border-blue-400 bg-blue-50 text-blue-700":"border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {s==="pending"?"Pending":s==="in-progress"?"In Progress":"Done"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Actual Hours <span className="text-slate-400 font-normal">(est: {task.estimatedHours ?? 0}h)</span></label>
            <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} min={0} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"/>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">{saving?"Saving…":"Save Progress"}</button>
        </div>
      </div>
    </div>
  );
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { tasks, stats, loading: tasksLoading, updateStatus, updateProgress } = useMyTasks();
  const { projects, loading: projLoading } = useMyProjects();
  const [updateTask, setUpdateTask] = useState(null);

  const handleSave = async (taskId, payload) => {
    if (payload.status) await updateStatus(taskId, payload.status);
    if (payload.actualHours !== undefined || payload.completionPercentage !== undefined) {
      await updateProgress(taskId, { actualHours: payload.actualHours, completionPercentage: payload.completionPercentage });
    }
  };

  const recentTasks = tasks.slice(0, 4);

  return (
    <DashboardLayout title="My Dashboard">
      {/* Greeting */}
      <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">
          Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {tasksLoading ? "Loading your workspace…"
            : stats.overdue > 0
              ? `You have ${stats.overdue} overdue task${stats.overdue > 1 ? "s" : ""} — let's tackle them first.`
              : tasks.length === 0
                ? "No tasks assigned yet. Your manager will assign tasks to you soon."
                : "You're on track — keep it up!"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Total Tasks"  value={tasksLoading ? "…" : stats.total}      sub="assigned to me"   icon={TaskIcon}  color="blue"   />
        <StatCard label="Completed"    value={tasksLoading ? "…" : stats.completed}  sub="this sprint"      icon={CheckIcon} color="green"  />
        <StatCard label="In Progress"  value={tasksLoading ? "…" : stats.inProgress} sub="currently active" icon={ClockIcon} color="purple" />
        <StatCard label="Overdue"      value={tasksLoading ? "…" : stats.overdue}    sub="need attention"   icon={WarnIcon}  color={stats.overdue > 0 ? "red" : "slate"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 page-enter-delay-2">
        {/* Recent tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">Recent Tasks</h3>
            <a href="/employee/tasks" className="text-xs text-blue-600 font-semibold hover:text-blue-800">View all →</a>
          </div>
          {tasksLoading ? (
            [...Array(3)].map((_,i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-32 animate-pulse"/>)
          ) : recentTasks.length === 0 ? (
            <EmptyState icon="task" title="No tasks yet" message="Your manager hasn't assigned any tasks to you yet." />
          ) : (
            recentTasks.map(task => <TaskCard key={task._id} task={task} onUpdate={setUpdateTask} />)
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* My Projects */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">My Projects</h3>
              <a href="/employee/projects" className="text-xs text-blue-600 font-semibold hover:text-blue-800">View all →</a>
            </div>
            {projLoading ? (
              [...Array(2)].map((_,i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse mb-2"/>)
            ) : projects.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Icon name="folder" className="w-5 h-5 text-slate-300"/>
                </div>
                <p className="text-xs text-slate-400">Not assigned to any project yet.</p>
              </div>
            ) : (
              projects.map(p => (
                <div key={p._id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Icon name="folder" className="w-4 h-4 text-blue-600"/>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{p.status}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.progressPercentage ?? 0}%
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Progress summary */}
          {tasks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Overall Progress</h3>
              {[
                { label: "Completed", val: stats.completed, total: stats.total, color: "bg-emerald-500" },
                { label: "In Progress", val: stats.inProgress, total: stats.total, color: "bg-blue-500" },
                { label: "Pending", val: stats.total - stats.completed - stats.inProgress, total: stats.total, color: "bg-amber-400" },
              ].map(({ label, val, total, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-bold text-slate-700">{val}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: total > 0 ? `${(val / total) * 100}%` : "0%" }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {updateTask && (
        <UpdateModal task={updateTask} onClose={() => setUpdateTask(null)} onSave={handleSave} />
      )}
    </DashboardLayout>
  );
}