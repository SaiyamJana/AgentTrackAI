const TypingIndicator = ({ name }) => (
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="flex items-center gap-1 bg-slate-100 rounded-2xl px-3 py-2">
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
    </div>
    {name && <span className="text-xs text-slate-400">{name} is typing...</span>}
  </div>
);

export default TypingIndicator;
