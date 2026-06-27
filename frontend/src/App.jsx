import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminGuard, EmployeeGuard, AnyAuthGuard } from "./components/auth/ProtectedRoute";

import LoginPage           from "./pages/auth/LoginPage";
import RegisterPage        from "./pages/auth/RegisterPage";
import RegisterCompanyPage from "./pages/auth/RegisterCompanyPage";
import AdminDashboard      from "./pages/admin/AdminDashboard";
import AdminProjectsPage   from "./pages/admin/AdminProjectsPage";
import AdminEmployeesPage  from "./pages/admin/AdminEmployeesPage";
import ManagerDashboard    from "./pages/manager/ManagerDashboard";
import TasksPage           from "./pages/manager/TasksPage";
import ReportsPage         from "./pages/manager/ReportsPage";
import RisksPage           from "./pages/manager/RisksPage";
import EmployeeDashboard   from "./pages/employee/EmployeeDashboard";
import MyTasksPage         from "./pages/employee/MyTasksPage";
import ProjectsPage        from "./pages/employee/ProjectsPage";
import NotificationsPage   from "./pages/employee/NotificationsPage";
import AnalyticsPage       from "./pages/shared/AnalyticsPage";
import ActivityLogPage from "./pages/shared/ActivityLogPage";
import SettingsPage from "./pages/admin/SettingsPage";

// ── NEW: Workload pages ────────────────────────────────────────────────────────
import WorkloadDashboard   from "./pages/manager/WorkloadDashboard";   // replaces Placeholder
import MyWorkloadPage      from "./pages/employee/MyWorkloadPage";
import CompanyWorkloadPage from "./pages/admin/CompanyWorkloadPage";

const Placeholder = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center bg-white rounded-2xl border border-slate-100 px-10 py-12 shadow-sm">
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h1 className="text-lg font-bold text-slate-700">{title}</h1>
      <p className="text-sm text-slate-400 mt-1">Coming soon.</p>
    </div>
  </div>
);

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard"} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                 element={<RootRedirect />} />
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/register-company" element={<RegisterCompanyPage />} />

      {/* ── Shared ─────────────────────────────────────────────────── */}
      <Route path="/analytics" element={
        <AnyAuthGuard><AnalyticsPage /></AnyAuthGuard>
      } />

      {/* ── Admin ──────────────────────────────────────────────────── */}
      <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="/admin/projects"  element={<AdminGuard><AdminProjectsPage /></AdminGuard>} />
      <Route path="/admin/employees" element={<AdminGuard><AdminEmployeesPage /></AdminGuard>} />
      <Route path="/admin/settings" element={<AdminGuard><SettingsPage /></AdminGuard>} />
      <Route path="/admin/risks"     element={<AdminGuard><RisksPage /></AdminGuard>} />
      <Route path="/admin/activity-log" element={<AdminGuard><ActivityLogPage /></AdminGuard>} />

      {/* NEW: Admin company-wide workload overview */}
      <Route path="/admin/workload"  element={<AdminGuard><CompanyWorkloadPage /></AdminGuard>} />

      {/* ── Employee (includes project-managers) ───────────────────── */}
      <Route path="/employee/dashboard"     element={<EmployeeGuard><EmployeeDashboard /></EmployeeGuard>} />
      <Route path="/employee/tasks"         element={<EmployeeGuard><MyTasksPage /></EmployeeGuard>} />
      <Route path="/employee/projects"      element={<EmployeeGuard><ProjectsPage /></EmployeeGuard>} />
      <Route path="/employee/notifications" element={<EmployeeGuard><NotificationsPage /></EmployeeGuard>} />

      {/* NEW: Employee personal workload page */}
      <Route path="/employee/workload"      element={<EmployeeGuard><MyWorkloadPage /></EmployeeGuard>} />

      {/* Manager-style pages — employee with projectRole=manager accesses these */}
      <Route path="/manager/dashboard" element={<EmployeeGuard><ManagerDashboard /></EmployeeGuard>} />
      <Route path="/manager/tasks"     element={<EmployeeGuard><TasksPage /></EmployeeGuard>} />
      <Route path="/manager/reports"   element={<EmployeeGuard><ReportsPage /></EmployeeGuard>} />
      <Route path="/manager/risks"     element={<EmployeeGuard><RisksPage /></EmployeeGuard>} />
      <Route path="/manager/chatbot"   element={<EmployeeGuard><Placeholder title="AI Chatbot" /></EmployeeGuard>} />
      <Route path="/manager/activity-log" element={<EmployeeGuard><ActivityLogPage /></EmployeeGuard>} />

      {/* NEW: Manager team workload dashboard — replaces Placeholder */}
      <Route path="/manager/workload"  element={<EmployeeGuard><WorkloadDashboard /></EmployeeGuard>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
