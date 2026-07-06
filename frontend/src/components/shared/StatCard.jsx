// StatCard — KPI metric card used on all three dashboards
// Props: label, value, sub, icon, color, trend

const colorMap = {
  blue:    { bg: "bg-blue-50",    icon: "text-primary",    border: "border-blue-100" },
  green:   { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   border: "border-amber-100" },
  red:     { bg: "bg-red-50",     icon: "text-red-600",     border: "border-red-100" },
  purple:  { bg: "bg-violet-50",  icon: "text-violet-600",  border: "border-violet-100" },
  slate:   { bg: "bg-slate-50",   icon: "text-slate-600",   border: "border-slate-100" },
};

const StatCard = ({ label, value, sub, icon: Icon, color = "blue", trend, onClick }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border ${c.border} p-5 flex flex-col gap-4
        transition-all duration-200 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-0.5
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-bold px-2 py-1 rounded-lg ${
              trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800 leading-none">{value}</div>
        <div className="text-sm font-medium text-slate-500 mt-1">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
};

export default StatCard;
