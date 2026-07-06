import Icon from "../shared/Icon";

// FeatureCard — used in the landing page feature showcase grid.
// Mirrors the card language already used across dashboards
// (white surface, border-slate-100, rounded-2xl) so the marketing
// page reads as the same product, just dressed up.
const FeatureCard = ({ icon, title, desc, tag }) => (
  <div className="group relative bg-white border border-slate-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-start justify-between mb-5">
      <div className="w-11 h-11 bg-blue-50 group-hover:bg-blue-600 rounded-xl flex items-center justify-center text-blue-600 group-hover:text-white transition-colors duration-300 shrink-0">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      {tag && (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full uppercase tracking-wide shrink-0">
          {tag}
        </span>
      )}
    </div>
    <h3 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

export default FeatureCard;
