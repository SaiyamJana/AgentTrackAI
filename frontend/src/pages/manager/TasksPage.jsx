import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import Badge from "../../components/shared/Badge";

// ── Mock Data (wire to /api/v1/tasks in production) ──────────────────────────
const mockTasks = [
  { _id: "t1", title: "Build Authentication API", description: "Implement JWT-based auth endpoints including login, register and token refresh.", priority: "high", status: "in-progress", deadline: new Date(Date.now() + 86400000), completionPercentage: 65, projectId: "p1", projectName: "Q3 Infrastructure", assignedTo: { _id: "u1", name: "Akhila Pandu" }, assignedBy: { name: "Manager" }, estimatedHours: 12, actualHours: 8 },
  { _id: "t2", title: "Write Unit Tests – Auth Module", description: "Achieve 80% test coverage on all authentication endpoints using Jest.", priority: "medium", status: "pending", deadline: new Date(Date.now() + 3 * 86400000), completionPercentage: 10, projectId: "p1", projectName: "Q3 Infrastructure", assignedTo: { _id: "u2", name: "Ravi Kumar" }, assignedBy: { name: "Manager" }, estimatedHours: 8, actualHours: 1 },
  { _id: "t3", title: "Design System Audit", description: "Review current component library against Figma specs.", priority: "low", status: "completed", deadline: new Date(Date.now() - 86400000), completionPercentage: 100, projectId: "p2", projectName: "Customer Portal", assignedTo: { _id: "u3", name: "Priya Sharma" }, assignedBy: { name: "Manager" }, estimatedHours: 6, actualHours: 5 },
  { _id: "t4", title: "Responsive Mobile Layout", description: "Implement responsive breakpoints for the new customer portal dashboard pages.", priority: "high", status: "pending", deadline: new Date(Date.now() - 2 * 86400000), completionPercentage: 30, projectId: "p2", projectName: "Customer Portal", assignedTo: { _id: "u1", name: "Akhila Pandu" }, assignedBy: { name: "Manager" }, estimatedHours: 10, actualHours: 3 },
  { _id: "t5", title: "Payment Gateway Integration", description: "Connect Stripe payment gateway to the backend API.", priority: "high", status: "in-progress", deadline: new Date(Date.now() + 5 * 86400000), completionPercentage: 45, projectId: "p3", projectName: "Payment Module", assignedTo: { _id: "u2", name: "Ravi Kumar" }, assignedBy: { name: "Manager" }, estimatedHours: 20, actualHours: 9 },
  { _id: "t6", title: "Database Schema Optimization", description: "Optimize MongoDB indexes for better query performance.", priority: "medium", status: "pending", deadline: new Date(Date.now() + 7 * 86400000), completionPercentage: 0, projectId: "p1", projectName: "Q3 Infrastructure", assignedTo: { _id: "u3", name: "Priya Sharma" }, assignedBy: { name: "Manager" }, estimatedHours: 5, actualHours: 0 },
];

const mockEmployees = [
  { _id: "u1", name: "Akhila Pandu" },
  { _id: "u2", name: "Ravi Kumar" },
  { _id: "u3", name: "Priya Sharma" },
];

