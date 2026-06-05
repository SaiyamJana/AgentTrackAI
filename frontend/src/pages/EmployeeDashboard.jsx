import Navbar from "../components/dashboard/Navbar";
import Sidebar from "../components/dashboard/Sidebar";
import StatsGrid from "../components/dashboard/StatsGrid";
import ProfileCard from "../components/dashboard/ProfileCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import NotificationPanel from "../components/dashboard/NotificationPanel";
import PageHeader from "../components/dashboard/PageHeader";
import TaskChart from "../components/charts/TaskChart";

const EmployeeDashboard = () => {
  const menuItems = [
    "Dashboard",
    "My Tasks",
    "Attendance",
    "Profile",
    "Settings",
  ];

  const stats = [
    { title: "Assigned Tasks", value: 12 },
    { title: "Completed Tasks", value: 8 },
    { title: "Pending Tasks", value: 4 },
    { title: "Attendance", value: "95%" },
  ];

  return (
    <div className="flex bg-blue-50 min-h-screen">
      <Sidebar menuItems={menuItems} />

      <div className="flex-1">
        <Navbar title="Employee Dashboard" />

        <div className="p-6">
          <PageHeader
            title="Welcome Employee"
            subtitle="Track your tasks and performance"
          />

          <StatsGrid stats={stats} />

          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <TaskChart />
            </div>

            <ProfileCard />
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

export default EmployeeDashboard;