/*
 * CapacityBar
 * Shows hours used vs total capacity as a progress bar.
 * Color shifts green → amber → red as utilization increases.
 */

function getBarColor(pct) {
  if (pct >= 95) return "#ef4444"; // red
  if (pct >= 80) return "#f59e0b"; // amber
  return "#10b981";                // emerald
}

export default function CapacityBar({
  totalActiveHours    = 0,
  capacityHoursPerWeek = 40,
  utilizationPct      = 0,
}) {
  const color   = getBarColor(utilizationPct);
  const capped  = Math.min(100, utilizationPct);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-slate-500">Capacity</span>
        <span className="text-xs font-bold text-slate-600">
          {totalActiveHours}h / {capacityHoursPerWeek}h/wk
        </span>
      </div>

      <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${capped}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400">0h</span>
        <span className="text-[10px] font-medium" style={{ color }}>
          {utilizationPct}% utilized
        </span>
        <span className="text-[10px] text-slate-400">{capacityHoursPerWeek}h</span>
      </div>
    </div>
  );
}
