import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import { useManagerProjects, useReports } from "../../hooks/useTasks";

/* ── helpers ─────────────────────────────────────────────────────── */
const TYPE_CFG = {
  daily:            { label: "Daily Report",   short: "Daily",   icon: "clock",    color: "bg-primary-light text-primary" },
  weekly:           { label: "Weekly Report",  short: "Weekly",  icon: "calendar", color: "bg-violet-50 text-violet-700" },
  "project-summary":{ label: "Project Summary", short: "Summary", icon: "report",  color: "bg-emerald-50 text-emerald-700" },
};

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/*
 * Tiny markdown renderer for the agent's output format:
 *   ## Heading
 *   - bullet
 *   paragraph text
 * Avoids pulling in a markdown dependency for a constrained, known format.
 */
function MarkdownReport({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let listBuf = [];

  const flushList = () => {
    if (listBuf.length) {
      blocks.push({ type: "list", items: [...listBuf] });
      listBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }
    if (line.startsWith("## ")) { flushList(); blocks.push({ type: "h2", text: line.slice(3) }); continue; }
    if (line.startsWith("# "))  { flushList(); blocks.push({ type: "h2", text: line.slice(2) }); continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) { listBuf.push(line.slice(2)); continue; }
    flushList();
    blocks.push({ type: "p", text: line });
  }
  flushList();

  const inline = (s) => {
    // Bold **text**
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-semibold text-slate-800">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.type === "h2") {
          return (
            <h4 key={i} className="text-sm font-bold text-slate-800 pt-2 first:pt-0 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-light0 shrink-0" />
              {b.text}
            </h4>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {b.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                  <span className="text-blue-400 mt-1.5 shrink-0">•</span>
                  <span>{inline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="text-sm text-slate-600 leading-relaxed">{inline(b.text)}</p>;
      })}
    </div>
  );
}

/* ── Report Detail Modal ─────────────────────────────────────────── */
const ReportModal = ({ report, onClose, onDelete }) => {
  const cfg = TYPE_CFG[report.reportType] ?? TYPE_CFG["project-summary"];
  const [deleting, setDeleting] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    try { await onDelete(report._id); onClose(); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color}`}>
              <Icon name={cfg.icon} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{report.title || cfg.label}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generated {fmtDateTime(report.generatedAt)}
                {report.generatedBy?.name ? ` by ${report.generatedBy.name}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center shrink-0">
            <Icon name="x" className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Metric strip */}
          {report.metrics && (
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { label: "Progress",  val: `${report.metrics.progressPercentage ?? 0}%` },
                { label: "Completed", val: report.metrics.completedTasks ?? 0 },
                { label: "In Progress", val: report.metrics.inProgressTasks ?? 0 },
                { label: "Overdue",    val: report.metrics.overdueTasks ?? 0 },
              ].map(m => (
                <div key={m.label} className="bg-slate-50 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-lg font-black text-slate-800">{m.val}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          )}

          <MarkdownReport text={report.summary} />
        </div>

        <div className="flex gap-3 p-5 pt-4 border-t border-slate-100 shrink-0">
          <button onClick={doDelete} disabled={deleting}
            className="px-4 py-2.5 rounded-xl border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete Report"}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Report Card ──────────────────────────────────────────────────── */
const ReportCard = ({ report, onOpen }) => {
  const cfg = TYPE_CFG[report.reportType] ?? TYPE_CFG["project-summary"];
  // First line of executive summary as preview
  const preview = (report.summary || "")
    .split("\n")
    .find(l => l.trim() && !l.trim().startsWith("#")) ?? "";

  return (
    <button onClick={() => onOpen(report)}
      className="w-full text-left bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-0.5 transition-all flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
        <Icon name={cfg.icon} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-800 truncate">{report.title || cfg.label}</p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ${cfg.color}`}>{cfg.short}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 truncate">{preview.replace(/\*\*/g, "")}</p>
        <p className="text-[10px] text-slate-400 mt-2">{fmtDateTime(report.generatedAt)}</p>
      </div>
      <Icon name="arrow" className="w-4 h-4 text-slate-300 shrink-0 mt-3" />
    </button>
  );
};

/* ── Page ─────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const { projects, loading: projectsLoading } = useManagerProjects();
  const [projectId, setProjectId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selected, setSelected] = useState(null);
  const [genType, setGenType] = useState("");
  const [genErr, setGenErr] = useState("");

  // Default to first project once loaded
  if (!projectId && !projectsLoading && projects.length > 0) {
    setProjectId(projects[0]._id);
  }

  const { reports, loading, error, generating, generateReport, deleteReport } =
    useReports(projectId, filterType);

  const handleGenerate = async (type) => {
    setGenType(type); setGenErr("");
    try {
      const report = await generateReport(type);
      setSelected(report);
    } catch (e) { setGenErr(e.message); }
    finally { setGenType(""); }
  };

  return (
    <DashboardLayout title="Reports">
  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 page-enter">
        <div>
          <h2 className="text-xl font-bold text-slate-800">AI-Generated Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Project summaries, daily and weekly status reports — generated by the Reporting Agent.
          </p>
        </div>

        {/* Project selector */}
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-400 min-w-50"
        >
          {projectsLoading ? (
            <option>Loading projects…</option>
          ) : projects.length === 0 ? (
            <option>No projects</option>
          ) : (
            projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)
          )}
        </select>
      </div>

      {genErr && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">{genErr}</div>
      )}

      {/* Generate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Object.entries(TYPE_CFG).map(([type, cfg]) => (
          <div key={type} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
              <Icon name={cfg.icon} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">{cfg.label}</p>
              <p className="text-xs text-slate-400">
                {type === "daily" ? "Last 24 hours" : type === "weekly" ? "Last 7 days" : "Full lifecycle"}
              </p>
            </div>
            <button
              onClick={() => handleGenerate(type)}
              disabled={!projectId || generating}
              className="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 shrink-0"
            >
              {generating && genType === type ? "Generating…" : "Generate"}
            </button>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["", "daily", "weekly", "project-summary"].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${filterType === t ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
            {t === "" ? "All Reports" : TYPE_CFG[t].label}
          </button>
        ))}
      </div>

      {/* Report list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white border border-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-4 rounded-2xl">{error}</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="report" className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No reports yet</p>
          <p className="text-sm text-slate-400 mt-2">Generate a daily, weekly, or project summary report to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => <ReportCard key={r._id} report={r} onOpen={setSelected} />)}
        </div>
      )}

      {selected && (
        <ReportModal report={selected} onClose={() => setSelected(null)} onDelete={deleteReport} />
      )}
    </DashboardLayout>
  );
}
