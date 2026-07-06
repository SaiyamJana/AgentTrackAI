import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";

// AnalyticsPreviewCard — illustrative trend chart built with recharts,
// the same charting library already used on the real AnalyticsPage,
// so no new dependency is introduced for the marketing page.
const DATA = [
  { day: "Mon", completed: 4 },
  { day: "Tue", completed: 7 },
  { day: "Wed", completed: 6 },
  { day: "Thu", completed: 9 },
  { day: "Fri", completed: 8 },
  { day: "Sat", completed: 5 },
  { day: "Sun", completed: 10 },
];

export default function AnalyticsPreviewCard({ className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-bold text-slate-800">Task completion</p>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
          Last 7 days
        </span>
      </div>
      <p className="text-[11px] text-slate-400 mb-4">
        On-time completion rate is up across the company this week.
      </p>

      <div className="h-40 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="landingAnalyticsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#landingAnalyticsFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-100">
        {[
          { label: "Completion rate", value: "92%" },
          { label: "Avg. cycle time", value: "1.8d" },
          { label: "Overdue", value: "3" },
        ].map((k) => (
          <div key={k.label}>
            <div className="text-sm font-bold text-slate-800">{k.value}</div>
            <div className="text-[9.5px] text-slate-400 mt-0.5 leading-tight">
              {k.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
