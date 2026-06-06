import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../shared/Avatar";
import Icon from "../shared/Icon";

const Topbar = ({ title, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Sample notifications
  const notifications = [
    { id: 1, text: "Task 'API Integration' is overdue", time: "2m ago", type: "risk" },
    { id: 2, text: "New risk alert on Project Alpha", time: "15m ago", type: "risk" },
    { id: 3, text: "Weekly report is ready", time: "1h ago", type: "report" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/80 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Notifications</span>
                <span className="badge badge-blue">{notifications.length} new</span>
              </div>
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100">
                <button className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                  View all notifications →
                </button>
              </div>
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
