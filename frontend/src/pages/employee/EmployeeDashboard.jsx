import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import {
  MyTasksList,
  MyProjectsList,
  UpcomingDeadlines,
  ProgressSummary,
} from "../../components/employee/EmployeeWidgets";
import { useAuth } from "../../context/AuthContext";

// ── Mock data (replace with /api/v1/tasks?assignedTo=me etc.) ─────────────────
const initialTasks = [
  {
    _id: "t1",
    title: "Build Authentication API",
    description: "Implement JWT-based auth endpoints including login, register and token refresh. Ensure password hashing with bcrypt.",
    priority: "high",
    status: "in-progress",
    deadline: new Date(Date.now() + 86400000),         // tomorrow
    completionPercentage: 65,
    projectId: "p1",
    projectName: "Q3 Infrastructure",
  },
  {
    _id: "t2",
    title: "Write Unit Tests — Auth Module",
    description: "Achieve 80% test coverage on all authentication endpoints using Jest.",
    priority: "medium",
    status: "pending",
    deadline: new Date(Date.now() + 3 * 86400000),
    completionPercentage: 10,
    projectId: "p1",
    projectName: "Q3 Infrastructure",
  },
  {
    _id: "t3",
    title: "Design System Audit",
    description: "Review current component library against Figma specs, log inconsistencies in a shared doc.",
    priority: "low",
    status: "completed",
    deadline: new Date(Date.now() - 86400000),          // yesterday (completed)
    completionPercentage: 100,
    projectId: "p2",
    projectName: "Customer Portal Redesign",
  },
  {
    _id: "t4",
    title: "Responsive Mobile Layout",
    description: "Implement responsive breakpoints for the new customer portal dashboard pages.",
    priority: "high",
    status: "pending",
    deadline: new Date(Date.now() - 2 * 86400000),      // overdue
    completionPercentage: 30,
    projectId: "p2",
    projectName: "Customer Portal Redesign",
  },
];

const mockProjects = [
  { _id: "p1", title: "Q3 Infrastructure Upgrade",  status: "active",  progressPercentage: 68, endDate: "2025-07-15", myTaskCount: 3, totalTasks: 24 },
  { _id: "p2", title: "Customer Portal Redesign",   status: "active",  progressPercentage: 42, endDate: "2025-07-28", myTaskCount: 2, totalTasks: 18 },
];

const mockDeadlines = [
  { title: "Responsive Mobile Layout",  project: "Customer Portal",  date: new Date(Date.now() - 2 * 86400000) },
  { title: "Build Authentication API",  project: "Q3 Infrastructure", date: new Date(Date.now() + 86400000) },
  { title: "Write Unit Tests",          project: "Q3 Infrastructure", date: new Date(Date.now() + 3 * 86400000) },
];

// ── Stat icons ────────────────────────────────────────────────────────────────
const TaskIcon  = (p) => <Icon name="task"        {...p} />;
const CheckIcon = (p) => <Icon name="checkCircle" {...p} />;
const WarnIcon  = (p) => <Icon name="exclamation" {...p} />;
const ClockIcon = (p) => <Icon name="clock"       {...p} />;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState(initialTasks);

  const handleUpdateProgress = (taskId, percentage, status, save = false) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? { ...t, completionPercentage: percentage, status: status || t.status }
          : t
      )
    );
    if (save) {
      // TODO: PATCH /api/v1/tasks/:taskId  { completionPercentage, status }
      console.log("Saving task update:", { taskId, percentage, status });
    }
  };

  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const overdue   = tasks.filter(t => t.status !== "completed" && new Date(t.deadline) < Date.now()).length;
  const inProg    = tasks.filter(t => t.status === "in-progress").length;

  return (
    <DashboardLayout title="My Dashboard">
      {/* Greeting */}
      <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">
          Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {overdue > 0
            ? `You have ${overdue} overdue task${overdue > 1 ? "s" : ""} — let's tackle them first.`
            : "You're on track — keep it up!"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Total Tasks"     value={total}     sub="assigned to me"   icon={TaskIcon}  color="blue"  />
        <StatCard label="Completed"       value={completed} sub="this sprint"       icon={CheckIcon} color="green" />
        <StatCard label="In Progress"     value={inProg}    sub="currently active"  icon={ClockIcon} color="purple" />
        <StatCard label="Overdue"         value={overdue}   sub="need attention"    icon={WarnIcon}  color={overdue > 0 ? "red" : "slate"} />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 page-enter-delay-2">

        {/* Left: tasks list — spans 2 cols */}
        <div className="lg:col-span-2">
          <MyTasksList tasks={tasks} onUpdateProgress={handleUpdateProgress} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <ProgressSummary tasks={tasks} />
          <MyProjectsList projects={mockProjects} />
          <UpcomingDeadlines deadlines={mockDeadlines} />
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
