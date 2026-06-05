import Navbar from "../components/dashboard/Navbar";
import Sidebar from "../components/dashboard/Sidebar";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import NotificationPanel from "../components/dashboard/NotificationPanel";
import PageHeader from "../components/dashboard/PageHeader";
import PerformanceChart from "../components/charts/PerformanceChart";
import DataTable from "../components/dashboard/DataTable";

const ManagerDashboard = () => {
  const menuItems = [
    "Dashboard",
    "Team",
    "Projects",
    "Reports",
    "Settings",
  ];

  const stats = [
    { title: "Employees", value: 25 },
    { title: "Projects", value: 8 },
    { title: "Completed Tasks", value: 140 },
    { title: "Pending Reviews", value: 12 },
  ];

  const employees = [
    {
      name: "Rahul",
      role: "Developer",
      status: "Active",
    },
    {
      name: "Priya",
      role: "Designer",
      status: "Active",
    },
    {
      name: "Aman",
      role: "Tester",
      status: "On Leave",
    },
  ];

  return (
    <div className="flex bg-blue-50 min-h-screen">
      <Sidebar menuItems={menuItems} />

      <div className="flex-1">
        <Navbar title="Manager Dashboard" />

        <div className="p-6">
          <PageHeader
            title="Manager Overview"
            subtitle="Monitor your team's progress"
          />

          <StatsGrid stats={stats} />

          <div className="mt-6">
            <PerformanceChart />
          </div>

          <div className="mt-6">
            <DataTable data={employees} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <RecentActivity />
            <NotificationPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;