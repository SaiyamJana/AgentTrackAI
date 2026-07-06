import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/shared/Icon";
import FeatureCard from "../../components/landing/FeatureCard";
import FaqItem from "../../components/landing/FaqItem";
import ProductPreviewCard from "../../components/landing/ProductPreviewCard";
import AnalyticsPreviewCard from "../../components/landing/AnalyticsPreviewCard";
import WorkloadPreviewCard from "../../components/landing/WorkloadPreviewCard";
import RiskReportPreview from "../../components/landing/RiskReportPreview";

/* ────────────────────────────────────────────────────────────────
 * Content — every claim below maps to a real, implemented feature:
 * role-based routing (App.jsx guards), the employee/project/task
 * models, Socket.IO chat, the Gemini-powered workload & report
 * agents, and the risk-detection engine. Nothing here is aspirational.
 * ──────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "shield",
    title: "Role-Based Access Control",
    desc: "Admins run the company. Managers run projects. Employees run their tasks. Every screen adapts to who's looking at it.",
  },
  {
    icon: "folder",
    title: "Project & Task Management",
    desc: "Create projects, assign task-level managers, and track completion percentage automatically as work moves forward.",
  },
  {
    icon: "chat",
    title: "Real-Time Team Chat",
    desc: "Socket.IO-powered messaging scoped to your projects, with read receipts, typing indicators, and unread counts.",
  },
  {
    icon: "workload",
    title: "AI Workload Analysis",
    desc: "A Gemini-powered agent scores every teammate's workload and utilization, and flags burnout risk before it becomes a problem.",
  },
  {
    icon: "exclamation",
    title: "Risk Detection & Alerts",
    desc: "Overdue tasks, delayed projects, and overloaded teams are surfaced automatically and ranked by severity.",
  },
  {
    icon: "report",
    title: "AI-Generated Reports",
    desc: "Daily, weekly, and project-summary reports written by an AI agent that actually reads your task data.",
  },
  {
    icon: "chart",
    title: "Analytics & Insights",
    desc: "Time-windowed KPIs — today, 7 days, 90 days, or a custom range — on completion rate, cycle time, and more.",
  },
  {
    icon: "clock",
    title: "Activity Log",
    desc: "A running, auditable record of what changed across projects and tasks, so nothing happens in the dark.",
  },
];

const ROLES = [
  {
    badge: "admin",
    title: "Admin",
    subtitle: "Company-wide, user-level role",
    points: [
      "Onboard employees with a secure company code",
      "Create and oversee every project",
      "See company-wide analytics, workload, and risk",
    ],
  },
  {
    badge: "manager",
    title: "Manager",
    subtitle: "A project-level role, not a job title",
    points: [
      "Any employee can manage one project and contribute to another",
      "Assign task-level managers and team members",
      "Get AI reports and risk alerts scoped to their projects",
    ],
  },
  {
    badge: "employee",
    title: "Employee",
    subtitle: "Individual contributor, task-level",
    points: [
      "See exactly what's assigned and what's due",
      "Track personal workload and burnout risk",
      "Chat with the team without leaving the project",
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Register your company",
    desc: "Set up your workspace in minutes and receive a secure code for your team.",
  },
  {
    n: "02",
    title: "Invite your team",
    desc: "Employees join with the secure code. No manual account provisioning.",
  },
  {
    n: "03",
    title: "Assign roles & projects",
    desc: "Make anyone a project manager, assign task owners, and set things in motion.",
  },
  {
    n: "04",
    title: "Let the agents watch",
    desc: "AI keeps an eye on workload, risk, and reporting so your team can focus on the work.",
  },
];

const WHY_CHOOSE = [
  {
    icon: "cpu",
    title: "AI that reads your real data",
    desc: "Workload scores, burnout risk, and reports come from an agent that looks at actual tasks and hours — not guesses.",
  },
  {
    icon: "shield",
    title: "Roles built for real teams",
    desc: "Manager isn't a fixed job title here — it's assigned per project, the way work actually gets distributed.",
  },
  {
    icon: "chat",
    title: "Real-time by default",
    desc: "Chat, unread counts, and activity all update live over Socket.IO — no refreshing to see what happened.",
  },
  {
    icon: "chart",
    title: "One system, one source of truth",
    desc: "Tasks, projects, chat, analytics, and risk all live in the same data model instead of bolted-together tools.",
  },
];

const FAQS = [
  {
    q: "What is the Secure Code for?",
    a: "When an Admin registers a company, AgentTrack AI generates a Secure Code. Employees use that code to join the company workspace and register their own account — no manual invites needed.",
  },
  {
    q: "Can one person be a manager and a regular employee at the same time?",
    a: "Yes. Manager is a project-level role, not a fixed job title. The same employee can manage one project while simply contributing to another, and the UI adjusts automatically.",
  },
  {
    q: "Is the chat actually real-time?",
    a: "Yes — it runs on Socket.IO with JWT-authenticated connections, so messages, typing indicators, and unread counts update instantly without refreshing the page.",
  },
  {
    q: "How does the AI workload analysis work?",
    a: "A Gemini-powered agent looks at each person's active tasks, hours, and deadlines to calculate a workload score, utilization percentage, and burnout risk, then writes a short summary and recommendation.",
  },
  {
    q: "Where do risk alerts come from?",
    a: "Risks are detected automatically from your task and project data — overdue tasks, projects trending behind schedule, and overloaded teams — and ranked from low to critical.",
  },
];

const Logo = ({ light }) => (
  <Link to="/" className="flex items-center gap-2.5">
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
        light
          ? "bg-white/15 backdrop-blur border-white/25"
          : "bg-blue-600 border-blue-600"
      }`}
    >
      <svg viewBox="0 0 36 36" fill="none" className="w-5 h-5">
        <circle cx="18" cy="10" r="4" fill="white" fillOpacity="0.9" />
        <circle cx="10" cy="26" r="3" fill="white" fillOpacity="0.6" />
        <circle cx="26" cy="26" r="3" fill="white" fillOpacity="0.6" />
        <path d="M18 14 L10 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
        <path d="M18 14 L26 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
        <path d="M13 20 L23 20" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
      </svg>
    </div>
    <span className={`text-lg font-black tracking-tight ${light ? "text-white" : "text-slate-800"}`}>
      AgentTrack
      <span className={light ? "text-blue-300" : "text-blue-600"}>AI</span>
    </span>
  </Link>
);

// Sticky navbar — transparent over the hero, solid once scrolled past it.
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm py-3.5"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10">
        <Logo light={!scrolled} />
        <div className={`hidden md:flex items-center gap-8 text-sm font-semibold ${scrolled ? "text-slate-500" : "text-blue-100/90"}`}>
          <a href="#features" className={scrolled ? "hover:text-blue-700" : "hover:text-white"}>Features</a>
          <a href="#how-it-works" className={scrolled ? "hover:text-blue-700" : "hover:text-white"}>How it works</a>
          <a href="#faq" className={scrolled ? "hover:text-blue-700" : "hover:text-white"}>FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className={`text-sm font-semibold px-4 py-2.5 transition-colors ${
              scrolled ? "text-slate-600 hover:text-blue-700" : "text-blue-100 hover:text-white"
            }`}
          >
            Sign In
          </Link>
          <Link
            to="/register-company"
            className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg ${
              scrolled
                ? "text-white bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                : "text-blue-900 bg-white hover:bg-blue-50 shadow-black/10"
            }`}
          >
            Register your company
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-800 to-slate-950 pt-32 pb-28 lg:pt-40 lg:pb-32">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-30 -right-30 -w-105 h-105 bg-blue-400 rounded-full opacity-[0.12] blur-3xl" />
        <div className="absolute -bottom-35 -left-25 w-90 h-90 bg-cyan-400 rounded-full opacity-[0.1] blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-150 h-150 bg-blue-500 rounded-full opacity-[0.06] blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
            {/* Copy */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-100 tracking-widest uppercase mb-7 bg-white/10 border border-white/15 backdrop-blur px-4 py-2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Autonomous Workforce Intelligence
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight mb-6">
                Manage smarter.
                <br />
                <span className="bg-linear-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  Ship faster.
                </span>
              </h1>
              <p className="text-blue-100/75 text-lg leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                The AI-native project management platform that predicts risk,
                balances workload, and keeps your entire team in sync — automatically.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  to="/register-company"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-blue-900 bg-white hover:bg-blue-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5"
                >
                  Start your company workspace →
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur transition-all hover:-translate-y-0.5"
                >
                  Join with Secure Code
                </Link>
              </div>
            </div>

            {/* Live-product preview */}
            <div className="hidden lg:block relative">
              <div className="absolute -inset-6 bg-blue-400/10 rounded-4xl blur-2xl" />
              <div className="relative rotate-2 hover:rotate-0 transition-transform duration-500">
                <ProductPreviewCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature showcase ─────────────────────────────────────── */}
      <section id="features" className="px-6 lg:px-10 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
            Why AgentTrack AI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-4">
            Everything your team needs, in one place.
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            No bolted-together tools. Project management, team chat, and AI
            analysis all share the same data — so nothing falls out of sync.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── Dashboard / project & employee management preview ────── */}
      <section className="px-6 lg:px-10 py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <ProductPreviewCard />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
              Dashboard Preview
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-5">
              Every project and every person, at a glance.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-7">
              Admins see the whole company: every employee, every project, and
              who's active or inactive, in one dashboard. Create projects,
              assign task-level managers, and let task status update itself as
              completion percentage moves — no manual status flag to forget.
            </p>
            <ul className="space-y-3.5">
              {[
                "Company-wide view of employees and projects",
                "Task status derives automatically from completion progress",
                "Assign and reassign task owners without leaving the project",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="checkCircle" className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm text-slate-600">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Analytics overview ───────────────────────────────────── */}
      <section className="px-6 lg:px-10 py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
              Analytics Overview
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-5">
              KPIs for whatever window matters right now.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-7">
              Filter analytics by today, 7 days, 30 days, 90 days, overall, or
              a custom date range — and get completion rate, cycle time, and
              task breakdowns computed from that exact window, not the whole
              company history.
            </p>
            <ul className="space-y-3.5">
              {[
                "Time-windowed KPIs: completion rate, cycle time, overdue count",
                "Status and priority breakdowns for projects and tasks",
                "Available to admins, managers, and employees alike",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name="checkCircle" className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-sm text-slate-600">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <AnalyticsPreviewCard />
        </div>
      </section>

      {/* ── Role-based workflow ──────────────────────────────────── */}
      <section className="px-6 lg:px-10 py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
              Role-Based Workflow
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-4">
              Roles that match how your org actually works.
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Admin and Employee are company-level roles. Manager is a
              project-level role that any employee can hold — on one project,
              on several, or on none.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {ROLES.map((r) => (
              <div key={r.title} className="bg-white border border-slate-100 rounded-2xl p-7">
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-4 ${
                    r.badge === "admin"
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : r.badge === "manager"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {r.title}
                </span>
                <p className="text-xs text-slate-400 mb-5">{r.subtitle}</p>
                <ul className="space-y-3">
                  {r.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Risk & workload management ───────────────────────────── */}
      <section className="px-6 lg:px-10 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
            Risk & Workload Management
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-4">
            Catch burnout and delays before your team feels them.
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            A Gemini-powered agent scores workload and burnout risk per
            person, while a risk engine watches for overdue tasks, delayed
            projects, and overloaded teams — then writes the report for you.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <WorkloadPreviewCard />
          <RiskReportPreview />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 lg:px-10 py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
              How It Works
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
              From zero to a running workspace in four steps.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="bg-white border border-slate-100 rounded-2xl p-6 h-full">
                  <span className="text-3xl font-black text-blue-100 leading-none">{s.n}</span>
                  <h3 className="text-sm font-bold text-slate-800 mt-3 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 w-6 h-6 items-center justify-center text-blue-300">
                    <Icon name="arrow" className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose ───────────────────────────────────────────── */}
      <section className="px-6 lg:px-10 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
            Why Choose AgentTrack AI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
            Built AI-native, not AI-bolted-on.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {WHY_CHOOSE.map((w) => (
            <div key={w.title} className="flex gap-4 bg-white border border-slate-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Icon name={w.icon} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1.5">{w.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 lg:px-10 py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
              Questions, answered.
            </h2>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl px-6">
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} question={f.q} answer={f.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA + Footer ─────────────────────────────────── */}
      <footer className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 px-6 lg:px-10 pt-16 pb-10">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-20 right-1/4 w-75 h-75 bg-blue-600 rounded-full opacity-[0.1] blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 pb-12 border-b border-slate-800/80">
            <div className="text-center lg:text-left">
              <h2 className="text-xl lg:text-2xl font-black text-white mb-1.5 tracking-tight">
                Ready to run your team smarter?
              </h2>
              <p className="text-slate-400 text-xs">
                Register your company, or join with the Secure Code your Admin shared.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 transition-all"
              >
                Sign in
              </Link>
              <Link
                to="/register-company"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-950/50"
              >
                Register your company
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2">
              <Logo light />
              <p className="text-xs text-slate-500 mt-4 max-w-xs leading-relaxed">
                Simplifying project and task management with AI — role-based
                workflows, real-time chat, and agents that watch workload and
                risk so you don't have to.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                Product
              </p>
              <ul className="space-y-2.5 text-xs text-slate-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                Get started
              </p>
              <ul className="space-y-2.5 text-xs text-slate-500">
                <li><Link to="/register-company" className="hover:text-white transition-colors">Register your company</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Join with Secure Code</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign in</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Simplifying project and task management with AI</p>
            <p className="text-xs text-slate-600">© 2026 AgentTrack AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
