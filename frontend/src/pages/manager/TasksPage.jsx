import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useTaskList, useManagerProjects, useProjectMembers, useTaskMembers } from "../../hooks/useTasks";
// ── Chat integration ──────────────────────────────────────────────────────────
import MemberListWithChat from "../../components/chat/MemberListWithChat";

const P_CFG = {
  high:   "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low:    "bg-emerald-50 text-emerald-700 border-emerald-200",
};
const S_CFG = {
  "pending":     { color:"bg-slate-100 text-slate-600",    label:"Pending"     },
  "in-progress": { color:"bg-blue-50 text-blue-700",       label:"In Progress" },
  "completed":   { color:"bg-emerald-50 text-emerald-700", label:"Completed"   },
};
const fmtDl = (date) => {
  if (!date) return { label:"No deadline", overdue:false };
  const diff = Math.round((new Date(date)-Date.now())/86400000);
  if (diff<0)   return { label:`${Math.abs(diff)}d overdue`, overdue:true };
  if (diff===0) return { label:"Due today", overdue:false };
  return { label:`${diff}d left`, overdue:false };
};

/* ── Create Task Modal ──────────────────────────────────────────────── */
const CreateTaskModal = ({ projects, onClose, onCreate }) => {
  const [form, setForm] = useState({ title:"", description:"", priority:"medium", subManagerId:"", projectId:"", deadline:"", estimatedHours:"" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const { members, loading:ml } = useProjectMembers(form.projectId);
  const h = (e) => setForm(p => ({...p,[e.target.name]:e.target.value}));

  const submit = async () => {
    if (!form.title||!form.subManagerId||!form.projectId||!form.deadline) { setErr("Title, project, sub-manager and deadline are required."); return; }
    setSubmitting(true); setErr("");
    try { await onCreate({...form, estimatedHours:Number(form.estimatedHours)||0}); onClose(); }
    catch(e){ setErr(e.message); } finally { setSubmitting(false); }
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
        <div className="p-5 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{err}</div>}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Task Title *</label>
            <input name="title" value={form.title} onChange={h} placeholder="What needs to be done?"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Description</label>
            <textarea name="description" value={form.description} onChange={h} rows={2} placeholder="Additional details…"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Project *</label>
              <select name="projectId" value={form.projectId} onChange={h}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="">Select project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Sub-Manager *</label>
              <select name="subManagerId" value={form.subManagerId} onChange={h}
                disabled={!form.projectId||ml}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50">
                <option value="">{form.projectId?(ml?"Loading…":members.length===0?"No members yet":"Select member"):"Select project first"}</option>
                {members.map(m => {
                  const emp = m.employeeId;
                  const id  = emp?._id ?? m.employeeId;
                  const nm  = emp?.name ?? "Unknown";
                  return <option key={id} value={id}>{nm}{m.projectRole!=="member"?` (${m.projectRole})`:""}</option>;
                })}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Priority</label>
              <select name="priority" value={form.priority} onChange={h}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Deadline *</label>
              <input type="date" name="deadline" value={form.deadline} onChange={h}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"/>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Est. Hours</label>
              <input type="number" name="estimatedHours" value={form.estimatedHours} onChange={h} placeholder="0"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"/>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {submitting?"Creating…":"Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Manage Members Modal ───────────────────────────────────────────── */
// Shows current team members + lets manager add/remove from the project's employee pool.
// The sub-manager is displayed separately (read-only) since they are assigned at creation.
const ManageMembersModal = ({ task, onClose }) => {
  const { members: taskMembers, loading, error, addMembers, removeMember } = useTaskMembers(task._id);
  console.log("Task members:", taskMembers);
  // All employees on this project — used to populate the "add" dropdown
  const { members: projectMembers, loading: projLoading } = useProjectMembers(task.projectId?._id ?? task.projectId);

  const [selectedId, setSelectedId] = useState("");
  const [adding,     setAdding]     = useState(false);
  const [removing,   setRemoving]   = useState(null); // employeeId being removed
  const [err,        setErr]        = useState("");

  const subManagerId = task.subManagerId?._id ?? task.subManagerId;

  // Employees on the project who are NOT the sub-manager and NOT already a task member
  const taskMemberIds = new Set(taskMembers.map(m => m._id ?? m));
  const eligible = projectMembers.filter(pm => {
    const empId = pm.employeeId?._id ?? pm.employeeId;
    return empId !== subManagerId && !taskMemberIds.has(empId);
  });

  const handleAdd = async () => {
    if (!selectedId) return;
    setAdding(true); setErr("");
    try {
      await addMembers([selectedId]);
      setSelectedId("");
    } catch (e) { setErr(e.message); }
    finally { setAdding(false); }
  };

  const handleRemove = async (empId) => {
    setRemoving(empId); setErr("");
    try { await removeMember(empId); }
    catch (e) { setErr(e.message); }
    finally { setRemoving(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <Icon name="users" className="w-4 h-4 text-violet-600"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Team Members</h2>
              <p className="text-xs text-slate-400 line-clamp-1">{task.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <Icon name="x" className="w-4 h-4 text-slate-500"/>
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{err}</div>}

          {/* Sub-manager (read-only) */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Sub-Manager</p>
            <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-2.5">
              <div className="w-7 h-7 rounded-full bg-violet-200 flex items-center justify-center text-[10px] font-bold text-violet-700 shrink-0">
                {(task.subManagerId?.name ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{task.subManagerId?.name ?? "—"}</p>
                <p className="text-[10px] text-slate-400 truncate">{task.subManagerId?.email ?? ""}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 shrink-0">Sub-Manager</span>
            </div>
          </div>

          {/* Add member row */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Add Team Member</p>
            <div className="flex gap-2">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                disabled={projLoading || eligible.length === 0}
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 disabled:opacity-50"
              >
                <option value="">
                  {projLoading ? "Loading…" : eligible.length === 0 ? "All project members added" : "Select employee…"}
                </option>
                {eligible.map(pm => {
                  const emp = pm.employeeId;
                  const id  = emp?._id ?? pm.employeeId;
                  const nm  = emp?.name ?? "Unknown";
                  return <option key={id} value={id}>{nm}</option>;
                })}
              </select>
              <button
                onClick={handleAdd}
                disabled={!selectedId || adding}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {adding ? "…" : "Add"}
              </button>
            </div>
          </div>

          {/* Current team members list */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Team Members <span className="font-normal text-slate-400">({loading ? "…" : taskMembers.length})</span>
            </p>
            {loading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_,i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse"/>)}
              </div>
            ) : taskMembers.length === 0 ? (
              <div className="bg-slate-50 rounded-xl px-4 py-5 text-center">
                <p className="text-xs text-slate-400">No team members yet. Add some from the dropdown above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
                {taskMembers.map(member => {
                  const empId = member._id ?? member;
                  const name  = member.name  ?? "Unknown";
                  const email = member.email ?? "";
                  const isRemoving = removing === empId;
                  return (
                    <div key={empId} className="flex items-center gap-3 border border-slate-100 rounded-xl px-3.5 py-2.5 bg-white">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                        {name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{email}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(empId)}
                        disabled={isRemoving}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 shrink-0"
                      >
                        {isRemoving ? "…" : "Remove"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Chat panel ─────────────────────────────────────────────── */}
          {/* Lets the manager message any task member directly, without */}
          {/* leaving this modal. Read-only context panel — no add/remove. */}
          <MemberListWithChat mode="task" contextId={task._id} />
        </div>

        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Task Row ─────────────────────────────────────────────────────── */
const TaskRow = ({ task, onDelete, onManageMembers }) => {
  const p  = P_CFG[task.priority]??P_CFG.medium;
  const s  = S_CFG[task.status]??S_CFG.pending;
  const dl = fmtDl(task.deadline);
  const memberCount = task.teamMembers?.length ?? 0;
  return (
    <div className={`bg-white rounded-2xl border p-4 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 transition-all ${dl.overdue?"border-red-200":"border-slate-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-slate-800 truncate">{task.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p}`}>{task.priority?.toUpperCase()}</span>
          </div>
          {task.description && <p className="text-xs text-slate-400 line-clamp-1 mb-2">{task.description}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${s.color}`}>{s.label}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Icon name="folder" className="w-3 h-3"/>{task.projectId?.title??"—"}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Icon name="users" className="w-3 h-3"/>
              {task.subManagerId?.name??"—"}
              {memberCount > 0 && <span className="ml-1 text-[10px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">+{memberCount}</span>}
            </span>
            <span className={`text-xs flex items-center gap-1 ${dl.overdue?"text-red-600 font-semibold":"text-slate-400"}`}>
              <Icon name="clock" className="w-3 h-3"/>{dl.label}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-600">{task.completionPercentage??0}%</span>
          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${task.status==="completed"?"bg-emerald-500":(task.completionPercentage??0)>50?"bg-blue-500":"bg-amber-500"}`}
              style={{width:`${task.completionPercentage??0}%`}}/>
          </div>
          <div className="flex gap-1 mt-1">
            <button onClick={() => onManageMembers(task)}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors">
              Members
            </button>
            <button onClick={() => onDelete(task._id)}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TI = (p) => <Icon name="task"        {...p}/>;
const CI = (p) => <Icon name="checkCircle" {...p}/>;
const LI = (p) => <Icon name="clock"       {...p}/>;
const WI = (p) => <Icon name="exclamation" {...p}/>;

/* ── Page ─────────────────────────────────────────────────────────── */
export default function TasksPage() {
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterProject,  setFilterProject]  = useState("");
  const [search,         setSearch]         = useState("");
  const [showCreate,     setShowCreate]     = useState(false);
  const [managingTask,   setManagingTask]   = useState(null); // task object for ManageMembersModal

  const { projects, loading:projLoading } = useManagerProjects();

  const apiFilters = useMemo(() => ({
    ...(filterProject  ? { projectId: filterProject }  : filterStatus || filterPriority ? { projectId: projects[0]?._id??""} : {}),
    ...(filterStatus   ? { status:    filterStatus }   : {}),
    ...(filterPriority ? { priority:  filterPriority } : {}),
  }), [filterProject, filterStatus, filterPriority, projects]);

  const { tasks, loading, error, stats, createTask, deleteTask } =
  useTaskList({
    ...(filterProject ? { projectId: filterProject } : {}),
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterPriority ? { priority: filterPriority } : {}),
  });

  const filtered = useMemo(() =>
    tasks.filter(t =>
      !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.subManagerId?.name?.toLowerCase().includes(search.toLowerCase())
    ), [tasks, search]);

  return (
    <DashboardLayout title="Task Management">
      <div className="flex items-center justify-between mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Task Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {projLoading ? "Loading…" : projects.length === 0
              ? "No projects assigned — ask your Admin to assign you as a project manager."
              : `${stats.total} tasks across ${projects.length} project${projects.length!==1?"s":""}`}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={projects.length===0}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <Icon name="plus" className="w-4 h-4"/>Create Task
        </button>
      </div>

      {projects.length === 0 && !projLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5 text-sm text-amber-700 font-medium flex items-center gap-3">
          <Icon name="exclamation" className="w-5 h-5 shrink-0"/>
          You are not a manager on any project yet. Ask your Admin to assign you as project manager first.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Total"       value={loading?"…":stats.total}       sub="this project"     icon={TI} color="blue"   />
        <StatCard label="Completed"   value={loading?"…":stats.completed}   sub="finished"         icon={CI} color="green"  />
        <StatCard label="In Progress" value={loading?"…":stats.inProgress}  sub="active"           icon={LI} color="purple" />
        <StatCard label="Overdue"     value={loading?"…":stats.overdue}     sub="need attention"   icon={WI} color={stats.overdue>0?"red":"slate"} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-5 page-enter-delay-2">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48 border border-slate-200 rounded-xl px-3.5 py-2">
            <Icon name="chart" className="w-4 h-4 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or sub-manager…"
              className="flex-1 text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"/>
          </div>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            className="border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-600 focus:outline-none bg-white">
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_,i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-24 animate-pulse"/>)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">{error}</div>
      ) : (
        <div className="flex flex-col gap-3 page-enter-delay-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="task" className="w-6 h-6 text-slate-300"/>
              </div>
              <p className="text-sm font-semibold text-slate-600">No tasks found</p>
              <p className="text-xs text-slate-400 mt-1">
                {search||filterStatus||filterPriority ? "Try adjusting your filters." : "Create the first task for your project."}
              </p>
            </div>
          ) : filtered.map(t => (
            <TaskRow key={t._id} task={t} onDelete={deleteTask} onManageMembers={setManagingTask}/>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal projects={projects} onClose={() => setShowCreate(false)} onCreate={createTask}/>
      )}

      {managingTask && (
        <ManageMembersModal task={managingTask} onClose={() => setManagingTask(null)}/>
      )}
    </DashboardLayout>
  );
}