import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminGuard, ManagerGuard, EmployeeGuard } from "./components/auth/ProtectedRoute";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Dashboards
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <h1 className="text-2xl font-black text-slate-700">{title}</h1>
      <p className="text-slate-400 mt-2">This page is under construction.</p>
    </div>
  </div>
);

// Redirect based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const dashboards = {
    admin: "/admin/dashboard",
    manager: "/manager/dashboard",
    employee: "/employee/dashboard",
  };

  return <Navigate to={dashboards[user.role] || "/login"} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={<AdminGuard><PlaceholderPage title="Admin Dashboard" /></AdminGuard>}
      />
      <Route
        path="/admin/employees"
        element={<AdminGuard><PlaceholderPage title="Employee Management" /></AdminGuard>}
      />

      {/* Manager */}
      <Route
        path="/manager/dashboard"
        element={<ManagerGuard><PlaceholderPage title="Manager Dashboard" /></ManagerGuard>}
      />
      <Route
        path="/manager/tasks"
        element={<ManagerGuard><PlaceholderPage title="Task Management" /></ManagerGuard>}
      />

      {/* Employee */}
      <Route
        path="/employee/dashboard"
        element={<EmployeeGuard><PlaceholderPage title="Employee Dashboard" /></EmployeeGuard>}
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}