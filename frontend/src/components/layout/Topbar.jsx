import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useTasks";
import Avatar from "../shared/Avatar";
import Icon from "../shared/Icon";

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const TYPE_ICON = {
  risk_detected:     "exclamation",
  task_assigned:     "task",
  task_completed:    "checkCircle",
  project_assigned:  "folder",
  manager_promoted:  "shield",
  report_ready:      "report",
  workload_alert:    "workload",
};

const Topbar = ({ title, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotifClick = async (n) => {
    if (!n.read) await markAsRead(n._id);
    // Navigate to relevant page based on type
    if (n.type === "risk_detected") {
      navigate(user?.role === "admin" ? "/admin/risks" : "/manager/risks");
    }
    setNotifOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Icon name="menu" className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-none">{title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setShowDropdown(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <Icon name="bell" className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/80 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Notifications</span>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{unreadCount} new</span>
                ) : (
                  <span className="text-[10px] text-slate-400">All caught up</span>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-slate-400">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotifClick(n)}
                      className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${!n.read ? "bg-blue-50/40" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                        <Icon name={TYPE_ICON[n.type] ?? "bell"} className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-100">
                  <button
                    onClick={() => markAllRead()}
                    className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowDropdown(!showDropdown); setNotifOpen(false); }}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Avatar name={user?.name || "User"} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-700 leading-none">{user?.name || "User"}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{user?.role}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/80 z-50 overflow-hidden py-1.5">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-700">{user?.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role} · {user?.department}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <Icon name="logout" className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;