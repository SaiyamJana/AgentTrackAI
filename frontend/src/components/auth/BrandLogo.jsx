export const BrandLogo = ({ size = "md" }) => {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-xl", sub: "text-xs" },
    md: { icon: "w-11 h-11", text: "text-2xl", sub: "text-xs" },
    lg: { icon: "w-14 h-14", text: "text-3xl", sub: "text-sm" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      {/* Icon mark */}
      <div className={`${s.icon} relative flex-shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg shadow-blue-200" />
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Abstract "AT" circuit-style mark */}
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
            <circle cx="18" cy="10" r="4" fill="white" fillOpacity="0.9" />
            <circle cx="10" cy="26" r="3" fill="white" fillOpacity="0.6" />
            <circle cx="26" cy="26" r="3" fill="white" fillOpacity="0.6" />
            <path d="M18 14 L10 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
            <path d="M18 14 L26 23" stroke="white" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
            <path d="M13 20 L23 20" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div>
        <div className={`${s.text} font-black text-slate-800 leading-none tracking-tight`}>
          Agent<span className="text-blue-600">Track</span>
        </div>
        <div className={`${s.sub} text-slate-400 font-medium tracking-widest uppercase mt-0.5`}>
          AI Platform
        </div>
      </div>
    </div>
  );
};
