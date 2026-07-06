import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import { useRisks } from "../../hooks/useTasks";

const RISK_CFG = {
  critical: { badge: "bg-red-50 text-red-700 border-red-200",       dot: "bg-red-500" },
  high:     { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  medium:   { badge: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
  low:      { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const CATEGORY_LABEL = {
  overdue_task:    "Overdue Task",
  delayed_project: "Delayed Project",
  overloaded_team: "Overloaded Team",
};

const CATEGORY_ICON = {
  overdue_task:    "task",
  delayed_project: "folder",
  overloaded_team: "users",
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function RisksPage() {
  const [filterLevel, setFilterLevel] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const { risks, loading, error, resolveRisk } = useRisks({ resolved: showResolved });

  const filtered = filterLevel ? risks.filter(r => r.riskLevel === filterLevel) : risks;

  const counts = {
    critical: risks.filter(r => r.riskLevel === "critical").length,
    high:     risks.filter(r => r.riskLevel === "high").length,
    medium:   risks.filter(r => r.riskLevel === "medium").length,
    low:      risks.filter(r => r.riskLevel === "low").length,
  };

  const handleResolve = async (id) => {
    setResolvingId(id);
    try { await resolveRisk(id); }
    catch { /* silently ignore */ }
    finally { setResolvingId(null); }
  };

  return (
    <DashboardLayout title="Risk Alerts">
  <div className="flex items-center justify-between mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Active Risks</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${risks.length} ${showResolved ? "resolved" : "active"} risk${risks.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={() => setShowResolved(!showResolved)}
          className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${showResolved ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
        >
          {showResolved ? "Showing Resolved" : "Show Resolved"}
        </button>
      </div>

      {/* KPI strip */}
<div className="grid grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        {[
          { label: "Critical", val: counts.critical, color: "bg-red-50 border-red-200 text-red-700" },
          { label: "High",     val: counts.high,     color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "Medium",   val: counts.medium,   color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Low",      val: counts.low,      color: "bg-slate-50 border-slate-200 text-slate-600" },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl border px-5 py-4 ${k.color}`}>
            <p className="text-2xl font-black">{loading ? "…" : k.val}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["", "critical", "high", "medium", "low"].map(l => (
          <button key={l} onClick={() => setFilterLevel(l)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${filterLevel === l ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            {l === "" ? "All" : l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="checkCircle" className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-base font-bold text-slate-600">
            {showResolved ? "No resolved risks" : "No active risks"}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {showResolved ? "Resolved risks will appear here." : "Everything looks good — the system will notify you when something needs attention."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const cfg = RISK_CFG[r.riskLevel] ?? RISK_CFG.low;
            return (
              <div key={r._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:shadow-slate-100 transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.badge}`}>
                      <Icon name={CATEGORY_ICON[r.category] ?? "exclamation"} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800">{CATEGORY_LABEL[r.category] ?? r.category}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${cfg.badge}`}>{r.riskLevel}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.projectId?.title ?? "Unknown project"}
                        {r.taskId?.title && ` · ${r.taskId.title}`}
                      </p>
                    </div>
                  </div>
                  {!r.resolved && (
                    <button
                      onClick={() => handleResolve(r._id)}
                      disabled={resolvingId === r._id}
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {resolvingId === r._id ? "…" : "Mark Resolved"}
                    </button>
                  )}
                  {r.resolved && (
                    <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 text-slate-400 shrink-0 flex items-center gap-1.5">
                      <Icon name="checkCircle" className="w-3.5 h-3.5" />Resolved
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-2">{r.reason}</p>

                <div className="bg-primary-light/50 border border-primary/20 rounded-xl px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-primary mb-0.5">Recommendation</p>
                  <p className="text-xs text-primary leading-relaxed">{r.recommendation}</p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                  <span>Detected {fmt(r.createdAt)}</span>
                  {r.resolved && r.resolvedAt && <span>Resolved {fmt(r.resolvedAt)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}