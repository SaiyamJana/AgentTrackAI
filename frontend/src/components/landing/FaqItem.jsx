import { useState } from "react";
import Icon from "../shared/Icon";

const FaqItem = ({ question, answer, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
          {question}
        </span>
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-200 ${
            open ? "rotate-45 bg-blue-50 text-blue-600" : ""
          }`}
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-xs text-slate-500 leading-relaxed pb-5 pr-10">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaqItem;
