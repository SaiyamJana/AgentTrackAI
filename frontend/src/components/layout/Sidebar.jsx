import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Icon from "../shared/Icon";

const adminLinks = [
  { to: "/admin/dashboard",  label: "Dashboard",          icon: "home"     },
  { to: "/admin/employees",  label: "Employees",          icon: "users"    },
  { to: "/admin/projects",   label: "Projects",           icon: "folder"   },
  { to: "/admin/settings",   label: "Settings",           icon: "settings" },
];

// Employee links — everyone starts here.
// If the employee is also a project manager, the Manager Tools section appears too.
const employeeLinks = [
  { to: "/employee/dashboard",     label: "My Dashboard",  icon: "home"  },
  { to: "/employee/tasks",         label: "My Tasks",      icon: "task"  },
  { to: "/employee/projects",      label: "My Projects",   icon: "folder"},
  { to: "/employee/notifications", label: "Notifications", icon: "bell"  },
];

// These links appear for employees who manage at least one project
const managerLinks = [
  { to: "/manager/dashboard", label: "Manager View",    icon: "chart"    },
  { to: "/manager/tasks",     label: "Task Management", icon: "workload" },
  { to: "/manager/reports",   label: "Reports",         icon: "report"   },
  { to: "/manager/risks",     label: "Risk Alerts",     icon: "shield"   },
  { to: "/manager/workload",  label: "Team Workload",   icon: "workload" },
  { to: "/manager/chatbot",   label: "AI Chatbot",      icon: "chat"     },
];

const roleBadgeStyle = {
  admin:    "bg-violet-100 text-violet-700",
  employee: "bg-emerald-100 text-emerald-700",
};

const NavSection = ({ title, links, onClose }) => (
  <>
    {title && (
      <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
    )}
    {links.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
          ${isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
            : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon name={link.icon} className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />
            <span className="truncate">{link.label}</span>
          </>
        )}
      </NavLink>
    ))}
  </>
);

const Sidebar = ({ open, onClose, isManager = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const isAdmin = user?.role === "admin";

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-40 flex flex-col
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 shrink-0">
          <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow shadow-blue-200 shrink-0">
            <svg viewBox="0 0 36 36" fill="none" className="w-5 h-5">
              <circle cx="18" cy="10" r="4" fill="white" fillOpacity="0.9"/>
              <circle cx="10" cy="26" r="3" fill="white" fillOpacity="0.6"/>
              <circle cx="26" cy="26" r="3" fill="white" fillOpacity="0.6"/>
              <path d="M18 14 L10 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
              <path d="M18 14 L26 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round"/>
              <path d="M13 20 L23 20" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-black text-slate-800 tracking-tight">Agent<span className="text-blue-600">Track</span></span>
            <div className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">AI Platform</div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user?.name || "U").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{user?.name || "User"}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${roleBadgeStyle[user?.role] || "bg-slate-100 text-slate-600"}`}>
                {isAdmin ? "Admin" : isManager ? "Manager" : "Employee"}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {isAdmin ? (
            <NavSection links={adminLinks} onClose={onClose} />
          ) : (
            <>
              <NavSection links={employeeLinks} onClose={onClose} />
              {isManager && (
                <NavSection title="Manager Tools" links={managerLinks} onClose={onClose} />
              )}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-100 shrink-0">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
            <Icon name="logout" className="w-4.5 h-4.5 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;