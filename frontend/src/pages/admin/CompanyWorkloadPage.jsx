import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import DashboardLayout       from "../../components/layout/DashboardLayout";
import StatCard              from "../../components/shared/StatCard";
import Icon                  from "../../components/shared/Icon";
import WorkloadHistoryChart  from "../../components/workload/WorkloadHistoryChart";
import AIRecommendationsPanel from "../../components/workload/AIRecommendationsPanel";
import { useCompanyWorkload, useTriggerRecalculation } from "../../hooks/useWorkload";
import { workloadAPI } from "../../utils/api";

const WI = (p) => <Icon name="workload"    {...p} />;
const UI = (p) => <Icon name="users"       {...p} />;
const BI = (p) => <Icon name="exclamation" {...p} />;
const CI = (p) => <Icon name="checkCircle" {...p} />;

const WORKLOAD_COLORS = {
  underutilized: "#94a3b8",
  optimal:       "#10b981",
  "at-risk":     "#f59e0b",
  overloaded:    "#ef4444",
  critical:      "#7c3aed",
};

const STATUS_BG = {
  underutilized: { bg: "#f1f5f9", text: "#64748b" },
  optimal:       { bg: "#d1fae5", text: "#065f46" },
  "at-risk":     { bg: "#fef3c7", text: "#92400e" },
  overloaded:    { bg: "#fee2e2", text: "#991b1b" },
  critical:      { bg: "#ede9fe", text: "#5b21b6" },
};

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-800 mb-1">{d.name}</p>
      <p className="text-slate-500">Workload: <span className="font-bold text-slate-700">{d.score}</span>/100</p>
      <p className="text-slate-500">Status: <span className="font-bold" style={{ color: WORKLOAD_COLORS[d.status] }}>{d.status}</span></p>
      {d.department && <p className="text-slate-400 mt-1">{d.department}</p>}
    </div>
  );
};

