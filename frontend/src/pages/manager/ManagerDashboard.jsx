import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/shared/StatCard";
import Icon from "../../components/shared/Icon";
import { useAuth } from "../../context/AuthContext";
import { useManagerProjects, useTaskList } from "../../hooks/useTasks";

const greet = () => { const h=new Date().getHours(); return h<12?"morning":h<17?"afternoon":"evening"; };
const FI = (p) => <Icon name="folder"      {...p}/>;
const CI = (p) => <Icon name="checkCircle" {...p}/>;
const LI = (p) => <Icon name="clock"       {...p}/>;
const WI = (p) => <Icon name="exclamation" {...p}/>;

const S_CFG = {
  active:    { badge:"bg-emerald-50 text-emerald-700", dot:"bg-emerald-500", bar:"bg-emerald-500" },
  "on-hold": { badge:"bg-amber-50 text-amber-700",     dot:"bg-amber-500",   bar:"bg-amber-400"  },
  completed: { badge:"bg-slate-100 text-slate-600",    dot:"bg-slate-400",   bar:"bg-slate-400"  },
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { projects, loading:pLoading } = useManagerProjects();

  // Load tasks for the first managed project
  const firstId = projects[0]?._id ?? "";
  const { tasks, stats, loading:tLoading } = useTaskList(firstId ? { projectId: firstId } : {});

  const activeProjects = projects.filter(p => p.status==="active").length;

  const quickLinks = [
    { label:"Reports",  icon:"report",   to:"/manager/reports",  cls:"bg-primary-light text-primary hover:bg-primary-light"     },
    { label:"Risks",    icon:"shield",   to:"/manager/risks",    cls:"bg-red-50 text-red-700 hover:bg-red-100"        },
    { label:"Workload", icon:"workload", to:"/manager/workload", cls:"bg-amber-50 text-amber-700 hover:bg-amber-100"  },
    { label:"Chatbot",  icon:"chat",     to:"/manager/chatbot",  cls:"bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  ];

  return (
    <DashboardLayout title="Manager Dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Good {greet()}, {user?.name?.split(" ")[0]} 👋</h2>
          <p className="text-sm text-slate-500 mt-1">
            {pLoading ? "Loading…" : projects.length === 0
              ? "No projects assigned yet. Contact your Admin."
              : `Managing ${activeProjects} active project${activeProjects!==1?"s":""}.`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickLinks.map(q => (
            <button key={q.label} onClick={() => navigate(q.to)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors ${q.cls}`}>
              <Icon name={q.icon} className="w-4 h-4"/>{q.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5 page-enter-delay-1">
        <StatCard label="Active Projects" value={pLoading?"…":activeProjects}     sub="you manage"        icon={FI} color="blue"   />
        <StatCard label="Completed Tasks" value={tLoading?"…":stats.completed}    sub="this sprint"       icon={CI} color="green"  />
        <StatCard label="In Progress"     value={tLoading?"…":stats.inProgress}   sub="currently active"  icon={LI} color="amber"  />
        <StatCard label="Overdue"         value={tLoading?"…":stats.overdue}      sub="need attention"    icon={WI} color={stats.overdue>0?"red":"slate"} />
      </div>

      {/* Projects list */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-5 page-enter-delay-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700">My Projects</h3>
          <button onClick={() => navigate("/manager/tasks")} className="text-xs text-primary font-semibold hover:text-primary-hover">Manage Tasks →</button>
        </div>

        {pLoading ? (
          [...Array(3)].map((_,i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse mb-3"/>)
        ) : projects.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Icon name="folder" className="w-6 h-6 text-slate-300"/>
            </div>
            <p className="text-sm font-semibold text-slate-500">No projects yet</p>
            <p className="text-xs text-slate-400 mt-1">Your Admin hasn't assigned you as manager on any project.</p>
          </div>
        ) : (
  <div className="space-y-3 content-fade-in">
    {projects.map(p => {
              const s   = S_CFG[p.status] ?? S_CFG.active;
              const prog = p.progressPercentage ?? 0;
              return (
                <div key={p._id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate("/manager/tasks")}>
                  <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
                    <Icon name="folder" className="w-4 h-4 text-primary"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.bar}`} style={{width:`${prog}%`}}/>
                      </div>
                      <span className="text-xs font-bold text-slate-500 shrink-0">{prog}%</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}/>{p.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent tasks */}
      {firstId && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 page-enter-delay-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">Recent Tasks — {projects[0]?.title}</h3>
            <button onClick={() => navigate("/manager/tasks")} className="text-xs text-primary font-semibold hover:text-primary-hover">View all →</button>
          </div>
          {tLoading ? (
            [...Array(3)].map((_,i) => <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse mb-2"/>)
          ) : tasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">No tasks yet. Go to Task Management to create the first task.</p>
              <button onClick={() => navigate("/manager/tasks")} className="mt-3 text-xs font-semibold text-primary hover:text-primary-hover">Create Task →</button>
            </div>
          ) : (
            <div className="space-y-2 content-fade-in">
              {tasks.slice(0,6).map(t => {
                const sc = {"pending":"bg-slate-100 text-slate-600","in-progress":"bg-primary-light text-primary","completed":"bg-emerald-50 text-emerald-700"};
                return (
                  <div key={t._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon name="task" className="w-4 h-4 text-slate-400"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{t.subManagerId?.name ?? "Unassigned"}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${sc[t.status]??sc.pending}`}>
                      {t.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
