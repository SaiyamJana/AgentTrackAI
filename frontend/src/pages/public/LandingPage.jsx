import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "AI-Powered Insights",
    desc: "Automatic risk prediction and workload analysis at your fingertips.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
        />
      </svg>
    ),
  },
  {
    title: "Real-Time Analytics",
    desc: "Live dashboards tracking project health and team productivity.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    ),
  },
  {
    title: "Autonomous Agents",
    desc: "Reporting, risk, and workload agents working 24/7 for you.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M9 3.75v14.25M9 3.75L11.25 6M15 3.75v14.25M15 3.75L12.75 6"
        />
      </svg>
    ),
  },
  {
    title: "Team Chat",
    desc: "Real-time messaging scoped to your projects and tasks.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
  },
];

const Logo = ({ light }) => (
  <div className="flex items-center gap-2.5">
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
        <path
          d="M18 14 L10 23"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.7"
          strokeLinecap="round"
        />
        <path
          d="M18 14 L26 23"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.7"
          strokeLinecap="round"
        />
        <path
          d="M13 20 L23 20"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
    <span
      className={`text-lg font-black tracking-tight ${light ? "text-white" : "text-slate-800"}`}
    >
      AgentTrack
      <span className={light ? "text-blue-300" : "text-blue-600"}>AI</span>
    </span>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — fills exactly one viewport */}
      <section className="relative h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950">
        {/* Decorative layers */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-[-120px] right-[-120px] w-[420px] h-[420px] bg-blue-400 rounded-full opacity-[0.12] blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-100px] w-[360px] h-[360px] bg-cyan-400 rounded-full opacity-[0.1] blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500 rounded-full opacity-[0.06] blur-3xl" />

        {/* Nav */}
        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between px-6 lg:px-14 py-7 shrink-0">
          <Logo light />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-blue-100 hover:text-white px-4 py-2.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register-company"
              className="text-sm font-bold text-blue-900 bg-white hover:bg-blue-50 px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-black/10"
            >
              Register your company
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-100 tracking-widest uppercase mb-7 bg-white/10 border border-white/15 backdrop-blur px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Autonomous Workforce Intelligence
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6 max-w-4xl">
            Manage smarter.
            <br />
            <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
              Ship faster.
            </span>
          </h1>
          <p className="text-blue-100/75 text-lg leading-relaxed max-w-xl mb-10">
            The AI-native platform that predicts risks, balances workloads, and
            keeps your entire team in sync automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
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

        {/* Scroll cue */}
        <div className="relative z-10 flex justify-center pb-8 shrink-0">
          <div className="flex flex-col items-center gap-2 text-blue-200/50">
            <span className="text-[10px] font-semibold tracking-widest uppercase">
              Explore features
            </span>
            <svg
              className="w-4 h-4 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-14 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-3">
            Why AgentTrack AI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight">
            Everything your team needs, in one place.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white border border-slate-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="w-11 h-11 bg-blue-50 group-hover:bg-blue-600 rounded-xl flex items-center justify-center text-blue-600 group-hover:text-white mb-5 transition-colors duration-300">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                {f.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA + Footer */}
      {/* Closing CTA + Footer */}
<footer className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-6 lg:px-14 py-12">
  <div
    className="absolute inset-0 opacity-[0.04]"
    style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
      backgroundSize: "48px 48px",
    }}
  />
  <div className="absolute top-[-80px] right-1/4 w-[300px] h-[300px] bg-blue-600 rounded-full opacity-[0.1] blur-3xl" />

  <div className="relative z-10 max-w-6xl mx-auto">
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
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

    <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <Logo light />
      <p className="text-xs text-slate-500">Simplifying project and task management with AI</p>
      <p className="text-xs text-slate-600">© 2026 AgentTrack AI</p>
    </div>
  </div>
</footer>
    </div>
  );
}
