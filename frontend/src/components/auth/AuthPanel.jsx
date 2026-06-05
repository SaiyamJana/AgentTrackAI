export const AuthPanel = () => {
  const features = [
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
  ];

  return (
    <div className="hidden lg:flex flex-col justify-between h-full px-12 py-14 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900" />

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-[-80px] right-[-80px] w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-cyan-400 rounded-full opacity-10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300 rounded-full opacity-5 blur-3xl" />

      {/* Top: Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center border border-white/30">
            <svg viewBox="0 0 36 36" fill="none" className="w-6 h-6">
              <circle cx="18" cy="10" r="4" fill="white" fillOpacity="0.9" />
              <circle cx="10" cy="26" r="3" fill="white" fillOpacity="0.6" />
              <circle cx="26" cy="26" r="3" fill="white" fillOpacity="0.6" />
              <path d="M18 14 L10 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              <path d="M18 14 L26 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
              <path d="M13 20 L23 20" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">AgentTrack AI</span>
            <div className="text-[10px] text-blue-200 font-semibold tracking-widest uppercase">Autonomous Workforce Intelligence</div>
          </div>
        </div>
      </div>

      {/* Middle: Hero text */}
      <div className="relative z-10 space-y-6">
        <div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
            Manage smarter.<br />
            <span className="text-blue-300">Ship faster.</span>
          </h2>
          <p className="mt-4 text-blue-100/80 text-base leading-relaxed max-w-xs">
            The AI-native platform that predicts risks, balances workloads, and keeps your entire team in sync — automatically.
          </p>
        </div>

        {/* Feature pills */}
        <div className="space-y-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3.5"
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <div className="text-white font-semibold text-sm">{f.title}</div>
                <div className="text-blue-200/80 text-xs mt-0.5 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Product Vision */}
      <div className="relative z-10">
      <div>
        <div className="text-white text-sm font-semibold">
          AgentTrackAI
        </div>
        <div className="text-blue-300 text-xs">
          Simplifying project and task management with AI
        </div>
      </div>
      </div>
    </div>
  );
};
