import { useState } from "react";
import WorkloadScoreRing from "./WorkloadScoreRing";
import CapacityBar from "./CapacityBar";

const STATUS_COLORS = {
  underutilized: { bg: "#f1f5f9", text: "#64748b" },
  optimal:       { bg: "#d1fae5", text: "#065f46" },
  "at-risk":     { bg: "#fef3c7", text: "#92400e" },
  overloaded:    { bg: "#fee2e2", text: "#991b1b" },
  critical:      { bg: "#ede9fe", text: "#5b21b6" },
};

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const SORT_OPTIONS = [
  { value: "workloadScore", label: "Workload Score" },
  { value: "burnoutRiskScore", label: "Burnout Risk" },
  { value: "utilizationPct", label: "Utilization %" },
  { value: "name", label: "Name" },
];

export default function TeamWorkloadTable({ members = [], onViewEmployee }) {
  const [sortBy, setSortBy]     = useState("workloadScore");
  const [sortDir, setSortDir]   = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  }

  const filtered = members.filter(m =>
    filterStatus === "all" || (m.snapshot?.status ?? "optimal") === filterStatus
  );

  const sorted = [...filtered].sort((a, b) => {
    const sa = a.snapshot;
    const sb = b.snapshot;
    let valA, valB;

    if (sortBy === "name") {
      valA = a.employee?.name ?? "";
      valB = b.employee?.name ?? "";
      return sortDir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    valA = sa?.[sortBy] ?? 0;
    valB = sb?.[sortBy] ?? 0;
    return sortDir === "asc" ? valA - valB : valB - valA;
  });

  if (!members.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-400 bg-slate-50 rounded-xl">
        No team members found.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            className="text-slate-400 hover:text-blue-600 transition-colors"
            title="Toggle sort direction"
          >
            {sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Filter:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All</option>
            <option value="underutilized">Underutilized</option>
            <option value="optimal">Optimal</option>
            <option value="at-risk">At Risk</option>
            <option value="overloaded">Overloaded</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400">{sorted.length} member{sorted.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="space-y-3">
        {sorted.map(({ employee, snapshot, projectRole }) => {
          const snap   = snapshot;
          const status = snap?.status ?? "optimal";
          const sc     = STATUS_COLORS[status] ?? STATUS_COLORS.optimal;

          return (
            <div
              key={employee._id}
              className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {initials(employee.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-800 text-sm truncate">{employee.name}</p>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.text }}
                    >
                      {status.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {employee.department ?? "—"}
                    {projectRole ? ` · ${projectRole}` : ""}
                  </p>

                  {snap ? (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CapacityBar
                        totalActiveHours={snap.totalActiveHours}
                        capacityHoursPerWeek={snap.capacityHoursPerWeek}
                        utilizationPct={snap.utilizationPct}
                      />
                      <div className="text-xs text-slate-500 space-y-1">
                        <p>Active tasks: <span className="font-semibold text-slate-700">{snap.activeTasksCount}</span></p>
                        <p>Delayed: <span className={`font-semibold ${snap.delayedTasksCount > 0 ? "text-red-600" : "text-slate-700"}`}>{snap.delayedTasksCount}</span></p>
                        <p>Burnout risk: <span className="font-semibold text-slate-700">{snap.burnoutRiskScore}/100</span></p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-2 italic">No snapshot yet — trigger recalculation.</p>
                  )}
                </div>

                {/* Score ring */}
                {snap && (
                  <div className="shrink-0">
                    <WorkloadScoreRing score={snap.workloadScore} size={72} strokeWidth={7} label="" />
                  </div>
                )}
              </div>

              {/* AI summary snippet */}
              {snap?.aiSummary && (
                <p className="mt-3 text-xs text-slate-500 italic border-t border-slate-50 pt-2 line-clamp-2">
                  {snap.aiSummary}
                </p>
              )}

              {/* View Detail button */}
              {onViewEmployee && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => onViewEmployee(employee._id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View Detail →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
