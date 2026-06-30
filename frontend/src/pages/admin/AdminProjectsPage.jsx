import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import {
  useAllProjects,
  useProjectMembers,
  useAllEmployees,
} from "../../hooks/useTasks";
import { memberAPI } from "../../utils/api";

/* ── helpers ─────────────────────────────────────────────────────── */
const STATUS_CFG = {
  active: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
  "on-hold": { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  completed: { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600" },
};
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

/* ── Create Project Modal ─────────────────────────────────────────── */
const CreateProjectModal = ({ employees, onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    managerId: "",
    priority: "medium",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const h = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  const submit = async () => {
    if (!form.title || !form.managerId || !form.startDate || !form.endDate) {
      setErr("Title, manager, start date and end date are required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onCreate(form);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <Icon name="plus" className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Create Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
              {err}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Project Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={h}
              placeholder="e.g. Q3 Infrastructure"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={h}
              rows={2}
              placeholder="Brief overview…"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Project Manager *
              </label>
              <select
                name="managerId"
                value={form.managerId}
                onChange={h}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                    {e.designation ? ` — ${e.designation}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={h}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={h}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                End Date *
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={h}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Manage Team Modal ────────────────────────────────────────────── */
const ManageTeamModal = ({ project, allEmployees, onClose }) => {
  const { members, loading, assignMember, removeMember } = useProjectMembers(
    project._id,
  );

  const [assignId, setAssignId] = useState("");
  const [assignRole, setAssignRole] = useState("member");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState("");
  const [err, setErr] = useState("");

  const memberIds = new Set(
    members.map((m) => m.employeeId?._id ?? m.employeeId),
  );
  const available = allEmployees.filter((e) => !memberIds.has(e._id));

  const doAssign = async () => {
    if (!assignId) return;
    setSaving(true);
    setErr("");
    try {
      await assignMember(assignId, assignRole);
      setAssignId("");
      setAssignRole("member");
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const doRemove = async (eid) => {
    setRemoving(eid);
    setErr("");
    try {
      await removeMember(eid);
    } catch (e) {
      setErr(e.message);
    } finally {
      setRemoving("");
    }
  };

  const managerCount = members.filter(
    (m) => m.projectRole === "manager",
  ).length;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">Manage Team</h2>
            <p className="text-xs text-slate-400 mt-0.5">{project.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Assign Employee */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Assign Employee
            </p>

            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
                {err}
              </div>
            )}

            {/* Employee + Role selectors */}
            <div className="flex gap-2">
              <select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
              >
                <option value="">
                  {available.length === 0
                    ? "All employees assigned"
                    : "Select employee..."}
                </option>
                {available.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                    {e.designation ? ` — ${e.designation}` : ""}
                  </option>
                ))}
              </select>

              <select
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </select>

              <button
                onClick={doAssign}
                disabled={saving || !assignId}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shrink-0"
              >
                {saving ? "..." : "Assign"}
              </button>
            </div>
          </div>

          {/* Current Team */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Current Team ({members.length})
            </p>

            {loading ? (
              [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-50 rounded-xl animate-pulse mb-2"
                />
              ))
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No members assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => {
                  const emp = m.employeeId;
                  const eid = emp?._id ?? m.employeeId;
                  const name = emp?.name ?? "Unknown";
                  const desg = emp?.designation ?? "";
                  const role = m.projectRole ?? "member";
                  const isOnlyManager = role === "manager" && managerCount <= 1;

                  return (
                    <div
                      key={eid}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {name}
                        </p>
                        {desg && (
                          <p className="text-[10px] text-slate-400">{desg}</p>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          role === "manager"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {role === "manager" ? "Manager" : "Member"}
                      </span>

                      {/* Allow removing anyone — but block removing the only manager */}
                      <button
                        onClick={() => doRemove(eid)}
                        disabled={removing === eid || isOnlyManager}
                        title={
                          isOnlyManager
                            ? "Assign another manager before removing this one"
                            : "Remove"
                        }
                        className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        {removing === eid ? "..." : "Remove"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 shrink-0 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
/* ── Project Card ─────────────────────────────────────────────────── */
const ProjectCard = ({ project, allEmployees, onStatusChange, onDelete }) => {
  const [showTeam, setShowTeam] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [statusSave, setStatusSave] = useState(false);
  const s = STATUS_CFG[project.status] ?? STATUS_CFG.active;
  const end = fmt(project.endDate);
  const prog = project.progressPercentage ?? 0;

  const cycleStatus = async () => {
    const next = {
      active: "on-hold",
      "on-hold": "completed",
      completed: "active",
    };
    setStatusSave(true);
    try {
      await onStatusChange(project._id, { status: next[project.status] });
    } catch {
      /* silently ignore */
    } finally {
      setStatusSave(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 transition-all">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Icon name="folder" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {project.title}
              </h3>
              {project.description && (
                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={cycleStatus}
            disabled={statusSave}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all hover:opacity-80 ${s.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {statusSave ? "…" : project.status}
          </button>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs font-bold text-slate-600">{prog}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${prog >= 75 ? "bg-emerald-500" : prog >= 40 ? "bg-blue-500" : "bg-amber-400"}`}
              style={{ width: `${prog}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Icon name="users" className="w-3.5 h-3.5" />
            {project.managerId?.name ?? "No manager"}
          </div>
          <div className="flex items-center gap-1">
            <Icon name="calendar" className="w-3.5 h-3.5" />
            Ends {end}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2">
          <button
            onClick={() => setShowTeam(true)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Icon name="users" className="w-3.5 h-3.5" />
            Manage Team
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="w-10 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center shrink-0"
            title="Delete project"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {showTeam && (
        <ManageTeamModal
          project={project}
          allEmployees={allEmployees}
          onClose={() => setShowTeam(false)}
        />
      )}
      {showDelete && (
        <DeleteProjectModal
          project={project}
          onClose={() => setShowDelete(false)}
          onDelete={onDelete}
        />
      )}
    </>
  );
};
/* ── Delete Project Modal ─────────────────────────────────────────── */
const DeleteProjectModal = ({ project, onClose, onDelete }) => {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmText = "DELETE";
  const [typed, setTyped] = useState("");

  const handleDelete = async () => {
    if (!password.trim()) {
      setErr("Password is required");
      return;
    }
    setDeleting(true);
    setErr("");
    try {
      await onDelete(project._id, password);
      onClose();
    } catch (e) {
      setErr(e.message || "Incorrect password");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-red-700">Delete Project</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
          >
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 mb-4">
          This will <strong>permanently delete</strong> "{project.title}" along
          with all its tasks, team assignments, risks, and reports. This action
          cannot be undone.
        </div>

        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
          Type{" "}
          <span className="font-mono font-bold text-red-600">
            {confirmText}
          </span>{" "}
          to confirm
        </label>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmText}
          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
        />

        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
          Confirm your admin password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErr("");
          }}
          placeholder="Admin password"
          className={`w-full border rounded-xl px-3.5 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 ${
            err ? "border-red-300" : "border-slate-200"
          }`}
        />
        {err && <p className="text-xs text-red-500 mb-2">{err}</p>}

        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || typed !== confirmText}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
};
/* ── Page ─────────────────────────────────────────────────────────── */
export default function AdminProjectsPage() {
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
  } = useAllProjects(filterStatus ? { status: filterStatus } : {});
  const { employees } = useAllEmployees();

  const active = projects.filter((p) => p.status === "active").length;
  const onHold = projects.filter((p) => p.status === "on-hold").length;
  const completed = projects.filter((p) => p.status === "completed").length;

  return (
    <DashboardLayout title="Project Management">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Projects</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading
              ? "Loading…"
              : `${projects.length} total — ${active} active, ${onHold} on hold, ${completed} completed`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          <Icon name="plus" className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          {
            label: "Active",
            val: active,
            color: "bg-emerald-50 border-emerald-200 text-emerald-700",
          },
          {
            label: "On Hold",
            val: onHold,
            color: "bg-amber-50 border-amber-200 text-amber-700",
          },
          {
            label: "Completed",
            val: completed,
            color: "bg-slate-50 border-slate-200 text-slate-600",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border px-5 py-4 ${k.color}`}
          >
            <p className="text-2xl font-black">{loading ? "…" : k.val}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["", "active", "on-hold", "completed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}
          >
            {s === ""
              ? "All"
              : s === "on-hold"
                ? "On Hold"
                : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 h-52 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="folder" className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No projects yet</p>
          <p className="text-sm text-slate-400 mt-2">
            Create your first project to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              allEmployees={employees}
              onStatusChange={updateProject}
              onDelete={deleteProject}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          employees={employees}
          onClose={() => setShowCreate(false)}
          onCreate={createProject}
        />
      )}
    </DashboardLayout>
  );
}
