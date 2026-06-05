import { useState } from "react";

import Navbar from "../components/dashboard/Navbar";
import Sidebar from "../components/dashboard/Sidebar";
import StatsGrid from "../components/dashboard/StatsGrid";
import RecentActivity from "../components/dashboard/RecentActivity";
import NotificationPanel from "../components/dashboard/NotificationPanel";
import PageHeader from "../components/dashboard/PageHeader";
import DataTable from "../components/dashboard/DataTable";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

const AdminDashboard = () => {
  const [open, setOpen] = useState(false);

  const menuItems = [
    "Dashboard",
    "Users",
    "Roles",
    "Projects",
    "Settings",
  ];

  const stats = [
    { title: "Total Users", value: 120 },
    { title: "Managers", value: 10 },
    { title: "Employees", value: 100 },
    { title: "Projects", value: 15 },
  ];

  const users = [
    {
      name: "Admin User",
      role: "Admin",
      status: "Active",
    },
    {
      name: "Manager One",
      role: "Manager",
      status: "Active",
    },
    {
      name: "Employee One",
      role: "Employee",
      status: "Active",
    },
  ];

  return (
    <div className="flex bg-blue-50 min-h-screen">
      <Sidebar menuItems={menuItems} />

      <div className="flex-1">
        <Navbar title="Admin Dashboard" />

        <div className="p-6">
          <PageHeader
            title="System Administration"
            subtitle="Manage users and platform settings"
          />

          <StatsGrid stats={stats} />

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setOpen(true)}>
              Add User
            </Button>
          </div>

          <div className="mt-6">
            <DataTable data={users} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <RecentActivity />
            <NotificationPanel />
          </div>
        </div>
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add New User"
      >
        <div className="space-y-4">
          <Input placeholder="Full Name" />
          <Input placeholder="Email Address" />
          <Input placeholder="Role" />

          <Button>Create User</Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;