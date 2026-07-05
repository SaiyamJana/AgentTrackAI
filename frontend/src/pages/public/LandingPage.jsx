import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "AI-Powered Insights",
    desc: "Automatic risk prediction and workload analysis at your fingertips.",
  },
  {
    title: "Real-Time Analytics",
    desc: "Live dashboards tracking project health and team productivity.",
  },
  {
    title: "Autonomous Agents",
    desc: "Reporting, risk, and workload agents working 24/7 for you.",
  },
  {
    title: "Team Chat",
    desc: "Real-time messaging scoped to your projects and tasks — no noise.",
  },
];

const Logo = ({ light }) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
      light ? "bg-white/20 backdrop-blur border-white/30" : "bg-blue-600 border-blue-600"
    }`}>
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
      AgentTrack<span className={light ? "text-blue-300" : "text-blue-600"}>AI</span>
    </span>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-5 border-b border-slate-100">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register-company"
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
          >
            Register your company
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 px-6 lg:px-12 py-20 lg:py-28">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-cyan-400 rounded-full opacity-10 blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold text-blue-200 tracking-widest uppercase mb-4">
            Autonomous Workforce Intelligence
          </p>
          <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6">
            Manage smarter.<br />
            <span className="text-blue-300">Ship faster.</span>
          </h1>
          <p className="text-blue-100/80 text-base lg:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            The AI-native platform that predicts risks, balances workloads, and keeps your entire team in sync — automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register-company"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-blue-800 bg-white hover:bg-blue-50 transition-colors shadow-lg"
            >
              Start your company workspace →
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur transition-colors"
            >
              Join with Secure Code
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">Why AgentTrack AI</p>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
            Everything your team needs, in one place.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            >
              <h3 className="text-sm font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA footer band */}
      <section className="bg-slate-900 px-6 lg:px-12 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">Ready to get started?</h2>
          <p className="text-slate-400 text-sm mb-7">
            Register your company in minutes, or join with the Secure Code your Admin shared.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register-company"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Register your company
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Logo />
        <p className="text-xs text-slate-400">Simplifying project and task management with AI.</p>
      </footer>
    </div>
  );
}