import DashboardLayout      from "../../components/layout/DashboardLayout";
import StatCard              from "../../components/shared/StatCard";
import Icon                  from "../../components/shared/Icon";
import WorkloadScoreRing     from "../../components/workload/WorkloadScoreRing";
import BurnoutRiskMeter      from "../../components/workload/BurnoutRiskMeter";
import CapacityBar           from "../../components/workload/CapacityBar";
import WorkloadHistoryChart  from "../../components/workload/WorkloadHistoryChart";
import AIRecommendationsPanel from "../../components/workload/AIRecommendationsPanel";
import TaskPriorityQueue     from "../../components/workload/TaskPriorityQueue";
import { useMyWorkload }     from "../../hooks/useWorkload";

const TI = (p) => <Icon name="clock"       {...p} />;
const DI = (p) => <Icon name="exclamation" {...p} />;
const CI = (p) => <Icon name="checkCircle" {...p} />;
const WI = (p) => <Icon name="workload"    {...p} />;

export default function MyWorkloadPage() {
  const { data, loading, error, refetch } = useMyWorkload();

  const snap  = data?.snapshot;
  const queue = data?.priorityQueue ?? [];
  const history = data?.history ?? [];

  return (
    <DashboardLayout title="My Workload">
      <div className="flex items-center justify-between mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Workload</h2>
          <p className="text-sm text-slate-500 mt-1">
            Your personal workload analysis and AI-powered task prioritization.
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-sm text-slate-600 rounded-xl hover:bg-slate-50 transition"
        >
          <WI className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-sm text-red-500">
          Failed to load workload data: {error}
        </div>
      )}

      {!loading && !snap && !error && (
        <div className="text-center py-16">
          <WI className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No workload data yet. Your manager will trigger the analysis shortly.</p>
        </div>
      )}

      {snap && !loading && (
        <>
          {/* ── KPI cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Active Tasks"
              value={snap.activeTasksCount ?? 0}
              sub="non-completed assignments"
              icon={TI}
              color="blue"
            />
            <StatCard
              label="Delayed Tasks"
              value={snap.delayedTasksCount ?? 0}
              sub="past deadline"
              icon={DI}
              color={snap.delayedTasksCount > 0 ? "red" : "green"}
            />
            <StatCard
              label="Done This Week"
              value={snap.completedLast7Days ?? 0}
              sub="completed in last 7 days"
              icon={CI}
              color="green"
            />
            <StatCard
              label="Active Hours"
              value={`${snap.totalActiveHours ?? 0}h`}
              sub={`of ${snap.capacityHoursPerWeek ?? 40}h/week`}
              icon={WI}
              color="amber"
            />
          </div>

          {/* ── Main 2-column layout ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: scores */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-5">Your Workload Scores</h3>

              <div className="flex justify-center mb-6">
                <WorkloadScoreRing
                  score={snap.workloadScore ?? 0}
                  size={140}
                  strokeWidth={12}
                  label="Workload Score"
                />
              </div>

              <div className="space-y-5">
                <BurnoutRiskMeter score={snap.burnoutRiskScore ?? 0} />
                <CapacityBar
                  totalActiveHours={snap.totalActiveHours ?? 0}
                  capacityHoursPerWeek={snap.capacityHoursPerWeek ?? 40}
                  utilizationPct={snap.utilizationPct ?? 0}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400 text-center">
                Last updated:{" "}
                {snap.calculatedAt
                  ? new Date(snap.calculatedAt).toLocaleString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })
                  : "—"}
              </div>
            </div>

            {/* Right: AI priority queue */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Task Priority Queue
                </h3>
                <span className="text-xs text-slate-400 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  AI sorted
                </span>
              </div>
              <TaskPriorityQueue tasks={queue} />
            </div>
          </div>

          {/* ── AI Recommendations ─────────────────────────────────────── */}
          <div className="mb-6">
            <AIRecommendationsPanel
              aiSummary={data?.aiSummary ?? snap.aiSummary}
              aiRecommendations={data?.aiRecommendations ?? snap.aiRecommendations ?? []}
              usedAI={snap.usedAI ?? false}
              calculatedAt={snap.calculatedAt}
            />
          </div>

          {/* ── Workload history chart ─────────────────────────────────── */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <WorkloadHistoryChart
              history={history}
              title="Workload Trend (last 14 days)"
            />
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
