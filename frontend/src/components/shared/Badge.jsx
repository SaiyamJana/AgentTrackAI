// Badge — status & priority badges across all pages
const variants = {
  // Status
  active:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed:   "bg-blue-50 text-blue-700 border border-blue-200",
  "on-hold":   "bg-amber-50 text-amber-700 border border-amber-200",
  pending:     "bg-slate-100 text-slate-600 border border-slate-200",
  "in-progress":"bg-blue-50 text-blue-700 border border-blue-200",
  // Priority
  high:        "bg-red-50 text-red-700 border border-red-200",
  medium:      "bg-amber-50 text-amber-700 border border-amber-200",
  low:         "bg-slate-100 text-slate-600 border border-slate-200",
  // Risk
  overloaded:  "bg-red-50 text-red-700 border border-red-200",
  optimal:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  underutilized:"bg-slate-100 text-slate-600 border border-slate-200",
  // Role
  admin:       "bg-violet-50 text-violet-700 border border-violet-200",
  manager:     "bg-blue-50 text-blue-700 border border-blue-200",
  employee:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

const dots = {
  active: "bg-emerald-500",
  completed: "bg-blue-500",
  "on-hold": "bg-amber-500",
  pending: "bg-slate-400",
  "in-progress": "bg-blue-500",
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

const Badge = ({ status, showDot = false, className = "" }) => {
  const key = (status || "").toLowerCase().replace(" ", "-");
  const style = variants[key] || "bg-slate-100 text-slate-600 border border-slate-200";
  const dotColor = dots[key] || "bg-slate-400";
  const label = status?.charAt(0).toUpperCase() + status?.slice(1).replace("-", " ");

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {label}
    </span>
  );
};

export default Badge;
