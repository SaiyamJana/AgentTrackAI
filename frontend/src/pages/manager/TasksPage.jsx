import { useState, useMemo } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useTaskList, useManagerProjects, useProjectMembers } from "../../hooks/useTasks";

const priorityCfg = {
  high:   { color: "bg-red-50 text-red-700 border-red-200" },
  medium: { color: "bg-amber-50 text-amber-700 border-amber-200" },
  low:    { color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};
const statusCfg = {
  "pending":     { color: "bg-slate-100 text-slate-600",    label: "Pending" },
  "in-progress": { color: "bg-blue-50 text-blue-700",       label: "In Progress" },
  "completed":   { color: "bg-emerald-50 text-emerald-700", label: "Completed" },
};
const formatDl = (date) => {
  if (!date) return { label: "No deadline", overdue: false };
  const diff = Math.round((new Date(date) - Date.now()) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: "Due today",   overdue: false };
  return { label: `${diff}d left`, overdue: false };
};

// ── Create Task Modal ─────────────────────────────────────────────────────────
const CreateTaskModal = ({ projects, onClose, onCreate }) => {
  const [form, setForm] = useState({ title:"", description:"", priority:"medium", assignedTo:"", projectId:"", deadline:"", estimatedHours:"" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const { members, loading: membersLoading } = useProjectMembers(form.projectId);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.title || !form.assignedTo || !form.projectId || !form.deadline) { setErr("Title, project, assignee and deadline are required."); return; }
    setSubmitting(true); setErr("");
    try { await onCreate({ ...form, estimatedHours: Number(form.estimatedHours)||0 }); onClose(); }
    catch (e) { setErr(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><Icon name="plus" className="w-4 h-4 text-blue-600"/></div>
            <h2 className="text-base font-bold text-slate-800">Create New Task</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><Icon name="x" className="w-4 h-4 text-slate-500"/></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {err && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-xl border border-red-200">{err}</div>}
          <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Task Title *</label>
            <input name="title" value={form.title} onChange={handle} placeholder="Enter task title…" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"/></div>
          <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={2} placeholder="Describe the task…" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Project *</label>
              <select name="projectId" value={form.projectId} onChange={handle} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                <option value="">Select project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Assign To *</label>
              <select name="assignedTo" value={form.assignedTo} onChange={handle} disabled={!form.projectId||membersLoading} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white disabled:opacity-50">
                <option value="">{form.projectId ? (membersLoading ? "Loading…" : members.length === 0 ? "No members yet" : "Select member") : "Select project first"}</option>
                {members.map(m => <option key={m.employeeId?._id ?? m._id} value={m.employeeId?._id ?? m._id}>{m.employeeId?.name ?? m.name}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Priority</label>
              <select name="priority" value={form.priority} onChange={handle} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none bg-white">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select></div>
            <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Deadline *</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handle} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"/></div>
            <div><label className="text-xs font-semibold text-slate-500 mb-1.5 block">Est. Hours</label>
              <input type="number" name="estimatedHours" value={form.estimatedHours} onChange={handle} placeholder="0" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"/></div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">{submitting?"Creating…":"Create Task"}</button>
        </div>
      </div>
    </div>
  );
};

// ── Task Row ──────────────────────────────────────────────────────────────────
const TaskRow = ({ task, onDelete }) => {
  const p  = priorityCfg[task.priority] ?? priorityCfg.medium;
  const s  = statusCfg[task.status]     ?? statusCfg.pending;
  const dl = formatDl(task.deadline);
  return (
    <div className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 ${dl.overdue?"border-red-200":"border-slate-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-800 truncate">{task.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.color}`}>{task.priority?.toUpperCase()}</span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-1 mb-2">{task.description}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${s.color}`}>{s.label}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Icon name="folder" className="w-3 h-3"/>{task.projectId?.title ?? "—"}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Icon name="users" className="w-3 h-3"/>{task.assignedTo?.name ?? "—"}</span>
            <span className={`text-xs flex items-center gap-1 ${dl.overdue?"text-red-600 font-semibold":"text-slate-400"}`}><Icon name="clock" className="w-3 h-3"/>{dl.label}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-600">{task.completionPercentage ?? 0}%</span>
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${task.status==="completed"?"bg-emerald-500":(task.completionPercentage??0)>50?"bg-blue-500":"bg-amber-500"}`} style={{width:`${task.completionPercentage??0}%`}}/>
          </div>
          <button onClick={() => onDelete(task._id)} className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-slate-200 mt-1">Delete</button>
        </div>
      </div>
    </div>
  );
};

const TaskIcon  = (p) => <Icon name="task"        {...p}/>;
const CheckIcon = (p) => <Icon name="checkCircle" {...p}/>;
const ClockIcon = (p) => <Icon name="clock"       {...p}/>;
const WarnIcon  = (p) => <Icon name="exclamation" {...p}/>;

export default function TasksPage() {
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterProject,  setFilterProject]  = useState("");
  const [search,         setSearch]         = useState("");
  const [showCreate,     setShowCreate]     = useState(false);

  const apiFilters = useMemo(() => ({
    ...(filterStatus   ? { status:    filterStatus }   : {}),
    ...(filterPriority ? { priority:  filterPriority } : {}),
    ...(filterProject  ? { projectId: filterProject }  : {}),
  }), [filterStatus, filterPriority, filterProject]);

  const { tasks, loading, error, stats, createTask, deleteTask } = useTaskList(apiFilters);
  const { projects } = useManagerProjects();

  const filtered = useMemo(() =>
    tasks.filter(t => !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())),
    [tasks, search]
  );

  return (
    <DashboardLayout title="Task Management">
      <div className="flex items-center justify-between mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tasks</h2>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? "Loading…" : `${stats.total} tasks across ${projects.length} project${projects.length!==1?"s":""}`}</p>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={projects.length === 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon name="plus" className="w-4 h-4"/> Create Task
        </button>
      </div>

      {projects.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5 text-sm text-amber-700 font-medium">
          You are not a manager on any project yet. Ask your Admin to assign you as a project manager first.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Total"       value={loading?"…":stats.total}      sub="all projects"     icon={TaskIcon}  color="blue"   />
        <StatCard label="Completed"   value={loading?"…":stats.completed}  sub="this sprint"      icon={CheckIcon} color="green"  />
        <StatCard label="In Progress" value={loading?"…":stats.inProgress} sub="currently active" icon={ClockIcon} color="purple" />
        <StatCard label="Overdue"     value={loading?"…":stats.overdue}    sub="need attention"   icon={WarnIcon}  color={stats.overdue>0?"red":"slate"} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 page-enter-delay-2">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48 border border-slate-200 rounded-xl px-3.5 py-2">
            <Icon name="chart" className="w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or assignee…" className="flex-1 text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"/>
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="">All Status</option><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="">All Priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">{[...Array(4)].map((_,i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse h-24"/>)}</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">{error}</div>
      ) : (
        <div className="flex flex-col gap-3 page-enter-delay-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3"><Icon name="task" className="w-6 h-6 text-slate-300"/></div>
              <p className="text-sm font-semibold text-slate-600">No tasks found</p>
              <p className="text-xs text-slate-400 mt-1">{search || filterStatus || filterPriority || filterProject ? "Try changing your filters." : "Create the first task for your project."}</p>
            </div>
          ) : filtered.map(task => <TaskRow key={task._id} task={task} onDelete={deleteTask}/>)}
        </div>
      )}

      {showCreate && <CreateTaskModal projects={projects} onClose={() => setShowCreate(false)} onCreate={createTask}/>}
    </DashboardLayout>
  );
}