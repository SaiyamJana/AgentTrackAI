import { useNavigate } from "react-router-dom";
import Badge from "../shared/Badge";
import ProgressBar from "../shared/ProgressBar";
import Avatar from "../shared/Avatar";
import Icon from "../shared/Icon";

// ── Project Health List ───────────────────────────────────────────────────────
export const ProjectHealthList = ({ projects = [] }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-700">Project Health</h2>
        <button
          onClick={() => navigate("/admin/projects")}
          className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
        >
          View all →
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">No projects assigned</div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate("/manager/tasks")}
              className="group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {p.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Due {new Date(p.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {" · "}{p.taskCount} tasks
                  </p>
                </div>
                <Badge status={p.status} showDot />
              </div>
              <ProgressBar value={p.progressPercentage} showLabel size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Risk Alert Banner / Widget ────────────────────────────────────────────────
export const RiskAlertWidget = ({ risks = [] }) => {
  const navigate = useNavigate();
  const active = risks.filter((r) => !r.resolved);

  const levelColor = {
    high:   "border-red-200 bg-red-50",
    medium: "border-amber-200 bg-amber-50",
    low:    "border-slate-200 bg-slate-50",
  };
  const levelText = {
    high: "text-red-700", medium: "text-amber-700", low: "text-slate-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700">Risk Alerts</h2>
          {active.length > 0 && (
            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {active.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => navigate("/manager/risks")}
          className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
        >
          View all →
        </button>
      </div>

      {active.length === 0 ? (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <Icon name="checkCircle" className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-xs text-emerald-700 font-medium">No active risks — all clear!</span>
        </div>
      ) : (
        <div className="space-y-2">
          {active.slice(0, 3).map((r) => (
            <div
              key={r._id}
              className={`border rounded-xl px-3.5 py-3 ${levelColor[r.riskLevel] || levelColor.low}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-xs font-semibold ${levelText[r.riskLevel] || levelText.low}`}>
                  {r.reason}
                </p>
                <Badge status={r.riskLevel} />
              </div>
              {r.recommendation && (
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{r.recommendation}</p>
              )}
            </div>
          ))}
          {active.length > 3 && (
            <button
              onClick={() => navigate("/manager/risks")}
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium pt-1"
            >
              +{active.length - 3} more risks →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── Team Overview Panel ───────────────────────────────────────────────────────
export const TeamOverview = ({ workloads = [] }) => {
  const statusColor = {
    overloaded:   "bg-red-100 text-red-700",
    optimal:      "bg-emerald-100 text-emerald-700",
    underutilized:"bg-slate-100 text-slate-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-700">Team Overview</h2>
        <button className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
          Workload →
        </button>
      </div>

      {workloads.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">No team data available</div>
      ) : (
        <div className="space-y-3">
          {workloads.map((w) => (
            <div key={w._id} className="flex items-center gap-3">
              <Avatar name={w.employeeName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700 truncate">{w.employeeName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor[w.status] || statusColor.optimal}`}>
                    {w.activeTasksCount} tasks
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(100, (w.totalAssignedHours / 40) * 100)}
                  size="sm"
                  color={w.status === "overloaded" ? "bg-red-400" : w.status === "underutilized" ? "bg-slate-300" : "bg-emerald-500"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Upcoming Deadlines Timeline ───────────────────────────────────────────────
export const DeadlineTimeline = ({ deadlines = [] }) => {
  const urgency = (date) => {
    const diff = (new Date(date) - Date.now()) / 86400000;
    if (diff < 0)  return { label: "Overdue",   cls: "text-red-600 bg-red-50 border-red-200" };
    if (diff < 2)  return { label: "Today/Tomorrow", cls: "text-amber-600 bg-amber-50 border-amber-200" };
    if (diff < 7)  return { label: `${Math.ceil(diff)}d left`, cls: "text-blue-600 bg-blue-50 border-blue-200" };
    return { label: `${Math.ceil(diff)}d left`, cls: "text-slate-500 bg-slate-50 border-slate-200" };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-700">Upcoming Deadlines</h2>
        <Icon name="calendar" className="w-4 h-4 text-slate-400" />
      </div>
      {deadlines.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">No upcoming deadlines</div>
      ) : (
        <div className="space-y-2.5">
          {deadlines.map((d, i) => {
            const u = urgency(d.date);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="text-center flex-shrink-0 w-10">
                  <div className="text-base font-black text-slate-700 leading-none">
                    {new Date(d.date).getDate()}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">
                    {new Date(d.date).toLocaleString("en-IN", { month: "short" })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{d.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{d.project}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${u.cls} flex-shrink-0`}>
                  {u.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Latest AI Report Summary Card ─────────────────────────────────────────────
export const AIReportCard = ({ report }) => {
  const navigate = useNavigate();
  if (!report) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white relative overflow-hidden">
      {/* bg decoration */}
      <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute bottom-[-30px] right-[40px] w-20 h-20 bg-white/5 rounded-full" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <Icon name="cpu" className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">AI Report</p>
            <p className="text-[10px] text-blue-200 capitalize">{report.reportType?.replace("-", " ")} summary</p>
          </div>
          <span className="ml-auto text-[10px] text-blue-200">
            {new Date(report.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>

        <p className="text-xs text-blue-100 leading-relaxed line-clamp-3 mb-3">
          {report.summary}
        </p>

        <button
          onClick={() => navigate("/manager/reports")}
          className="flex items-center gap-1.5 text-xs font-semibold text-white hover:text-blue-200 transition-colors"
        >
          Full report <Icon name="arrow" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