export default function CompanyWorkloadPage() {
  const { data, loading, error, refetch }  = useCompanyWorkload();
  const { trigger, loading: recalcLoading } = useTriggerRecalculation();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [empHistory, setEmpHistory]             = useState([]);
  const [histLoading, setHistLoading]           = useState(false);
  const [filterStatus, setFilterStatus]         = useState("all");
  const [sortBy, setSortBy]                     = useState("workloadScore");

  const teamMetrics = data?.teamMetrics   ?? {};
  const employees   = data?.employees     ?? [];

  // Chart data
  const filtered = employees.filter(e =>
    filterStatus === "all" || (e.snapshot?.status ?? "optimal") === filterStatus
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a.snapshot?.[sortBy] ?? 0;
    const vb = b.snapshot?.[sortBy] ?? 0;
    return vb - va;
  });

  const chartData = sorted.map(e => ({
    name:       e.employee?.name?.split(" ")[0] ?? "?",
    fullName:   e.employee?.name ?? "?",
    score:      e.snapshot?.workloadScore ?? 0,
    status:     e.snapshot?.status ?? "optimal",
    department: e.employee?.department,
  }));

  async function handleRecalculate() {
    try { await trigger(); refetch(); } catch (_) {}
  }

  async function handleViewEmployee(emp) {
    setSelectedEmployee(emp);
    setHistLoading(true);
    try {
      const res = await workloadAPI.history({ employeeId: emp.employee._id, days: 30 });
      setEmpHistory(res.data?.history ?? []);
    } catch (_) {
      setEmpHistory([]);
    } finally {
      setHistLoading(false);
    }
  }

  return (
    <DashboardLayout title="Company Workload">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Company Workload</h2>
          <p className="text-sm text-slate-500 mt-1">
            Workload analysis across all employees in your organisation.
          </p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalcLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl
            hover:bg-primary-hover transition disabled:opacity-60 shadow-sm shadow-blue-200"
        >
          {recalcLoading ? (
            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Calculating…</>
          ) : (
            <><WI className="w-4 h-4" />Recalculate All</>
          )}
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12 text-sm text-red-500">Failed to load: {error}</div>
      )}

      {data && !loading && (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Avg Workload Score"
              value={teamMetrics.avgWorkloadScore ?? 0}
              sub="company average"
              icon={WI}
              color="blue"
            />
            <StatCard
              label="Total Employees"
              value={teamMetrics.teamSize ?? 0}
              sub="with workload data"
              icon={UI}
              color="slate"
            />
            <StatCard
              label="Overloaded"
              value={teamMetrics.overloadedCount ?? 0}
              sub="need attention"
              icon={BI}
              color={teamMetrics.overloadedCount > 0 ? "red" : "green"}
            />
            <StatCard
              label="Burnout Risk"
              value={teamMetrics.burnoutRiskCount ?? 0}
              sub="at warning or above"
              icon={BI}
              color={teamMetrics.burnoutRiskCount > 0 ? "amber" : "green"}
            />
          </div>

          {/* ── Chart + filters ─────────────────────────────────────────── */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-slate-700">
                Employee Workload Scores
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="all">All statuses</option>
                  <option value="critical">Critical</option>
                  <option value="overloaded">Overloaded</option>
                  <option value="at-risk">At Risk</option>
                  <option value="optimal">Optimal</option>
                  <option value="underutilized">Underutilized</option>
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="workloadScore">Sort: Workload</option>
                  <option value="burnoutRiskScore">Sort: Burnout Risk</option>
                  <option value="utilizationPct">Sort: Utilization</option>
                </select>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">
                No employees match this filter.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: Math.max(400, chartData.length * 52) }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {chartData.map((d, i) => (
                          <Cell key={i} fill={WORKLOAD_COLORS[d.status] ?? "#2563eb"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(WORKLOAD_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-slate-500 capitalize">{status.replace("-", " ")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Employee list ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: list */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                All Employees ({sorted.length})
              </h3>
              <div className="space-y-2 max-h-120 overflow-y-auto pr-1">
                {sorted.map(({ employee, snapshot }) => {
                  const status = snapshot?.status ?? "optimal";
                  const sc = STATUS_BG[status] ?? STATUS_BG.optimal;
                  const isSelected = selectedEmployee?.employee?._id === employee._id;

                  return (
                    <button
                      key={employee._id}
                      onClick={() => handleViewEmployee({ employee, snapshot })}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition
                        ${isSelected ? "bg-primary-light border border-blue-200" : "hover:bg-slate-50 border border-transparent"}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {initials(employee.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{employee.name}</p>
                        <p className="text-xs text-slate-400 truncate">{employee.department ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {status.replace("-"," ")}
                        </span>
                        <span className="text-sm font-bold text-slate-700">
                          {snapshot?.workloadScore ?? 0}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: detail panel */}
            <div className="space-y-4">
              {selectedEmployee ? (
                <>
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary-light text-primary font-bold text-sm flex items-center justify-center">
                        {initials(selectedEmployee.employee?.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{selectedEmployee.employee?.name}</p>
                        <p className="text-xs text-slate-400">{selectedEmployee.employee?.department ?? "—"}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {[
                        ["Workload Score", `${selectedEmployee.snapshot?.workloadScore ?? 0}/100`],
                        ["Burnout Risk", `${selectedEmployee.snapshot?.burnoutRiskScore ?? 0}/100`],
                        ["Utilization", `${selectedEmployee.snapshot?.utilizationPct ?? 0}%`],
                        ["Active Tasks", selectedEmployee.snapshot?.activeTasksCount ?? 0],
                        ["Delayed Tasks", selectedEmployee.snapshot?.delayedTasksCount ?? 0],
                        ["Capacity", `${selectedEmployee.snapshot?.capacityHoursPerWeek ?? 40}h/week`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-semibold text-slate-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* History chart */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    {histLoading ? (
                      <div className="h-40 bg-slate-50 animate-pulse rounded-xl" />
                    ) : (
                      <WorkloadHistoryChart
                        history={empHistory}
                        title="30-day Trend"
                      />
                    )}
                  </div>

                  {/* AI summary */}
                  {selectedEmployee.snapshot?.aiSummary && (
                    <AIRecommendationsPanel
                      aiSummary={selectedEmployee.snapshot.aiSummary}
                      aiRecommendations={selectedEmployee.snapshot.aiRecommendations ?? []}
                      usedAI={selectedEmployee.snapshot.usedAI}
                      calculatedAt={selectedEmployee.snapshot.calculatedAt}
                    />
                  )}
                </>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-8 text-center text-sm text-slate-400">
                  Select an employee to view their detailed workload.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
