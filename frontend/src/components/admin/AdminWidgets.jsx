import Avatar from "../shared/Avatar";
import Badge from "../shared/Badge";
import Icon from "../shared/Icon";
import { useNavigate } from "react-router-dom";

// ── Recent Activity Feed ──────────────────────────────────────────────────────
const activityIcons = {
  PROJECT_CREATED: { icon: "folder",      color: "bg-blue-100 text-blue-600" },
  TASK_CREATED:    { icon: "task",         color: "bg-violet-100 text-violet-600" },
  TASK_UPDATED:    { icon: "clock",        color: "bg-amber-100 text-amber-600" },
  TASK_COMPLETED:  { icon: "checkCircle",  color: "bg-emerald-100 text-emerald-600" },
};

export const RecentActivity = ({ logs = [] }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-slate-700">Recent Activity</h2>
      <span className="text-xs text-slate-400">{logs.length} events</span>
    </div>

    {logs.length === 0 ? (
      <div className="text-center py-8 text-slate-400 text-sm">No recent activity</div>
    ) : (
      <div className="space-y-3">
        {logs.map((log, i) => {
          const cfg = activityIcons[log.action] || activityIcons.TASK_UPDATED;
          return (
            <div key={log._id || i} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${cfg.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon name={cfg.icon} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 leading-relaxed">{log.details}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                  <span className="text-[10px] text-slate-300">·</span>
                  <Badge status={log.action?.split("_")[1]?.toLowerCase() || "updated"} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

// ── Quick Actions Panel ───────────────────────────────────────────────────────
export const QuickActions = () => {
  const navigate = useNavigate();
  const actions = [
    { label: "Add Employee",    icon: "users",  color: "bg-blue-50 text-blue-700 hover:bg-blue-100",     to: "/admin/employees" },
    { label: "Create Project",  icon: "folder", color: "bg-violet-50 text-violet-700 hover:bg-violet-100", to: "/admin/projects" },
    { label: "View Analytics",  icon: "chart",  color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100", to: "/analytics" },
    { label: "System Settings", icon: "settings", color: "bg-slate-100 text-slate-600 hover:bg-slate-200", to: "/admin/settings" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h2 className="text-sm font-bold text-slate-700 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.to)}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl text-xs font-semibold transition-colors ${a.color}`}
          >
            <Icon name={a.icon} className="w-5 h-5" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Employee Table (Admin) ────────────────────────────────────────────────────
export const EmployeeTable = ({ employees = [] }) => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h2 className="text-sm font-bold text-slate-700">All Employees</h2>
      <span className="text-xs text-slate-400">{employees.length} total</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {["Employee", "Role", "Department", "Designation", "Status"].map((h) => (
              <th key={h} className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {employees.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-xs">No employees found</td></tr>
          ) : (
            employees.map((emp) => (
              <tr key={emp._id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={emp.name} size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{emp.name}</p>
                      <p className="text-[10px] text-slate-400">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3"><Badge status={emp.role} /></td>
                <td className="px-5 py-3 text-xs text-slate-600">{emp.department}</td>
                <td className="px-5 py-3 text-xs text-slate-600">{emp.designation}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${emp.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {emp.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ── System Health Card ────────────────────────────────────────────────────────
export const SystemHealth = () => {
  const metrics = [
    { label: "API Server",    status: "Operational", color: "bg-emerald-500" },
    { label: "AI Agents",     status: "Running",     color: "bg-emerald-500" },
    { label: "Database",      status: "Healthy",     color: "bg-emerald-500" },
    { label: "Report Queue",  status: "Active",      color: "bg-blue-500" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-700">System Health</h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          All systems go
        </span>
      </div>
      <div className="space-y-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <span className="text-xs text-slate-600">{m.label}</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${m.color}`} />
              <span className="text-xs font-medium text-slate-700">{m.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
