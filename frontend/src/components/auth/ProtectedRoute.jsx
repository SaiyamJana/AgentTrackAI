import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Generic loading screen
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center animate-pulse">
        <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6">
          <circle cx="18" cy="10" r="4" fill="white" fillOpacity="0.9" />
          <circle cx="10" cy="26" r="3" fill="white" fillOpacity="0.6" />
          <circle cx="26" cy="26" r="3" fill="white" fillOpacity="0.6" />
          <path d="M18 14 L10 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
          <path d="M18 14 L26 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-sm text-slate-500 font-medium">Loading AgentTrack…</p>
    </div>
  </div>
);

/**
 * ProtectedRoute — wraps any route that requires auth.
 * Optionally restricts by role(s).
 *
 * Usage:
 *  <ProtectedRoute allowedRoles={["admin"]}>
 *    <AdminDashboard />
 *  </ProtectedRoute>
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard if they land on the wrong route
    const dashboards = {
      admin: "/admin/dashboard",
      manager: "/manager/dashboard",
      employee: "/employee/dashboard",
    };
    return <Navigate to={dashboards[user.role] || "/"} replace />;
  }

  return children;
};

// Convenience wrappers matching the spec's guard names
export const AdminGuard = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
);

export const ManagerGuard = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin", "manager"]}>{children}</ProtectedRoute>
);

export const EmployeeGuard = ({ children }) => (
  <ProtectedRoute allowedRoles={["employee"]}>{children}</ProtectedRoute>
);
