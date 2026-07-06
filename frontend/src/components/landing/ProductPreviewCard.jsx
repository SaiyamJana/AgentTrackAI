import Icon from "../shared/Icon";

// ProductPreviewCard — a static "browser frame" mock of the actual
// AgentTrack AI dashboard, built from the same tokens as the real
// DashboardLayout/Sidebar/StatCard/Badge components. This is not a
// screenshot — it's a lightweight recreation so the landing page never
// depends on captured product images, but still shows real UI, real
// copy, and real color semantics instead of generic hero art.
const NAV_ITEMS = [
  { icon: "home", label: "Dashboard", active: true },
  { icon: "users", label: "Employees" },
  { icon: "folder", label: "Projects" },
  { icon: "chart", label: "Analytics" },
  { icon: "workload", label: "Workload" },
  { icon: "chat", label: "Messages" },
];

const EMPLOYEES = [
  { name: "Aditi Rao", role: "Manager", status: "active" },
  { name: "Rohan Mehta", role: "Employee", status: "active" },
  { name: "Sana Iqbal", role: "Employee", status: "at-risk" },
];

const STATUS_STYLE = {
  active: "bg-emerald-50 text-emerald-700",
  "at-risk": "bg-amber-50 text-amber-700",
};

export default function ProductPreviewCard({ className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10 overflow-hidden select-none ${className}`}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
        <div className="flex-1 flex justify-center">
          <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded-full px-4 py-1">
            app.agenttrack.ai/admin/dashboard
          </span>
        </div>
      </div>

      <div className="flex h-90">
        {/* Mini sidebar */}
        <div className="hidden sm:flex w-40 shrink-0 border-r border-slate-100 flex-col py-4 px-2.5 bg-white">
          <div className="flex items-center gap-2 px-1.5 mb-4">
            <div className="w-6 h-6 bg-linear-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
            </div>
            <span className="text-[11px] font-black text-slate-800 tracking-tight">
              AgentTrack<span className="text-blue-600">AI</span>
            </span>
          </div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10.5px] font-medium ${
                  item.active
                    ? "bg-blue-600 text-white"
                    : "text-slate-500"
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`w-3.5 h-3.5 shrink-0 ${item.active ? "text-white" : "text-slate-400"}`}
                />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 sm:p-5 overflow-hidden bg-slate-50/60">
          <div className="mb-4">
            <p className="text-[13px] font-bold text-slate-800">Good morning, Aditi 👋</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Here's your company overview.</p>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              { label: "Employees", value: "24", color: "blue" },
              { label: "Active Projects", value: "7", color: "green" },
              { label: "Open Risks", value: "3", color: "amber" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-slate-100 p-2.5"
              >
                <div className="text-base font-bold text-slate-800 leading-none">
                  {s.value}
                </div>
                <div className="text-[9.5px] font-medium text-slate-400 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Employee table card */}
          <div className="bg-white rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10.5px] font-bold text-slate-700">Team</span>
              <span className="text-[9.5px] text-blue-600 font-semibold">Manage</span>
            </div>
            <div className="space-y-2">
              {EMPLOYEES.map((e) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-700 shrink-0">
                      {e.name.charAt(0)}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 truncate">
                      {e.name}
                    </span>
                  </div>
                  <span
                    className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[e.status]}`}
                  >
                    {e.status === "at-risk" ? "At Risk" : "Active"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
