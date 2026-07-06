import WorkloadScoreRing from "../workload/WorkloadScoreRing";
import CapacityBar from "../workload/CapacityBar";
import BurnoutRiskMeter from "../workload/BurnoutRiskMeter";

// WorkloadPreviewCard — reuses the *actual* workload widgets (not
// recreations) with illustrative static data, so what's shown on the
// landing page is pixel-identical to what shows up in the product.
export default function WorkloadPreviewCard({ className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-bold text-slate-800">Rohan Mehta</p>
          <p className="text-xs text-slate-400">Backend Engineer · Project Phoenix</p>
        </div>
        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
          Gemini
        </span>
      </div>

      <div className="flex items-center gap-6 mb-5">
        <WorkloadScoreRing score={82} size={96} strokeWidth={9} label="Workload" />
        <div className="flex-1 space-y-4">
          <CapacityBar totalActiveHours={38} capacityHoursPerWeek={40} utilizationPct={95} />
          <BurnoutRiskMeter score={64} />
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
          AI summary
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          Rohan is running near capacity with two overlapping deadlines this week.
          Consider reassigning the lower-priority QA task to balance the load.
        </p>
      </div>
    </div>
  );
}
