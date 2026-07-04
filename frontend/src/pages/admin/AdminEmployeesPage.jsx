import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import { useAllEmployeesAdmin, useEmployeeProjects } from "../../hooks/useTasks";

/* ── helpers ──────────────────────────────────────────────────────── */
const roleCfg = {
  manager:       "bg-violet-50 text-violet-700",
  "sub-manager": "bg-blue-50 text-blue-700",
  member:        "bg-slate-100 text-slate-600",
};

const STATUS_CFG = {
  active:   { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  inactive: { dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-500" },
};

/* ── Edit Employee Modal ──────────────────────────────────────────── */
const EditEmployeeModal = ({ employee, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:        employee.name ?? "",
    department:  employee.department ?? "",
    designation: employee.designation ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const h = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) { setErr("Name is required."); return; }
    setSaving(true); setErr("");
    try { await onSave(employee._id, form); onClose(); }
    catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Icon name="users" className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Edit Employee</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{err}</div>}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Full Name *</label>
            <input name="name" value={form.name} onChange={h} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email</label>
            <input value={employee.email} disabled className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Department</label>
              <input name="department" value={form.department} onChange={h} placeholder="e.g. Engineering" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Designation</label>
              <input name="designation" value={form.designation} onChange={h} placeholder="e.g. Developer" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Employee Projects Modal ──────────────────────────────────────── */
const EmployeeProjectsModal = ({ employee, onClose }) => {
  const { assignments, loading } = useEmployeeProjects(employee._id);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Project Assignments</h2>
            <p className="text-xs text-slate-400 mt-0.5">{employee.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse mb-2" />)
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Icon name="folder" className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">Not assigned to any project yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map(({ project, projectRole }) => (
                <div key={project._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon name="folder" className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{project.title}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{project.status}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${roleCfg[projectRole] ?? roleCfg.member}`}>
                    {projectRole}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-5 pt-0 shrink-0 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
};

/* ── Employee Card ─────────────────────────────────────────────────── */
const EmployeeCard = ({ employee, onEdit, onViewProjects, onToggleActive, toggling }) => {
  const status = employee.isActive ? "active" : "inactive";
  const s = STATUS_CFG[status];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
            {employee.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">{employee.name}</h3>
            <p className="text-xs text-slate-400 truncate">{employee.email}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <Icon name="cpu" className="w-3.5 h-3.5 text-slate-400" />
          {employee.department || "—"}
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="shield" className="w-3.5 h-3.5 text-slate-400" />
          {employee.designation || "—"}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-50 flex gap-2">
        <button onClick={() => onViewProjects(employee)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
          <Icon name="folder" className="w-3.5 h-3.5" />Projects
        </button>
        <button onClick={() => onEdit(employee)}
          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5">
          <Icon name="settings" className="w-3.5 h-3.5" />Edit
        </button>
        <button onClick={() => onToggleActive(employee)} disabled={toggling}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
            employee.isActive
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}>
          {toggling ? "…" : employee.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
};

/* ── Page ──────────────────────────────────────────────────────────── */
export default function AdminEmployeesPage() {
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editEmployee,    setEditEmployee]    = useState(null);
  const [projectsEmployee, setProjectsEmployee] = useState(null);
  const [togglingId,   setTogglingId]   = useState(null);

  const { employees, loading, error, updateEmployee, deactivateEmployee, reactivateEmployee } = useAllEmployeesAdmin();

  const filtered = employees.filter(e => {
    const matchesSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || (filterStatus === "active" ? e.isActive : !e.isActive);
    return matchesSearch && matchesStatus;
  });

  const activeCount   = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;

  const handleToggleActive = async (employee) => {
    setTogglingId(employee._id);
    try {
      if (employee.isActive) await deactivateEmployee(employee._id);
      else await reactivateEmployee(employee._id);
    } catch { /* silently ignore */ }
    finally { setTogglingId(null); }
  };

  return (
    <DashboardLayout title="Employee Management">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employees</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading…" : `${employees.length} total — ${activeCount} active, ${inactiveCount} inactive`}
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total",    val: employees.length, color: "bg-blue-50 border-blue-200 text-blue-700" },
          { label: "Active",   val: activeCount,       color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
          { label: "Inactive", val: inactiveCount,     color: "bg-slate-50 border-slate-200 text-slate-600" },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl border px-5 py-4 ${k.color}`}>
            <p className="text-2xl font-black">{loading ? "…" : k.val}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Icon name="users" className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <div className="flex gap-2">
          {["", "active", "inactive"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-44 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="users" className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No employees found</p>
          <p className="text-sm text-slate-400 mt-2">
            {search || filterStatus ? "Try adjusting your search or filters." : "Employees will appear here once they register with your Secure Code."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(emp => (
            <EmployeeCard
              key={emp._id}
              employee={emp}
              onEdit={setEditEmployee}
              onViewProjects={setProjectsEmployee}
              onToggleActive={handleToggleActive}
              toggling={togglingId === emp._id}
            />
          ))}
        </div>
      )}

      {editEmployee && (
        <EditEmployeeModal
          employee={editEmployee}
          onClose={() => setEditEmployee(null)}
          onSave={updateEmployee}
        />
      )}

      {projectsEmployee && (
        <EmployeeProjectsModal
          employee={projectsEmployee}
          onClose={() => setProjectsEmployee(null)}
        />
      )}
    </DashboardLayout>
  );
}