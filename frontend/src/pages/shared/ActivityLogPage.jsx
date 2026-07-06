import { useState , useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import { useAuth } from "../../context/AuthContext";
import { useActivityLogs } from "../../hooks/useTasks";
import { useManagerProjects, useAllProjects } from "../../hooks/useTasks";

/* ── helpers ───────────────────────────────────────────────────────────────── */
const ACTION_CFG = {
  project_created:        { label: "Project Created",       color: "bg-emerald-50 text-emerald-700",  icon: "folder"     },
  project_updated:        { label: "Project Updated",       color: "bg-primary-light text-primary",        icon: "folder"     },
  project_status_changed: { label: "Status Changed",        color: "bg-amber-50 text-amber-700",      icon: "chart"      },
  project_completed:      { label: "Project Completed",     color: "bg-emerald-50 text-emerald-700",  icon: "checkCircle"},
  manager_assigned:       { label: "Manager Assigned",      color: "bg-violet-50 text-violet-700",    icon: "users"      },
  employee_assigned:      { label: "Employee Assigned",     color: "bg-primary-light text-primary",        icon: "users"      },
  employee_removed:       { label: "Employee Removed",      color: "bg-red-50 text-red-700",          icon: "users"      },
  task_created:           { label: "Task Created",          color: "bg-primary-light text-primary",        icon: "task"       },
  task_updated:           { label: "Task Updated",          color: "bg-amber-50 text-amber-700",      icon: "task"       },
  task_deleted:           { label: "Task Deleted",          color: "bg-red-50 text-red-700",          icon: "task"       },
  task_member_added:      { label: "Member Added",          color: "bg-primary-light text-primary",        icon: "users"      },
  task_member_removed:    { label: "Member Removed",        color: "bg-red-50 text-red-700",          icon: "users"      },
  task_completed:         { label: "Task Completed",        color: "bg-emerald-50 text-emerald-700",  icon: "checkCircle"},
  task_progress_updated: { label: "Progress Updated", color: "bg-primary-light text-primary", icon: "chart" },
  user_login:              { label: "User Login",            color: "bg-slate-50 text-slate-600",      icon: "users"      },
employee_deactivated:    { label: "Employee Deactivated",  color: "bg-red-50 text-red-700",          icon: "users"      },
employee_reactivated:    { label: "Employee Reactivated",  color: "bg-emerald-50 text-emerald-700",  icon: "users"      },
};

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

/* ── Log Row ───────────────────────────────────────────────────────────────── */
const LogRow = ({ log }) => {
  const cfg = ACTION_CFG[log.action] ?? { label: log.action, color: "bg-slate-50 text-slate-600", icon: "chart" };
  const performedBy = log.userId?.name ?? "System";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-start gap-3 hover:border-primary/20 transition-colors">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
        <Icon name={cfg.icon} className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${cfg.color}`}>{cfg.label}</span>
          <span className="text-[10px] text-slate-400">{fmtDateTime(log.createdAt)}</span>
        </div>
        <p className="text-sm text-slate-700 mt-1">{log.details}</p>
        <p className="text-xs text-slate-400 mt-0.5">by {performedBy}</p>
      </div>
    </div>
  );
};

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function ActivityLogPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { projects: managerProjects, loading: mpLoading } = useManagerProjects();
  const { projects: allProjects,     loading: apLoading  } = useAllProjects();

  const projects = isAdmin ? allProjects : managerProjects;
  const projLoading = isAdmin ? apLoading : mpLoading;

  const [projectId, setProjectId] = useState("");
  useEffect(() => {
    if (!isAdmin && projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id);
    }
  }, [projects, projectId, isAdmin]);
  const [filterAction, setFilterAction] = useState("");

  const { logs, loading, error } = useActivityLogs(projectId, !isAdmin);

  // Filter by action type client-side
  const filtered = filterAction
    ? logs.filter(l => l.action === filterAction)
    : logs;

  return (
    <DashboardLayout title="Activity Log">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Activity Log</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isAdmin
              ? "Full history of actions across all projects."
              : "History of actions for your managed projects."}
          </p>
        </div>

        {/* Project selector */}
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-400 min-w-48"
        >
          {isAdmin && <option value="">All Projects</option>}
          {projLoading ? (
            <option>Loading projects…</option>
          ) : projects.length === 0 ? (
            <option>No projects</option>
          ) : (
            projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)
          )}
        </select>
      </div>

      {/* Action filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["", "project_created", "project_status_changed", "project_completed",
          "manager_assigned", "task_created", "task_updated", "task_deleted",
          "task_completed", "task_member_added", "task_member_removed"].map(a => (
          <button key={a} onClick={() => setFilterAction(a)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterAction === a
                ? "bg-primary text-white border-primary"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}>
            {a === "" ? "All" : (ACTION_CFG[a]?.label ?? a)}
          </button>
        ))}
      </div>

      {/* Log list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">{error}</div>
      ) : !isAdmin && !projectId ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="folder" className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">Select a project</p>
          <p className="text-sm text-slate-400 mt-2">Choose a project to view its activity history.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="clock" className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No activity yet</p>
          <p className="text-sm text-slate-400 mt-2">Actions on this project will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => <LogRow key={log._id} log={log} />)}
        </div>
      )}
    </DashboardLayout>
  );
}