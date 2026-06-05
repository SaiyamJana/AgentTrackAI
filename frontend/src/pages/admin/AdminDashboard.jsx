import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import {
  RecentActivity,
  QuickActions,
  EmployeeTable,
  SystemHealth,
} from "../../components/admin/AdminWidgets";
import { useAuth } from "../../context/AuthContext";

// ── Mock data (replace with real API calls) ───────────────────────────────────
const mockStats = {
  totalEmployees: 48,
  totalProjects:  12,
  activeTasks:    87,
  completionRate: 74,
};

const mockLogs = [
  { _id: "1", action: "TASK_COMPLETED", details: "Priya Sharma completed 'Design System Review'", entityType: "task",    createdAt: new Date(Date.now() - 120000) },
  { _id: "2", action: "PROJECT_CREATED", details: "Rohan Mehta created project 'Q3 Infrastructure'", entityType: "project", createdAt: new Date(Date.now() - 900000) },
  { _id: "3", action: "TASK_CREATED",   details: "Aditya Nair assigned 'API Rate Limiting' to Vikram", entityType: "task", createdAt: new Date(Date.now() - 3600000) },
  { _id: "4", action: "TASK_UPDATED",   details: "Status updated on 'Payment Gateway Module'",      entityType: "task",    createdAt: new Date(Date.now() - 7200000) },
  { _id: "5", action: "TASK_COMPLETED", details: "Sneha Kulkarni completed 'Unit Test Suite'",      entityType: "task",    createdAt: new Date(Date.now() - 10800000) },
];

const mockEmployees = [
  { _id: "1", name: "Priya Sharma",    email: "priya@agenttrack.io",  role: "employee", department: "Engineering", designation: "Frontend Developer", isActive: true },
  { _id: "2", name: "Rohan Mehta",     email: "rohan@agenttrack.io",  role: "manager",  department: "Product",     designation: "Product Manager",     isActive: true },
  { _id: "3", name: "Aditya Nair",     email: "aditya@agenttrack.io", role: "manager",  department: "Engineering", designation: "Engineering Manager", isActive: true },
  { _id: "4", name: "Sneha Kulkarni",  email: "sneha@agenttrack.io",  role: "employee", department: "QA",          designation: "QA Engineer",         isActive: true },
  { _id: "5", name: "Vikram Singh",    email: "vikram@agenttrack.io", role: "employee", department: "Engineering", designation: "Backend Developer",   isActive: false },
];

// ── Stat icon helpers ─────────────────────────────────────────────────────────
const UsersIcon  = (p) => <Icon name="users"        {...p} />;
const FolderIcon = (p) => <Icon name="folder"       {...p} />;
const TaskIcon   = (p) => <Icon name="task"         {...p} />;
const TrendIcon  = (p) => <Icon name="trend"        {...p} />;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats]     = useState(mockStats);
  const [logs]      = useState(mockLogs);
  const [employees] = useState(mockEmployees);

  // TODO: replace with real API calls
  // useEffect(() => { fetch("/api/v1/admin/stats").then(...) }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Greeting */}
      <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">
          Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening across your organization today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 page-enter-delay-1">
        <StatCard label="Total Employees"  value={stats.totalEmployees} sub="across all depts"  icon={UsersIcon}  color="blue"  trend={4}  />
        <StatCard label="Total Projects"   value={stats.totalProjects}  sub="3 active, 1 hold"  icon={FolderIcon} color="purple" trend={8} />
        <StatCard label="Active Tasks"     value={stats.activeTasks}    sub="18 due this week"  icon={TaskIcon}   color="amber" trend={-2} />
        <StatCard label="Completion Rate"  value={`${stats.completionRate}%`} sub="vs 68% last month" icon={TrendIcon}  color="green" trend={6} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5 page-enter-delay-2">
        {/* Activity feed – takes 2 cols */}
        <div className="xl:col-span-2">
          <RecentActivity logs={logs} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <QuickActions />
          <SystemHealth />
        </div>
      </div>

      {/* Employee table */}
      <div className="page-enter-delay-3">
        <EmployeeTable employees={employees} />
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
