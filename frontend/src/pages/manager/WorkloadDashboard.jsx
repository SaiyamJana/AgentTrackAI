import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout  from "../../components/layout/DashboardLayout";
import StatCard          from "../../components/shared/StatCard";
import Icon              from "../../components/shared/Icon";
import TeamWorkloadTable from "../../components/workload/TeamWorkloadTable";
import WorkloadHistoryChart from "../../components/workload/WorkloadHistoryChart";
import AIRecommendationsPanel from "../../components/workload/AIRecommendationsPanel";
import { useManagerProjects } from "../../hooks/useTasks";
import { useTeamWorkload, useTriggerRecalculation } from "../../hooks/useWorkload";

const FI  = (p) => <Icon name="folder"      {...p} />;
const WI  = (p) => <Icon name="workload"    {...p} />;
const BI  = (p) => <Icon name="exclamation" {...p} />;
const TI  = (p) => <Icon name="users"       {...p} />;
const CI  = (p) => <Icon name="checkCircle" {...p} />;

export default function WorkloadDashboard() {
  const navigate   = useNavigate();
  const { projects, loading: pLoading } = useManagerProjects();

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const projectId = selectedProjectId || projects[0]?._id || "";

  const { data, loading, error, refetch } = useTeamWorkload(projectId);
  const { trigger, loading: recalcLoading, result: recalcResult, error: recalcError } = useTriggerRecalculation();

  async function handleRecalculate() {
    try {
      await trigger();
      refetch();
    } catch (_) {}
  }

  const teamMetrics = data?.teamMetrics ?? {};
  const members     = data?.members     ?? [];
  const project     = data?.project;

  // Collect AI alerts from overloaded members
  const overloadedAlerts = members.filter(m =>
    ["overloaded", "critical"].includes(m.snapshot?.status)
  );

  return (
    <DashboardLayout title="Team Workload">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Team Workload</h2>
          <p className="text-sm text-slate-500 mt-1">
            {project ? `Project: ${project.title}` : "Select a project to view team workload"}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Project selector */}
          {!pLoading && projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            >
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          )}

          {/* Recalculate button */}
          <button
            onClick={handleRecalculate}
            disabled={recalcLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl
              hover:bg-blue-700 transition disabled:opacity-60 shadow-sm shadow-blue-200"
          >
            {recalcLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Calculating…
              </>
            ) : (
              <>
                <WI className="w-4 h-4" />
                Recalculate
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Recalc result banner ─────────────────────────────────────── */}
      {recalcResult && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 flex items-center justify-between">
          <span>
            ✓ Recalculation complete — {recalcResult.snapshotsCreated} snapshots created,{" "}
            {recalcResult.notificationsSent} notifications sent.
          </span>
        </div>
      )}

      {/* ── Overload alert banner ─────────────────────────────────────── */}
      {overloadedAlerts.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <BI className="w-4 h-4 text-red-600 fshrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <span className="font-semibold">{overloadedAlerts.length} team member{overloadedAlerts.length > 1 ? "s are" : " is"} overloaded: </span>
            {overloadedAlerts.map(m => m.employee?.name).join(", ")}. Consider redistributing tasks.
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-12 text-sm text-red-500">
          Failed to load workload data: {error}
        </div>
      )}

      {/* No project */}
      {!loading && !error && !projectId && (
        <div className="text-center py-16 text-sm text-slate-400">
          No projects available. Ask your admin to assign you as a manager.
        </div>
      )}

      {data && !loading && (
        <>
          {/* ── KPI Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Avg Workload Score"
              value={teamMetrics.avgWorkloadScore ?? 0}
              sub="team average (0–100)"
              icon={WI}
              color="blue"
            />
            <StatCard
              label="Overloaded"
              value={teamMetrics.overloadedCount ?? 0}
              sub={`of ${teamMetrics.teamSize ?? 0} members`}
              icon={BI}
              color={teamMetrics.overloadedCount > 0 ? "red" : "green"}
            />
            <StatCard
              label="Burnout Risk"
              value={teamMetrics.burnoutRiskCount ?? 0}
              sub="members at warning+"
              icon={BI}
              color={teamMetrics.burnoutRiskCount > 0 ? "amber" : "green"}
            />
            <StatCard
              label="Team Balance"
              value={`${teamMetrics.teamBalanceScore ?? 0}`}
              sub="balance score (100 = perfect)"
              icon={TI}
              color="purple"
            />
          </div>

          {/* ── Main layout: table + AI panel ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Team table — takes 2 cols */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Team Members ({members.length})
                </h3>
                <TeamWorkloadTable
                  members={members}
                  onViewEmployee={(employeeId) => navigate(`/manager/workload/employee/${employeeId}`)}
                />
              </div>
            </div>

            {/* AI panel */}
            <div className="space-y-4">
              {/* Summary from first overloaded member, or first member with AI */}
              {(() => {
                const withAI = members.find(m => m.snapshot?.aiSummary);
                const snap   = withAI?.snapshot;
                return (
                  <AIRecommendationsPanel
                    aiSummary={
                      overloadedAlerts.length > 0
                        ? `${overloadedAlerts.length} member(s) are currently overloaded. ${overloadedAlerts[0]?.snapshot?.aiSummary ?? ""}`
                        : snap?.aiSummary
                    }
                    aiRecommendations={
                      overloadedAlerts.length > 0
                        ? overloadedAlerts[0]?.snapshot?.aiRecommendations ?? []
                        : snap?.aiRecommendations ?? []
                    }
                    usedAI={snap?.usedAI ?? false}
                    calculatedAt={snap?.calculatedAt}
                    isLoading={loading}
                  />
                );
              })()}

              {/* Team utilization stats */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Utilization
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Utilization</span>
                    <span className="font-semibold text-slate-800">{teamMetrics.avgUtilizationPct ?? 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">At Risk</span>
                    <span className="font-semibold text-amber-600">{teamMetrics.atRiskCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Team Size</span>
                    <span className="font-semibold text-slate-800">{teamMetrics.teamSize ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
