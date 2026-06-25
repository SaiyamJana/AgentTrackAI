/*
 * WorkloadScoreRing
 * SVG circular gauge (0–100) with color zones matching the existing
 * AgentTrack AI badge color semantics.
 */

const WORKLOAD_COLORS = {
  underutilized: "#94a3b8", // slate-400
  optimal:       "#10b981", // emerald-500
  "at-risk":     "#f59e0b", // amber-500
  overloaded:    "#ef4444", // red-500
  critical:      "#7c3aed", // violet-600
};

const STATUS_LABELS = {
  underutilized: "Underutilized",
  optimal:       "Optimal",
  "at-risk":     "At Risk",
  overloaded:    "Overloaded",
  critical:      "Critical",
};

function getStatus(score) {
  if (score > 88) return "critical";
  if (score > 75) return "overloaded";
  if (score > 60) return "at-risk";
  if (score > 25) return "optimal";
  return "underutilized";
}

export default function WorkloadScoreRing({ score = 0, size = 120, strokeWidth = 10, label = "Workload" }) {
  const status   = getStatus(score);
  const color    = WORKLOAD_COLORS[status];
  const radius   = (size - strokeWidth) / 2;
  const cx       = size / 2;
  const cy       = size / 2;
  const circumference = 2 * Math.PI * radius;
  const filled   = (score / 100) * circumference;
  const offset   = circumference - filled;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
        {/* Center text — counter-rotate so it reads upright */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          fill="#0f172a"
          fontSize={size * 0.22}
          fontWeight="700"
          fontFamily="DM Sans, sans-serif"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
        >
          {score}
        </text>
        <text
          x={cx} y={cy + size * 0.14}
          textAnchor="middle"
          fill="#64748b"
          fontSize={size * 0.10}
          fontFamily="DM Sans, sans-serif"
          style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}
        >
          / 100
        </text>
      </svg>

      <span className="text-xs font-medium text-slate-500">{label}</span>

      {/* Status badge */}
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: color + "20",
          color,
        }}
      >
        {STATUS_LABELS[status]}
      </span>
    </div>
  );
}
