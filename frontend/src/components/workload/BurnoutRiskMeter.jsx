/*
 * BurnoutRiskMeter
 * Horizontal segmented bar showing burnout risk score (0–100).
 * Three zones: Safe (0–30), Warning (30–55), Critical (55–100).
 */

const ZONES = [
  { label: "Safe",    max: 30,  color: "#10b981" }, // emerald
  { label: "Warning", max: 55,  color: "#f59e0b" }, // amber
  { label: "Risk",    max: 75,  color: "#ef4444" }, // red
  { label: "Critical",max: 100, color: "#7c3aed" }, // violet
];

function getZone(score) {
  return ZONES.find(z => score <= z.max) ?? ZONES[ZONES.length - 1];
}

export default function BurnoutRiskMeter({ score = 0 }) {
  const zone = getZone(score);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-slate-500">Burnout Risk</span>
        <span className="text-xs font-bold" style={{ color: zone.color }}>
          {score}/100 — {zone.label}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
        {/* Filled bar */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: zone.color }}
        />
      </div>

      {/* Zone tick labels */}
      <div className="flex justify-between mt-1">
        {ZONES.map(z => (
          <span key={z.label} className="text-[10px] text-slate-400">{z.max}</span>
        ))}
      </div>
    </div>
  );
}
