import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function WorkloadHistoryChart({ history = [], title = "Workload Trend (14 days)" }) {
  if (!history.length) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-slate-400">
        No history data available yet.
      </div>
    );
  }

  const chartData = history.map(h => ({
    date:         formatDate(h.calculatedAt),
    "Workload":   h.workloadScore ?? 0,
    "Burnout Risk": h.burnoutRiskScore ?? 0,
    "Utilization": h.utilizationPct ?? 0,
  }));

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradWorkload" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradBurnout" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          />
          <Area
            type="monotone"
            dataKey="Workload"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#gradWorkload)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="Burnout Risk"
            stroke="#ef4444"
            strokeWidth={1.5}
            fill="url(#gradBurnout)"
            dot={false}
            strokeDasharray="4 2"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
