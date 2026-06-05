import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminGuard, ManagerGuard, EmployeeGuard } from "./components/auth/ProtectedRoute";

// Auth pages
import LoginPage    from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Dashboards
import AdminDashboard    from "./pages/admin/AdminDashboard";
import ManagerDashboard  from "./pages/manager/ManagerDashboard";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

// Placeholder for pages not yet built
const Placeholder = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center bg-white rounded-2xl border border-slate-100 px-10 py-12 shadow-sm">
      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h1 className="text-lg font-bold text-slate-700">{title}</h1>
      <p className="text-sm text-slate-400 mt-1">This page is under construction.</p>
    </div>
  </div>
);

// Root redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  const map = { admin: "/admin/dashboard", manager: "/manager/dashboard", employee: "/employee/dashboard" };
  return <Navigate to={map[user.role] || "/login"} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<RootRedirect />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Admin ── */}
      <Route path="/admin/dashboard"  element={<AdminGuard><AdminDashboard /></AdminGuard>} />
      <Route path="/admin/employees"  element={<AdminGuard><Placeholder title="Employee Management" /></AdminGuard>} />
      <Route path="/admin/projects"   element={<ManagerGuard><Placeholder title="Project Management" /></ManagerGuard>} />
      <Route path="/admin/settings"   element={<AdminGuard><Placeholder title="System Settings" /></AdminGuard>} />

      {/* ── Manager ── */}
      <Route path="/manager/dashboard" element={<ManagerGuard><ManagerDashboard /></ManagerGuard>} />
      <Route path="/manager/tasks"     element={<ManagerGuard><Placeholder title="Task Management" /></ManagerGuard>} />
      <Route path="/manager/reports"   element={<ManagerGuard><Placeholder title="Reports" /></ManagerGuard>} />
      <Route path="/manager/risks"     element={<ManagerGuard><Placeholder title="Risk Alerts" /></ManagerGuard>} />
      <Route path="/manager/workload"  element={<ManagerGuard><Placeholder title="Workload Analysis" /></ManagerGuard>} />
      <Route path="/manager/chatbot"   element={<ManagerGuard><Placeholder title="AI Chatbot" /></ManagerGuard>} />

      {/* ── Employee ── */}
      <Route path="/employee/dashboard"     element={<EmployeeGuard><EmployeeDashboard /></EmployeeGuard>} />
      <Route path="/employee/tasks"         element={<EmployeeGuard><Placeholder title="My Tasks" /></EmployeeGuard>} />
      <Route path="/employee/projects"      element={<EmployeeGuard><Placeholder title="My Projects" /></EmployeeGuard>} />
      <Route path="/employee/notifications" element={<EmployeeGuard><Placeholder title="Notifications" /></EmployeeGuard>} />

      {/* ── Shared ── */}
      <Route path="/analytics" element={<ManagerGuard><Placeholder title="Analytics Dashboard" /></ManagerGuard>} />

      {/* Fallback */}
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
