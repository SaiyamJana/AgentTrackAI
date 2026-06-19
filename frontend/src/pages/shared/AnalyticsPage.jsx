import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard        from "../../components/shared/StatCard";
import Icon            from "../../components/shared/Icon";
import { useAnalytics, useManagerProjects, useProjectAnalytics } from "../../hooks/useTasks";

const RANGE_OPTIONS = [
  { value: "1d",      label: "Today"    },
  { value: "7d",      label: "7 Days"   },
  { value: "30d",     label: "30 Days"  },
  { value: "90d",     label: "90 Days"  },
  { value: "overall", label: "Overall"  },
  { value: "custom",  label: "Custom"   },
];

const STATUS_COLORS = {
  pending:       "#e2e8f0",
  "in-progress": "#3b82f6",
  completed:     "#10b981",
};
const STATUS_LABELS = {
  pending:       "Pending",
  "in-progress": "In Progress",
  completed:     "Completed",
};
const PRIORITY_COLORS = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };

const EMPTY_SUMMARY = {
  totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0,
  overdueTasks: 0, avgCompletionPercentage: 0, completedInPeriod: 0,
  onTimeCompletionRate: 0, avgCycleTimeHours: 0, estimatedHours: 0, actualHours: 0,
};

const fmtAxisDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function buildPeriodLabel(range, period) {
  if (!period?.start && range !== "overall") return "";
  if (range === "overall") return `Since you joined · up to ${fmtDate(period?.end)}`;
  if (range === "1d")      return `Today · ${fmtDate(period?.end)}`;
  return `${fmtDate(period?.start)} – ${fmtDate(period?.end)}`;
}

