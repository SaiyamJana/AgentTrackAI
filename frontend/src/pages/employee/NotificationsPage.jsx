import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import { useNotifications } from "../../hooks/useTasks";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const TYPE_CFG = {
  risk_detected:    { icon: "exclamation", color: "bg-red-50 text-red-600" },
  task_assigned:    { icon: "task",        color: "bg-primary-light text-primary" },
  task_completed:   { icon: "checkCircle", color: "bg-emerald-50 text-emerald-600" },
  project_assigned: { icon: "folder",      color: "bg-violet-50 text-violet-600" },
  manager_promoted: { icon: "shield",      color: "bg-amber-50 text-amber-600" },
  report_ready:     { icon: "report",      color: "bg-primary-light text-primary" },
  workload_alert:   { icon: "workload",    color: "bg-orange-50 text-orange-600" },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  const handleClick = async (n) => {
    if (!n.read) await markAsRead(n._id);
    if (n.type === "risk_detected") {
      navigate(user?.role === "admin" ? "/admin/risks" : "/manager/risks");
    }
  };

  return (
    <DashboardLayout title="Notifications">
  <div className="flex items-center justify-between mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Notifications</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors px-3 py-2 rounded-xl hover:bg-primary-light"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="bell" className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No notifications yet</p>
          <p className="text-sm text-slate-400 mt-2">
            You'll be notified here when something needs your attention.
          </p>
        </div>
      ) : (
  <div className="space-y-2 content-fade-in">
    {notifications.map((n) => {
            const cfg = TYPE_CFG[n.type] ?? { icon: "bell", color: "bg-slate-100 text-slate-500" };
            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`bg-white rounded-2xl border p-4 flex gap-4 cursor-pointer transition-all hover:shadow-md hover:shadow-slate-100 ${!n.read ? "border-primary/20 bg-primary-light/30" : "border-slate-100"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon name={cfg.icon} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-primary-light0 rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}