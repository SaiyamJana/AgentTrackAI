import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";
import { memberAPI } from "../../utils/api";
import { useAuth }   from "../../context/AuthContext";

/**
 * DashboardLayout
 * Checks if the logged-in employee is a manager on any project
 * and passes that info to Sidebar so it shows Manager Tools.
 */
const DashboardLayout = ({ title, children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isManager,   setIsManager]   = useState(false);

  useEffect(() => {
    if (user?.role !== "employee") return;
    // Check managed projects via GET /projects (controller filters to manager's own)
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/projects`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })  
      .then(r => r.json())
      .then(d => {
        const list = d.data ?? [];
        setIsManager(Array.isArray(list) && list.length > 0);
      })
      .catch(() => {});
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isManager={isManager} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;