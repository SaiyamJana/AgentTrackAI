import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useAuth } from "../../context/AuthContext";
import { userAPI } from "../../utils/api";

const getGreeting = () => { const h=new Date().getHours(); if(h<12)return"morning"; if(h<17)return"afternoon"; return"evening"; };
const UsersIcon  = (p) => <Icon name="users"   {...p}/>;
const FolderIcon = (p) => <Icon name="folder"  {...p}/>;
const TaskIcon   = (p) => <Icon name="task"    {...p}/>;
const KeyIcon    = (p) => <Icon name="settings"{...p}/>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!user?.companyId) return;
    userAPI.list({ role: "employee" })
      .then(res => setEmployees(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.companyId]);

  const active   = employees.filter(e => e.isActive).length;
  const inactive = employees.filter(e => !e.isActive).length;

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋</h2>
        <p className="text-sm text-slate-500 mt-1">Here's your company overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 page-enter-delay-1">
        <StatCard label="Total Employees" value={loading?"…":employees.length} sub="registered"       icon={UsersIcon}  color="blue"   />
        <StatCard label="Active"          value={loading?"…":active}           sub="currently active" icon={FolderIcon} color="green"  />
        <StatCard label="Inactive"        value={loading?"…":inactive}         sub="deactivated"      icon={TaskIcon}   color="amber"  />
        <StatCard label="Secure Code"      value="••••••••"                     sub="see Settings"     icon={KeyIcon}    color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 page-enter-delay-2">

        {/* Invite Code Card — secured */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
              <Icon name="settings" className="w-5 h-5 text-primary"/>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">Company Login Code</h3>
              <p className="text-xs text-slate-400">Manage securely in Settings</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <p className="text-sm font-mono text-slate-400 tracking-widest flex-1 select-none">
              ••••••••••••••••••••••••
            </p>
            <Icon name="lock" className="w-4 h-4 text-slate-300"/>
          </div>
          <a
            href="/admin/settings"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-primary-light text-primary border border-primary/20 hover:bg-primary-light transition-colors">
            <Icon name="settings" className="w-3.5 h-3.5"/>
            View or change in Settings
          </a>
        </div>

        {/* Employee Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">Employees</h3>
            <a href="/admin/employees" className="text-xs text-primary font-semibold hover:text-primary-hover">Manage</a>
          </div>
          {loading ? (
            [...Array(4)].map((_,i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse mb-2"/>)
          ) : employees.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="users" className="w-6 h-6 text-slate-300"/>
              </div>
              <p className="text-sm font-semibold text-slate-500">No employees yet</p>
              <p className="text-xs text-slate-400 mt-1">Go to Settings to get the Secure Code for employees to register.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="text-left pb-3">Name</th>
                    <th className="text-left pb-3">Department</th>
                    <th className="text-left pb-3">Designation</th>
                    <th className="text-left pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(e => (
                    <tr key={e._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary-light rounded-full flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {e.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{e.name}</p>
                            <p className="text-[10px] text-slate-400">{e.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-slate-500">{e.department ?? "—"}</td>
                      <td className="py-3 pr-4 text-xs text-slate-500">{e.designation ?? "—"}</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          e.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}>
                          {e.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-5 bg-white rounded-2xl border border-slate-100 p-5 page-enter-delay-3">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:"Manage Employees", icon:"users",    to:"/admin/employees" },
            { label:"Manage Projects",  icon:"folder",   to:"/admin/projects"  },
            { label:"System Settings",  icon:"settings", to:"/admin/settings"  },
            { label:"View Analytics",   icon:"chart",    to:"/analytics"       },
          ].map(a => (
            <a key={a.label} href={a.to} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:bg-primary-light hover:border-blue-200 transition-all group">
              <div className="w-9 h-9 bg-slate-50 group-hover:bg-primary-light rounded-xl flex items-center justify-center transition-colors">
                <Icon name={a.icon} className="w-4.5 h-4.5 text-slate-500 group-hover:text-primary"/>
              </div>
              <span className="text-xs font-semibold text-slate-600 group-hover:text-primary">{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}