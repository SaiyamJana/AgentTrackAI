import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import {
  ProjectHealthList,
  RiskAlertWidget,
  TeamOverview,
  DeadlineTimeline,
  AIReportCard,
} from "../../components/manager/ManagerWidgets";
import { useAuth } from "../../context/AuthContext";

// ── Mock Data (wire up to /api/v1/... in production) ──────────────────────────
const mockProjects = [
  { _id: "1", title: "Q3 Infrastructure Upgrade",  status: "active",    progressPercentage: 68, endDate: "2025-07-15", taskCount: 24, managerId: "m1" },
  { _id: "2", title: "Customer Portal Redesign",   status: "active",    progressPercentage: 42, endDate: "2025-07-28", taskCount: 18, managerId: "m1" },
  { _id: "3", title: "Payment Gateway Module",      status: "on-hold",   progressPercentage: 80, endDate: "2025-08-05", taskCount: 11, managerId: "m1" },
  { _id: "4", title: "Mobile App v2.0",             status: "active",    progressPercentage: 21, endDate: "2025-09-01", taskCount: 33, managerId: "m1" },
];

const mockRisks = [
  { _id: "r1", riskLevel: "high",   reason: "API Integration task is 5 days overdue",          recommendation: "Reassign or break into smaller sub-tasks immediately.",  resolved: false },
  { _id: "r2", riskLevel: "medium", reason: "Vikram Singh is overloaded with 14 active tasks",  recommendation: "Redistribute 4 tasks to available team members.",          resolved: false },
  { _id: "r3", riskLevel: "low",    reason: "Mobile App v2.0 deadline may slip by 2 weeks",     recommendation: "Schedule scope review with stakeholders.",               resolved: false },
];

const mockWorkloads = [
  { _id: "w1", employeeName: "Priya Sharma",   activeTasksCount: 6, totalAssignedHours: 28, status: "optimal" },
  { _id: "w2", employeeName: "Vikram Singh",   activeTasksCount: 14, totalAssignedHours: 58, status: "overloaded" },
  { _id: "w3", employeeName: "Sneha Kulkarni", activeTasksCount: 3, totalAssignedHours: 14, status: "underutilized" },
  { _id: "w4", employeeName: "Arjun Patel",    activeTasksCount: 8, totalAssignedHours: 36, status: "optimal" },
];

const mockDeadlines = [
  { title: "API Rate Limiting",       project: "Q3 Infrastructure",     date: new Date(Date.now() - 86400000) },
  { title: "Design System Handoff",   project: "Customer Portal",       date: new Date(Date.now() + 86400000) },
  { title: "Auth Module Tests",       project: "Mobile App v2.0",       date: new Date(Date.now() + 3 * 86400000) },
  { title: "Payment API Integration", project: "Payment Gateway Module", date: new Date(Date.now() + 8 * 86400000) },
];

const mockReport = {
  reportType: "daily",
  summary: "3 tasks were completed yesterday across 2 projects. Q3 Infrastructure is on track at 68% completion. 1 high-severity risk detected on API Integration — immediate action recommended. Team capacity is unevenly distributed; Vikram Singh is overloaded.",
  generatedAt: new Date(),
};

// ── Stat icons ────────────────────────────────────────────────────────────────
const FolderIcon = (p) => <Icon name="folder"      {...p} />;
const CheckIcon  = (p) => <Icon name="checkCircle" {...p} />;
const ClockIcon  = (p) => <Icon name="clock"       {...p} />;
const WarnIcon   = (p) => <Icon name="exclamation" {...p} />;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects]  = useState(mockProjects);
  const [risks]     = useState(mockRisks);
  const [workloads] = useState(mockWorkloads);
  const [deadlines] = useState(mockDeadlines);
  const [report]    = useState(mockReport);

  const activeCount    = projects.filter(p => p.status === "active").length;
  const completedTasks = 28;   // from API
  const pendingTasks   = 43;
  const delayedTasks   = 7;

  // Quick-link buttons for manager
  const quickLinks = [
    { label: "Reports",  icon: "report",   to: "/manager/reports",   color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
    { label: "Risks",    icon: "shield",   to: "/manager/risks",     color: "bg-red-50 text-red-700 hover:bg-red-100" },
    { label: "Workload", icon: "workload", to: "/manager/workload",  color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
    { label: "Chatbot",  icon: "chat",     to: "/manager/chatbot",   color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  ];

  return (
    <DashboardLayout title="Manager Dashboard">
      {/* Greeting + quick links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {risks.filter(r => !r.resolved).length} active risk{risks.filter(r=>!r.resolved).length !== 1 ? "s" : ""} need your attention today.
          </p>
        </div>
        <div className="flex gap-2">
          {quickLinks.map((q) => (
            <button
              key={q.label}
              onClick={() => navigate(q.to)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors ${q.color}`}
            >
              <Icon name={q.icon} className="w-4 h-4" />
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Active Projects" value={activeCount}    sub="across your teams" icon={FolderIcon} color="blue"  />
        <StatCard label="Completed Tasks" value={completedTasks} sub="this sprint"       icon={CheckIcon}  color="green" trend={12} />
        <StatCard label="Pending Tasks"   value={pendingTasks}   sub="awaiting action"   icon={ClockIcon}  color="amber" />
        <StatCard label="Delayed Tasks"   value={delayedTasks}   sub="need intervention" icon={WarnIcon}   color="red"   trend={-3} />
      </div>

      {/* AI Report banner */}
      <div className="mb-5 page-enter-delay-1">
        <AIReportCard report={report} />
      </div>

      {/* Main 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 page-enter-delay-2">
        {/* Left: project health */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <ProjectHealthList projects={projects} />
          <RiskAlertWidget risks={risks} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <TeamOverview workloads={workloads} />
          <DeadlineTimeline deadlines={deadlines} />
        </div>
      </div>
    </DashboardLayout>
  );
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};