/* ─── RangePicker ────────────────────────────────────────────────── */
function RangePicker({ range, setRange, custom, setCustom }) {
  const todayISO = new Date().toISOString().slice(0, 10);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {RANGE_OPTIONS.map(opt => (
        <button key={opt.value} onClick={() => setRange(opt.value)}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
            range === opt.value
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600"
          }`}>
          {opt.label}
        </button>
      ))}
      {range === "custom" && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <input type="date" value={custom.from} max={custom.to || todayISO}
            onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" />
          <span className="text-xs text-slate-400">to</span>
          <input type="date" value={custom.to} min={custom.from || undefined} max={todayISO}
            onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white" />
        </div>
      )}
    </div>
  );
}

/* ─── PeriodBadge ────────────────────────────────────────────────── */
function PeriodBadge({ range, period }) {
  const label = buildPeriodLabel(range, period);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
      <Icon name="calendar" className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

const SectionHeader = ({ title, sub }) => (
  <div className="mb-4">
    <h3 className="text-sm font-bold text-slate-700">{title}</h3>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

const Skeleton = ({ h = "h-80" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 ${h} animate-pulse`} />
);

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-bold text-slate-700 mb-1.5">{fmtDate(label)}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name ?? p.dataKey}:</span>
          <span className="font-bold text-slate-700">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── ProductivityTrend ──────────────────────────────────────────── */
function ProductivityTrend({ trend }) {
  const hasData = trend?.some(d => d.completed > 0 || d.created > 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 h-full">
      <SectionHeader title="Productivity Trend" sub="Tasks created vs. completed day by day" />
      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-56 gap-2">
          <Icon name="trend" className="w-8 h-8 text-slate-200" />
          <p className="text-xs text-slate-400">No task activity in this period.</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtAxisDate}
                tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={22} />
              <YAxis allowDecimals={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={26} />
              <Tooltip content={<TrendTooltip />} />
              <Area type="monotone" dataKey="created"   name="Created"
                stroke="#3b82f6" strokeWidth={2} fill="url(#gCreated)"   dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="completed" name="Completed"
                stroke="#10b981" strokeWidth={2} fill="url(#gCompleted)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 pl-1">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />Created
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />Completed
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── BreakdownDonut ─────────────────────────────────────────────── */
function BreakdownDonut({ title, sub, data, colorMap, labelMap }) {
  const entries = Object.entries(data || {}).filter(([, v]) => v > 0);
  const total   = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 h-full">
      <SectionHeader title={title} sub={sub} />
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center h-44 gap-2">
          <Icon name="chart" className="w-7 h-7 text-slate-200" />
          <p className="text-xs text-slate-400">No data for this period.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={entries.map(([k, v]) => ({ name: k, value: v }))}
                  dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                  {entries.map(([k]) => <Cell key={k} fill={colorMap[k] ?? "#94a3b8"} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {entries.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorMap[k] ?? "#94a3b8" }} />
                    <span className="truncate">{labelMap?.[k] ?? k}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700 shrink-0">
                    {v}<span className="text-slate-400 font-normal ml-0.5">({Math.round((v / total) * 100)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
            {entries.map(([k, v]) => (
              <div key={k} className="h-full transition-all"
                style={{ width: `${(v / total) * 100}%`, background: colorMap[k] ?? "#94a3b8" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── ProjectBreakdown ───────────────────────────────────────────── */
function ProjectBreakdown({ projects }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <SectionHeader title="My Tasks by Project" sub="Tasks assigned to you, grouped by project for this period" />
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 gap-2">
          <Icon name="folder" className="w-7 h-7 text-slate-200" />
          <p className="text-xs text-slate-400">No tasks assigned in this period.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {projects.map(p => {
            const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
            return (
              <div key={p.projectId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 truncate">
                    <Icon name="folder" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {p.title}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0 ml-3">{p.total} task{p.total !== 1 ? "s" : ""}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                  {p.completed  > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(p.completed / p.total) * 100}%` }} />}
                  {p.inProgress > 0 && <div className="h-full bg-blue-500"    style={{ width: `${(p.inProgress / p.total) * 100}%` }} />}
                  {p.pending    > 0 && <div className="h-full bg-slate-300"   style={{ width: `${(p.pending / p.total) * 100}%` }} />}
                </div>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="text-[10px] text-emerald-600 font-medium">{p.completed} done</span>
                  <span className="text-[10px] text-blue-600 font-medium">{p.inProgress} active</span>
                  <span className="text-[10px] text-slate-400">{p.pending} pending</span>
                  <span className="ml-auto text-[10px] font-bold text-slate-600">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── TeamComparison ─────────────────────────────────────────────── */
function TeamComparison({ members }) {
  if (!members.length) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
      <Icon name="users" className="w-8 h-8 text-slate-200 mx-auto mb-2" />
      <p className="text-xs text-slate-400">No team members with tasks in this period.</p>
    </div>
  );
  const chartData = members.map(m => ({
    name:          m.name.split(" ")[0],
    Completed:     m.completed,
    "In Progress": m.inProgress,
    Pending:       m.pending,
  }));
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <SectionHeader title="Team Workload" sub="Task load per team member for this period" />
      <ResponsiveContainer width="100%" height={Math.max(180, members.length * 48)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" allowDecimals={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={72}
            tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} iconType="circle" />
          <Bar dataKey="Completed"   stackId="s" fill="#10b981" radius={[0,0,0,0]} />
          <Bar dataKey="In Progress" stackId="s" fill="#3b82f6" radius={[0,0,0,0]} />
          <Bar dataKey="Pending"     stackId="s" fill="#e2e8f0" radius={[0,4,4,0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-5 overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-130">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              {["Member","Total","Completed","In Progress","Overdue","Avg. Progress"].map(h => (
                <th key={h} className={`font-semibold px-2 py-2 ${h !== "Member" ? "text-center" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.employeeId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                <td className="px-2 py-2.5 font-semibold text-slate-700">{m.name}</td>
                <td className="px-2 py-2.5 text-center text-slate-600 font-medium">{m.total}</td>
                <td className="px-2 py-2.5 text-center text-emerald-600 font-bold">{m.completed}</td>
                <td className="px-2 py-2.5 text-center text-blue-600 font-bold">{m.inProgress}</td>
                <td className="px-2 py-2.5 text-center">
                  <span className={`font-bold ${m.overdue > 0 ? "text-red-500" : "text-slate-300"}`}>{m.overdue}</span>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.avgCompletion}%` }} />
                    </div>
                    <span className="text-slate-600 font-medium">{m.avgCompletion}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── KPI rows ───────────────────────────────────────────────────── */
function KpiRow({ summary: s, loading, rangeLabel }) {
  const d = (v) => loading ? "—" : v;
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Tasks in Period" value={d(s.totalTasks)}
        sub={`created during ${rangeLabel}`}
        icon={(p) => <Icon name="task" {...p} />} color="blue" />
      <StatCard label="Completed" value={d(s.completedTasks)}
        sub={`${d(s.onTimeCompletionRate)}% on time`}
        icon={(p) => <Icon name="checkCircle" {...p} />} color="green" />
      <StatCard label="Overdue" value={d(s.overdueTasks)}
        sub="past deadline, still open"
        icon={(p) => <Icon name="exclamation" {...p} />}
        color={!loading && s.overdueTasks > 0 ? "red" : "slate"} />
      <StatCard label="Avg. Progress" value={d(`${s.avgCompletionPercentage}%`)}
        sub="across tasks in period"
        icon={(p) => <Icon name="trend" {...p} />} color="purple" />
    </div>
  );
}
function SecondaryKpiRow({ summary: s, loading }) {
  const d = (v) => loading ? "—" : v;
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="In Progress" value={d(s.inProgressTasks)}
        sub="currently active"
        icon={(p) => <Icon name="clock" {...p} />} color="amber" />
      <StatCard label="Pending" value={d(s.pendingTasks)}
        sub="not yet started"
        icon={(p) => <Icon name="report" {...p} />} color="slate" />
      <StatCard label="Avg. Cycle Time" value={d(`${s.avgCycleTimeHours}h`)}
        sub="creation → completion"
        icon={(p) => <Icon name="calendar" {...p} />} color="blue" />
      <StatCard label="Hours Logged" value={d(`${s.actualHours}h`)}
        sub={`of ${d(s.estimatedHours)}h estimated`}
        icon={(p) => <Icon name="workload" {...p} />} color="purple" />
    </div>
  );
}

/* ─── AnalyticsView ──────────────────────────────────────────────── */
function AnalyticsView({ data, loading, error, rangeLabel, extra }) {
  const summary = loading ? EMPTY_SUMMARY : (data?.summary ?? EMPTY_SUMMARY);
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
      )}
      <div className="space-y-5">
        <KpiRow summary={summary} loading={loading} rangeLabel={rangeLabel} />
        <SecondaryKpiRow summary={summary} loading={loading} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {loading ? <Skeleton h="h-80" /> : <ProductivityTrend trend={data?.trend ?? []} />}
          </div>
          <div>
            {loading ? <Skeleton h="h-80" />
              : <BreakdownDonut title="Status Breakdown" sub="Tasks by current status for this period"
                  data={data?.statusBreakdown} colorMap={STATUS_COLORS} labelMap={STATUS_LABELS} />}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {loading ? <Skeleton h="h-64" /> : extra}
          </div>
          <div>
            {loading ? <Skeleton h="h-64" />
              : <BreakdownDonut title="Priority Mix" sub="Tasks by priority for this period"
                  data={data?.priorityBreakdown} colorMap={PRIORITY_COLORS} />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [range,         setRange]         = useState("30d");
  const [custom,        setCustom]        = useState({ from: "", to: "" });
  const [view,          setView]          = useState("personal");
  const [teamProjectId, setTeamProjectId] = useState("");

  const params = useMemo(() => {
    if (range === "custom") {
      if (custom.from && custom.to) return { range: "custom", from: custom.from, to: custom.to };
      return { range: "30d" };
    }
    return { range };
  }, [range, custom.from, custom.to]);

  const rangeLabel = RANGE_OPTIONS.find(o => o.value === range)?.label ?? range;

  const { data, loading, error }                          = useAnalytics(params);
  const { projects: managedProjects, loading: mpLoading } = useManagerProjects();
  const isManager = !mpLoading && managedProjects.length > 0;

  if (!teamProjectId && !mpLoading && managedProjects.length > 0) {
    setTeamProjectId(managedProjects[0]._id);
  }

  const { data: teamData, loading: teamLoading, error: teamError } =
    useProjectAnalytics(view === "team" ? teamProjectId : null, params);

  const activePeriod = view === "personal" ? data?.period : teamData?.period;

  return (
    <DashboardLayout title="Analytics">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {view === "personal" ? "My Analytics" : "Team Analytics"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {view === "personal"
              ? "Your task performance and productivity, filtered by period."
              : "Project-wide task distribution and team workload, filtered by period."}
          </p>
          <div className="mt-2">
            <PeriodBadge range={range} period={activePeriod} />
          </div>
        </div>
        <RangePicker range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
      </div>

      {/* ── View toggle ── */}
      {isManager && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-0.5">
            {["personal","team"].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  view === v ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}>
                {v === "personal" ? "My Analytics" : "Team Analytics"}
              </button>
            ))}
          </div>
          {view === "team" && (
            <select value={teamProjectId} onChange={e => setTeamProjectId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              {managedProjects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          )}
        </div>
      )}

      {/* ── Personal view ── */}
      {view === "personal" && (
        <AnalyticsView
          data={data} loading={loading} error={error} rangeLabel={rangeLabel}
          extra={<ProjectBreakdown projects={data?.projectBreakdown ?? []} />}
        />
      )}

      {/* ── Team view ── */}
      {view === "team" && (
        <>
          {!teamProjectId ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <Icon name="folder" className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No managed projects</p>
              <p className="text-xs text-slate-400 mt-1">You need to be a project manager to view team analytics.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon name="folder" className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{teamData?.project?.title ?? "—"}</p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">{teamData?.project?.status ?? "loading…"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-800">
                      {teamLoading ? "—" : `${teamData?.project?.progressPercentage ?? 0}%`}
                    </p>
                    <p className="text-xs text-slate-400">overall progress</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-800">
                      {teamLoading ? "—" : (teamData?.memberBreakdown?.length ?? 0)}
                    </p>
                    <p className="text-xs text-slate-400">team members</p>
                  </div>
                </div>
              </div>
              <AnalyticsView
                data={teamData} loading={teamLoading} error={teamError} rangeLabel={rangeLabel}
                extra={<TeamComparison members={teamData?.memberBreakdown ?? []} />}
              />
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
