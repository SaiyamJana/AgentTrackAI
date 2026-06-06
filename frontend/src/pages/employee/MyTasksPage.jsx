import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useAuth } from "../../context/AuthContext";

// ── Mock Data (wire to /api/v1/tasks/my-tasks in production) ─────────────────
const initialTasks = [
  { _id: "t1", title: "Build Authentication API", description: "Implement JWT-based auth endpoints including login, register and token refresh. Ensure password hashing with bcrypt.", priority: "high", status: "in-progress", deadline: new Date(Date.now() + 86400000), completionPercentage: 65, projectName: "Q3 Infrastructure", estimatedHours: 12, actualHours: 8 },
  { _id: "t2", title: "Write Unit Tests – Auth Module", description: "Achieve 80% test coverage on all authentication endpoints using Jest.", priority: "medium", status: "pending", deadline: new Date(Date.now() + 3 * 86400000), completionPercentage: 10, projectName: "Q3 Infrastructure", estimatedHours: 8, actualHours: 1 },
  { _id: "t3", title: "Design System Audit", description: "Review current component library against Figma specs, log inconsistencies in a shared doc.", priority: "low", status: "completed", deadline: new Date(Date.now() - 86400000), completionPercentage: 100, projectName: "Customer Portal", estimatedHours: 6, actualHours: 5 },
  { _id: "t4", title: "Responsive Mobile Layout", description: "Implement responsive breakpoints for the new customer portal dashboard pages.", priority: "high", status: "pending", deadline: new Date(Date.now() - 2 * 86400000), completionPercentage: 30, projectName: "Customer Portal", estimatedHours: 10, actualHours: 3 },
  { _id: "t5", title: "API Documentation", description: "Write Swagger/OpenAPI documentation for all REST endpoints.", priority: "low", status: "pending", deadline: new Date(Date.now() + 10 * 86400000), completionPercentage: 0, projectName: "Q3 Infrastructure", estimatedHours: 4, actualHours: 0 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const priorityConfig = {
  high:   { color: "bg-red-50 text-red-700 border-red-200" },
  medium: { color: "bg-amber-50 text-amber-700 border-amber-200" },
  low:    { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const statusConfig = {
  "pending":     { color: "bg-slate-100 text-slate-600",    label: "Pending",     next: "in-progress" },
  "in-progress": { color: "bg-blue-50 text-blue-700",       label: "In Progress", next: "completed" },
  "completed":   { color: "bg-emerald-50 text-emerald-700", label: "Completed",   next: null },
};

const isOverdue = (task) =>
  task.status !== "completed" && new Date(task.deadline) < Date.now();

const formatDate = (date) => {
  const d    = new Date(date);
  const diff = Math.round((d - Date.now()) / 86400000);
  if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  return { label: `Due in ${diff}d`, overdue: false };
};

// ── Update Progress Modal ─────────────────────────────────────────────────────
const UpdateModal = ({ task, onClose, onSave }) => {
  const [percentage, setPercentage] = useState(task.completionPercentage);
  const [status, setStatus]         = useState(task.status);
  const [actualHours, setActualHours] = useState(task.actualHours);

  const submit = () => {
    onSave(task._id, { completionPercentage: percentage, status, actualHours });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
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
          {/* Progress slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500">Completion</label>
              <span className="text-sm font-bold text-blue-600">{percentage}%</span>
            </div>
            <input type="range" min={0} max={100} value={percentage}
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

          {/* Status */}
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
              Actual Hours Spent <span className="text-slate-400 font-normal">(estimated: {task.estimatedHours}h)</span>
            </label>
            <input type="number" value={actualHours} onChange={e => setActualHours(Number(e.target.value))} min={0}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Save Progress</button>
        </div>
      </div>
    </div>
  );
};

// ── Task Card ─────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onUpdate }) => {
  const p      = priorityConfig[task.priority];
  const s      = statusConfig[task.status];
  const dl     = formatDate(task.deadline);
  const overdue = isOverdue(task);

  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 ${overdue ? "border-red-200" : "border-slate-100"}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>
            {task.priority.toUpperCase()}
          </span>
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg ${s.color}`}>
            {s.label}
          </span>
        </div>
        <span className={`text-xs font-medium flex items-center gap-1 flex-shrink-0 ${overdue ? "text-red-500" : "text-slate-400"}`}>
          <Icon name="clock" className="w-3 h-3" /> {dl.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-800 mb-1">{task.title}</h3>
      <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-bold text-slate-600">{task.completionPercentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${task.status === "completed" ? "bg-emerald-500" : task.completionPercentage > 50 ? "bg-blue-500" : "bg-amber-400"}`}
            style={{ width: `${task.completionPercentage}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Icon name="folder" className="w-3 h-3" /> {task.projectName}
          </span>
          <span className="text-xs text-slate-400">
            {task.actualHours}h / {task.estimatedHours}h
          </span>
        </div>
        {task.status !== "completed" && (
          <button onClick={() => onUpdate(task)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
            Update
          </button>
        )}
        {task.status === "completed" && (
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
  const { user } = useAuth();
  const [tasks, setTasks]         = useState(initialTasks);
  const [updateTask, setUpdateTask] = useState(null);
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const handleSave = (taskId, updates) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
    // TODO: PATCH /api/v1/tasks/:taskId
  };

  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProg    = tasks.filter(t => t.status === "in-progress").length;
  const overdue   = tasks.filter(t => isOverdue(t)).length;

  const filtered = tasks.filter(t => {
    const matchStatus   = filterStatus   === "all" || t.status   === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchStatus && matchPriority;
  });

  const TaskIcon  = (p) => <Icon name="task"        {...p} />;
  const CheckIcon = (p) => <Icon name="checkCircle" {...p} />;
  const ClockIcon = (p) => <Icon name="clock"       {...p} />;
  const WarnIcon  = (p) => <Icon name="exclamation" {...p} />;

  return (
    <DashboardLayout title="My Tasks">
      {/* Header */}
      <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">
          My Tasks 👋
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {overdue > 0
            ? `${overdue} overdue task${overdue > 1 ? "s" : ""} need your attention.`
            : "You're on track — keep it up!"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Total Tasks"  value={total}     sub="assigned to me"   icon={TaskIcon}  color="blue"   />
        <StatCard label="Completed"    value={completed} sub="this sprint"       icon={CheckIcon} color="green"  />
        <StatCard label="In Progress"  value={inProg}    sub="currently active"  icon={ClockIcon} color="purple" />
        <StatCard label="Overdue"      value={overdue}   sub="need attention"    icon={WarnIcon}  color={overdue > 0 ? "red" : "slate"} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap mb-5 page-enter-delay-2">
        {["all", "pending", "in-progress", "completed"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${filterStatus === s ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            {s === "all" ? "All" : statusConfig[s]?.label}
          </button>
        ))}
        <div className="ml-auto">
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 focus:outline-none bg-white">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 page-enter-delay-3">
        {filtered.length === 0 ? (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Icon name="checkCircle" className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No tasks here</p>
            <p className="text-xs text-slate-400 mt-1">Try a different filter.</p>
          </div>
        ) : (
          filtered.map(task => (
            <TaskCard key={task._id} task={task} onUpdate={setUpdateTask} />
          ))
        )}
      </div>

      {/* Update Modal */}
      {updateTask && (
        <UpdateModal task={updateTask} onClose={() => setUpdateTask(null)} onSave={handleSave} />
      )}
    </DashboardLayout>
  );
}