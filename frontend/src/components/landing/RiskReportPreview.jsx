import Icon from "../shared/Icon";

// RiskReportPreview — mock of the Risk Alerts list and AI-generated
// report snippet, styled with the same badge/color semantics used on
// the real RisksPage and ReportsPage (risk levels, category icons).
const RISKS = [
  {
    level: "critical",
    icon: "folder",
    title: "Project Phoenix is trending 4 days behind schedule",
    style: "bg-red-50 text-red-700 border-red-200",
  },
  {
    level: "high",
    icon: "users",
    title: "Design team is overloaded this sprint",
    style: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    level: "medium",
    icon: "task",
    title: "3 tasks are overdue on Onboarding Revamp",
    style: "bg-amber-50 text-amber-700 border-amber-200",
  },
];

export default function RiskReportPreview({ className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-slate-800">Active risks</p>
        <span className="text-[10px] font-semibold text-slate-400">
          Auto-detected
        </span>
      </div>

      <div className="space-y-2.5 mb-5">
        {RISKS.map((r) => (
          <div
            key={r.title}
            className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${r.style}`}>
              <Icon name={r.icon} className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-600 leading-snug pt-0.5">{r.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Icon name="report" className="w-3.5 h-3.5 text-blue-600" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Weekly report · AI-generated
          </p>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Team velocity held steady at 87% this week. Two risks need attention
          before Friday's review — see above.
        </p>
      </div>
    </div>
  );
}
