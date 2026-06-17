import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useAuth } from "../../context/AuthContext";
import { useAnalytics, useManagerProjects, useProjectAnalytics } from "../../hooks/useTasks";

/* ── shared config ───────────────────────────────────────────────── */
const RANGE_OPTIONS = [
  { value: "1d",  label: "Today" },
  { value: "7d",  label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

const STATUS_COLORS  = { pending: "#cbd5e1", "in-progress": "#3b82f6", completed: "#10b981" };
const STATUS_LABELS  = { pending: "Pending", "in-progress": "In Progress", completed: "Completed" };
const PRIORITY_COLORS = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };

const fmtAxisDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const fmtFullDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* ── Range Picker ─────────────────────────────────────────────────── */
const RangePicker = ({ range, setRange, custom, setCustom }) => (
  <div className="flex flex-wrap items-center gap-2">
    {RANGE_OPTIONS.map(opt => (
      <button
        key={opt.value}
        onClick={() => setRange(opt.value)}
        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
          range === opt.value
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
        }`}
      >
        {opt.label}
      </button>
    ))}
    {range === "custom" && (
      <div className="flex items-center gap-2 ml-1">
        <input type="date" value={custom.from} max={custom.to || undefined}
          onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
        <span className="text-xs text-slate-400">to</span>
        <input type="date" value={custom.to} min={custom.from || undefined} max={new Date().toISOString().slice(0,10)}
          onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
      </div>
    )}
  </div>
);

/* ── Section header ───────────────────────────────────────────────── */
const SectionHeader = ({ title, sub }) => (
  <div className="mb-4">
    <h3 className="text-sm font-bold text-slate-700">{title}</h3>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

/* ── Custom tooltip for area chart ───────────────────────────────── */
const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-bold text-slate-700 mb-1.5">{fmtFullDate(label)}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.dataKey}:</span>
          <span className="font-bold text-slate-700">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Empty state ──────────────────────────────────────────────────── */
const EmptyState = ({ icon, title, message }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
      <Icon name={icon} className="w-6 h-6 text-slate-300" />
    </div>
    <p className="text-sm font-semibold text-slate-500">{title}</p>
    <p className="text-xs text-slate-400 mt-1">{message}</p>
  </div>
);

/* ── Productivity Trend (Area Chart) ─────────────────────────────── */
const ProductivityTrend = ({ trend }) => {
  const hasData = trend?.some(d => d.completed > 0 || d.created > 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <SectionHeader title="Productivity Trend" sub="Tasks created vs. completed over time" />
      {!hasData ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-xs text-slate-400">No task activity recorded in this period.</p>
        </div>
      ): (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtAxisDate} tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<TrendTooltip />} />
            <Area type="monotone" dataKey="created"   name="Created"   stroke="#3b82f6" strokeWidth={2} fill="url(#createdGrad)" />
            <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#completedGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )
      }
      <div className="flex items-center gap-5 mt-2 pl-1">
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Created</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Completed</span>
      </div>
    </div>
  );
};

/* ── Status / Priority donut charts ──────────────────────────────── */
const BreakdownDonut = ({ title, data, colorMap, labelMap }) => {
  const entries = Object.entries(data || {}).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <SectionHeader title={title} />
      {total === 0 ? (
        <div className="h-44 flex items-center justify-center">
          <p className="text-xs text-slate-400">No tasks in this category yet.</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={160}>
            <PieChart>
              <Pie data={entries.map(([k, v]) => ({ name: k, value: v }))}
                dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} paddingAngle={2} strokeWidth={0}>
                {entries.map(([k]) => <Cell key={k} fill={colorMap[k] ?? "#94a3b8"} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2.5">
            {entries.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorMap[k] ?? "#94a3b8" }} />
                  {(labelMap?.[k] ?? k)}
                </span>
                <span className="text-xs font-bold text-slate-700">{v} <span className="text-slate-400 font-normal">({Math.round((v/total)*100)}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Project breakdown (for personal analytics) ──────────────────── */
const ProjectBreakdown = ({ projects }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5">
    <SectionHeader title="My Tasks by Project" sub="Distribution of assigned tasks across projects" />
    {projects.length === 0 ? (
      <div className="h-32 flex items-center justify-center">
        <p className="text-xs text-slate-400">No tasks assigned yet.</p>
      </div>
    ) : (
      <div className="space-y-4">
        {projects.map(p => (
          <div key={p.projectId}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 truncate flex items-center gap-1.5">
                <Icon name="folder" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {p.title}
              </span>
              <span className="text-xs text-slate-400 shrink-0">{p.total} task{p.total !== 1 ? "s" : ""}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              {p.completed  > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(p.completed/p.total)*100}%` }} />}
              {p.inProgress > 0 && <div className="h-full bg-blue-500"    style={{ width: `${(p.inProgress/p.total)*100}%` }} />}
              {p.pending    > 0 && <div className="h-full bg-slate-300"   style={{ width: `${(p.pending/p.total)*100}%` }} />}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

/* ── Team member comparison (for project analytics) ──────────────── */
const TeamComparison = ({ members }) => {
  if (members.length === 0) {
    return <EmptyState icon="users" title="No team members yet" message="Assign employees to this project to see team analytics." />;
  }
  const chartData = members.map(m => ({
    name: m.name.split(" ")[0],
    Completed: m.completed,
    "In Progress": m.inProgress,
    Pending: m.pending,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <SectionHeader title="Team Workload" sub="Task distribution per team member" />
      <ResponsiveContainer width="100%" height={Math.max(220, members.length * 50)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} width={70} />
          <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Bar dataKey="Completed"   stackId="a" fill="#10b981" radius={[0,0,0,0]} />
          <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" radius={[0,0,0,0]} />
          <Bar dataKey="Pending"     stackId="a" fill="#cbd5e1" radius={[0,4,4,0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Member detail table */}
      <div className="mt-5 -mx-1 overflow-x-auto">
        <table className="w-full text-xs min-w-120">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="font-semibold px-2 py-2">Member</th>
              <th className="font-semibold px-2 py-2 text-center">Total</th>
              <th className="font-semibold px-2 py-2 text-center">Completed</th>
              <th className="font-semibold px-2 py-2 text-center">In Progress</th>
              <th className="font-semibold px-2 py-2 text-center">Overdue</th>
              <th className="font-semibold px-2 py-2 text-center">Avg. Progress</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.employeeId} className="border-b border-slate-50 last:border-0">
                <td className="px-2 py-2.5 font-semibold text-slate-700">{m.name}</td>
                <td className="px-2 py-2.5 text-center text-slate-600">{m.total}</td>
                <td className="px-2 py-2.5 text-center text-emerald-600 font-semibold">{m.completed}</td>
                <td className="px-2 py-2.5 text-center text-blue-600 font-semibold">{m.inProgress}</td>
                <td className="px-2 py-2.5 text-center">
                  <span className={`font-semibold ${m.overdue > 0 ? "text-red-600" : "text-slate-400"}`}>{m.overdue}</span>
                </td>
                <td className="px-2 py-2.5 text-center text-slate-600">{m.avgCompletion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── KPI grid ─────────────────────────────────────────────────────── */
const KpiGrid = ({ summary, loading }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="Total Tasks"        value={loading ? "…" : summary.totalTasks}
      sub="across all projects" icon={(p)=><Icon name="task" {...p}/>} color="blue" />
    <StatCard label="Completed"          value={loading ? "…" : summary.completedTasks}
      sub={`${loading ? "—" : summary.completedInPeriod} this period`} icon={(p)=><Icon name="checkCircle" {...p}/>} color="green" />
    <StatCard label="On-Time Rate"       value={loading ? "…" : `${summary.onTimeCompletionRate}%`}
      sub="completed before deadline" icon={(p)=><Icon name="trend" {...p}/>} color="purple" />
    <StatCard label="Overdue"            value={loading ? "…" : summary.overdueTasks}
      sub="need attention" icon={(p)=><Icon name="exclamation" {...p}/>} color={!loading && summary.overdueTasks > 0 ? "red" : "slate"} />
  </div>
);

const SecondaryKpis = ({ summary, loading }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard label="Avg. Progress"      value={loading ? "…" : `${summary.avgCompletionPercentage}%`}
      sub="across active tasks" icon={(p)=><Icon name="chart" {...p}/>} color="blue" />
    <StatCard label="In Progress"        value={loading ? "…" : summary.inProgressTasks}
      sub="currently active" icon={(p)=><Icon name="clock" {...p}/>} color="amber" />
    <StatCard label="Avg. Cycle Time"    value={loading ? "…" : `${summary.avgCycleTimeHours}h`}
      sub="creation to completion" icon={(p)=><Icon name="calendar" {...p}/>} color="slate" />
    <StatCard label="Logged Hours"       value={loading ? "…" : summary.actualHours}
      sub={`vs ${loading ? "—" : summary.estimatedHours}h estimated`} icon={(p)=><Icon name="workload" {...p}/>} color="purple" />
  </div>
);

/* ── Page ─────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [view, setView] = useState("personal"); // "personal" | "team"
  const [teamProjectId, setTeamProjectId] = useState("");

  const params =
    range === "custom"
      ? (custom.from && custom.to ? { range: "custom", from: custom.from, to: custom.to } : { range: "30d" })
      : { range };

  const { data, loading, error } = useAnalytics(params);
  const { projects: managedProjects, loading: mpLoading } = useManagerProjects();

  if (!teamProjectId && !mpLoading && managedProjects.length > 0) {
    setTeamProjectId(managedProjects[0]._id);
  }

  const {
    data: teamData, loading: teamLoading, error: teamError,
  } = useProjectAnalytics(view === "team" ? teamProjectId : null, params);

  const isManager = !mpLoading && managedProjects.length > 0;
  const summary = data?.summary ?? {
    totalTasks: 0, completedTasks: 0, inProgressTasks: 0, pendingTasks: 0,
    overdueTasks: 0, avgCompletionPercentage: 0, completedInPeriod: 0,
    onTimeCompletionRate: 0, avgCycleTimeHours: 0, estimatedHours: 0, actualHours: 0,
  };

  return (
    <DashboardLayout title="Analytics">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {view === "personal" ? "My Analytics" : "Team Analytics"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {view === "personal"
              ? "Your task performance, productivity, and progress over time."
              : "Project-wide task distribution and team performance."}
          </p>
        </div>
        <RangePicker range={range} setRange={setRange} custom={custom} setCustom={setCustom} />
      </div>

      {/* View toggle (only if user manages at least one project) */}
      {isManager && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="inline-flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setView("personal")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === "personal" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
              My Analytics
            </button>
            <button onClick={() => setView("team")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === "team" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
              Team Analytics
            </button>
          </div>
          {view === "team" && (
            <select value={teamProjectId} onChange={e => setTeamProjectId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
              {managedProjects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          )}
        </div>
      )}

      {/* ── Personal view ─────────────────────────────────────────── */}
      {view === "personal" && (
        <>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>}

          <div className="space-y-5">
            <KpiGrid summary={summary} loading={loading} />
            <SecondaryKpis summary={summary} loading={loading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
                ) : (
                  <ProductivityTrend trend={data?.trend ?? []} />
                )}
              </div>
              <div>
                {loading ? (
                  <div className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
                ) : (
                  <BreakdownDonut title="Task Status" data={data?.statusBreakdown} colorMap={STATUS_COLORS} labelMap={STATUS_LABELS} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                {loading ? (
                  <div className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
                ) : (
                  <ProjectBreakdown projects={data?.projectBreakdown ?? []} />
                )}
              </div>
              <div>
                {loading ? (
                  <div className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
                ) : (
                  <BreakdownDonut title="Priority Mix" data={data?.priorityBreakdown} colorMap={PRIORITY_COLORS} />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Team view ─────────────────────────────────────────────── */}
      {view === "team" && (
        <>
          {teamError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{teamError}</div>}

          {!teamProjectId ? (
            <EmptyState icon="folder" title="No managed projects" message="You need to be a project manager to view team analytics." />
          ) : (
            <div className="space-y-5">
              {/* Project header card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon name="folder" className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{teamData?.project?.title ?? "—"}</p>
                    <p className="text-xs text-slate-400 capitalize">{teamData?.project?.status ?? ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-800">{teamLoading ? "…" : `${teamData?.project?.progressPercentage ?? 0}%`}</p>
                  <p className="text-xs text-slate-400">overall progress</p>
                </div>
              </div>

              <KpiGrid summary={teamData?.summary ?? summary} loading={teamLoading} />
              <SecondaryKpis summary={teamData?.summary ?? summary} loading={teamLoading} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2">
                  {teamLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
                  ) : (
                    <ProductivityTrend trend={teamData?.trend ?? []} />
                  )}
                </div>
                <div>
                  {teamLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-100 h-80 animate-pulse" />
                  ) : (
                    <BreakdownDonut title="Task Status" data={teamData?.statusBreakdown} colorMap={STATUS_COLORS} labelMap={STATUS_LABELS} />
                  )}
                </div>
              </div>

              {teamLoading ? (
                <div className="bg-white rounded-2xl border border-slate-100 h-64 animate-pulse" />
              ) : (
                <TeamComparison members={teamData?.memberBreakdown ?? []} />
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