const mockProjects = [
  { _id: "p1", title: "Q3 Infrastructure" },
  { _id: "p2", title: "Customer Portal" },
  { _id: "p3", title: "Payment Module" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const priorityConfig = {
  high:   { color: "bg-red-50 text-red-700 border-red-200",    dot: "bg-red-500" },
  medium: { color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  low:    { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

const statusConfig = {
  "pending":     { color: "bg-slate-100 text-slate-600",    label: "Pending" },
  "in-progress": { color: "bg-blue-50 text-blue-700",       label: "In Progress" },
  "completed":   { color: "bg-emerald-50 text-emerald-700", label: "Completed" },
};

const isOverdue = (task) =>
  task.status !== "completed" && new Date(task.deadline) < Date.now();

const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.round((d - now) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: false };
  return { label: `${diff}d left`, overdue: false };
};

// ── Create Task Modal ─────────────────────────────────────────────────────────
const CreateTaskModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium", status: "pending",
    assignedTo: "", projectId: "", deadline: "", estimatedHours: "",
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = () => {
    if (!form.title || !form.assignedTo || !form.projectId) return;
    const employee = mockEmployees.find(e => e._id === form.assignedTo);
    const project  = mockProjects.find(p => p._id === form.projectId);
    onCreate({
      ...form,
      _id: Date.now().toString(),
      assignedTo: employee,
      projectName: project?.title,
      completionPercentage: 0,
      actualHours: 0,
      deadline: form.deadline ? new Date(form.deadline) : new Date(Date.now() + 7 * 86400000),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Icon name="plus" className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Create New Task</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Task Title *</label>
            <input name="title" value={form.title} onChange={handle} placeholder="Enter task title..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={2} placeholder="Describe the task..."
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Assign To *</label>
              <select name="assignedTo" value={form.assignedTo} onChange={handle}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white">
                <option value="">Select employee</option>
                {mockEmployees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Project *</label>
              <select name="projectId" value={form.projectId} onChange={handle}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white">
                <option value="">Select project</option>
                {mockProjects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Priority</label>
              <select name="priority" value={form.priority} onChange={handle}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Deadline</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handle}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Est. Hours</label>
              <input type="number" name="estimatedHours" value={form.estimatedHours} onChange={handle} placeholder="0"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={submit} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Reassign Modal ────────────────────────────────────────────────────────────
const ReassignModal = ({ task, onClose, onReassign }) => {
  const [selectedId, setSelectedId] = useState(task.assignedTo._id);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Reassign Task</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-500 mb-4">Reassigning: <span className="font-semibold text-slate-700">{task.title}</span></p>
          <div className="flex flex-col gap-2">
            {mockEmployees.map(e => (
              <button key={e._id} onClick={() => setSelectedId(e._id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedId === e._id ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700">
                  {e.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-700">{e.name}</span>
                {selectedId === e._id && <Icon name="checkCircle" className="w-4 h-4 text-blue-600 ml-auto" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => { onReassign(task._id, selectedId); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Reassign</button>
        </div>
      </div>
    </div>
  );
};

// ── Task Row ──────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onDelete, onReassign }) => {
  const p  = priorityConfig[task.priority];
  const s  = statusConfig[task.status];
  const dl = formatDate(task.deadline);
  const overdue = isOverdue(task);

  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 ${overdue ? "border-red-200" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title + badges */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-800 truncate">{task.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>
              {task.priority.toUpperCase()}
            </span>
          </div>
          {/* Description */}
          <p className="text-xs text-slate-400 line-clamp-1 mb-2">{task.description}</p>
          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${s.color}`}>{s.label}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Icon name="folder" className="w-3 h-3" /> {task.projectName}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Icon name="users" className="w-3 h-3" /> {task.assignedTo?.name}
            </span>
            <span className={`text-xs font-medium flex items-center gap-1 ${overdue ? "text-red-600" : "text-slate-400"}`}>
              <Icon name="clock" className="w-3 h-3" /> {dl.label}
            </span>
          </div>
        </div>

        {/* Progress + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-xs font-bold text-slate-600">{task.completionPercentage}%</div>
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${task.status === "completed" ? "bg-emerald-500" : task.completionPercentage > 50 ? "bg-blue-500" : "bg-amber-500"}`}
              style={{ width: `${task.completionPercentage}%` }} />
          </div>
          <div className="flex gap-1 mt-1">
            <button onClick={() => onReassign(task)}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-200">
              Reassign
            </button>
            <button onClick={() => onDelete(task._id)}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-200">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks]           = useState(mockTasks);
  const [showCreate, setShowCreate] = useState(false);
  const [reassignTask, setReassignTask] = useState(null);
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterProject, setFilterProject]   = useState("all");
  const [search, setSearch] = useState("");

  // Stats
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProg    = tasks.filter(t => t.status === "in-progress").length;
  const overdue   = tasks.filter(t => isOverdue(t)).length;

  // Filtered
  const filtered = tasks.filter(t => {
    const matchStatus   = filterStatus   === "all" || t.status   === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    const matchProject  = filterProject  === "all" || t.projectId === filterProject;
    const matchSearch   = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
                          t.assignedTo?.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchProject && matchSearch;
  });

  const handleCreate = (task) => setTasks(prev => [task, ...prev]);

  const handleDelete = (id) => setTasks(prev => prev.filter(t => t._id !== id));

  const handleReassign = (taskId, employeeId) => {
    const employee = mockEmployees.find(e => e._id === employeeId);
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, assignedTo: employee } : t));
  };

  const TaskIcon  = (p) => <Icon name="task"        {...p} />;
  const CheckIcon = (p) => <Icon name="checkCircle" {...p} />;
  const ClockIcon = (p) => <Icon name="clock"       {...p} />;
  const WarnIcon  = (p) => <Icon name="exclamation" {...p} />;

  return (
    <DashboardLayout title="Task Management">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">All Tasks</h2>
          <p className="text-sm text-slate-500 mt-0.5">{total} tasks across {mockProjects.length} projects</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Icon name="plus" className="w-4 h-4" /> Create Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Total Tasks"   value={total}     sub="all projects"      icon={TaskIcon}  color="blue"  />
        <StatCard label="Completed"     value={completed} sub="this sprint"       icon={CheckIcon} color="green" />
        <StatCard label="In Progress"   value={inProg}    sub="currently active"  icon={ClockIcon} color="purple" />
        <StatCard label="Overdue"       value={overdue}   sub="need attention"    icon={WarnIcon}  color={overdue > 0 ? "red" : "slate"} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 page-enter-delay-2">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-48 border border-slate-200 rounded-xl px-3.5 py-2">
            <Icon name="chart" className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or assignee..."
              className="flex-1 text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent" />
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority filter */}
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Project filter */}
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="all">All Projects</option>
            {mockProjects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3 page-enter-delay-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Icon name="task" className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No tasks found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your filters or create a new task.</p>
          </div>
        ) : (
          filtered.map(task => (
            <TaskRow key={task._id} task={task}
              onDelete={handleDelete}
              onReassign={(t) => setReassignTask(t)} />
          ))
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {reassignTask && <ReassignModal task={reassignTask} onClose={() => setReassignTask(null)} onReassign={handleReassign} />}
    </DashboardLayout>
  );
}