import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import { useMyProjects } from "../../hooks/useTasks";

const STATUS_CFG = {
  active:    { dot:"bg-emerald-500", badge:"bg-emerald-50 text-emerald-700" },
  "on-hold": { dot:"bg-amber-500",   badge:"bg-amber-50 text-amber-700"     },
  completed: { dot:"bg-slate-400",   badge:"bg-slate-100 text-slate-600"    },
};
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";

export default function ProjectsPage() {
  const { projects, loading, error } = useMyProjects();

  return (
    <DashboardLayout title="My Projects">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Projects</h2>
        <p className="text-sm text-slate-500 mt-1">Projects you have been assigned to by your Admin.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_,i) => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-44 animate-pulse"/>)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">{error}</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="folder" className="w-7 h-7 text-slate-300"/>
          </div>
          <p className="text-base font-bold text-slate-600">No projects yet</p>
          <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
            Your Admin hasn't assigned you to any projects yet.<br/>Check back later or contact your Admin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map(p => {
            const s    = STATUS_CFG[p.status] ?? STATUS_CFG.active;
            const prog = p.progressPercentage ?? 0;
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Icon name="folder" className="w-5 h-5 text-blue-600"/>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{p.title}</h3>
                      {p.description && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.description}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{p.status}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-400">Progress</span>
                    <span className="text-xs font-bold text-slate-600">{prog}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${prog>=75?"bg-emerald-500":prog>=40?"bg-blue-500":"bg-amber-400"}`}
                      style={{width:`${prog}%`}}/>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Icon name="users" className="w-3.5 h-3.5"/>
                    Manager: {p.managerId?.name ?? "—"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="calendar" className="w-3.5 h-3.5"/>
                    Ends {fmt(p.endDate)}
                  </span>
                </div>

                {p.priority && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                      ${p.priority==="high"?"bg-red-50 text-red-700 border-red-200":
                        p.priority==="medium"?"bg-amber-50 text-amber-700 border-amber-200":
                        "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {p.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
