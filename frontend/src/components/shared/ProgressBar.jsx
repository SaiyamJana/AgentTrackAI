// ProgressBar — used on project cards and task rows
const colorByValue = (v) => {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 50) return "bg-blue-500";
  if (v >= 25) return "bg-amber-500";
  return "bg-red-400";
};

const ProgressBar = ({ value = 0, showLabel = false, color, size = "md" }) => {
  const pct = Math.min(100, Math.max(0, value));
  const fill = color || colorByValue(pct);
  const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${h} rounded-full bg-slate-100 overflow-hidden`}>
        <div
          className={`${h} rounded-full ${fill} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 tabular-nums w-8 text-right">
          {pct}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
