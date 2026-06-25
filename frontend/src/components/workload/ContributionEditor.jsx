import { useState, useEffect } from "react";
import { workloadAPI, taskAPI } from "../../utils/api";

/*
 * ContributionEditor
 * Modal that lets managers set contributionPercentage for each assignment
 * on a given task. Shows a running total so they know how much is left to assign.
 *
 * Props:
 *   taskId    — the task whose assignments to edit
 *   taskTitle — displayed in header
 *   isOpen    — boolean
 *   onClose   — callback
 *   onSaved   — callback after successful save
 */

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function ContributionEditor({ taskId, taskTitle, isOpen, onClose, onSaved }) {
  const [assignments, setAssignments] = useState([]);
  const [values, setValues]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!isOpen || !taskId) return;
    setError(null);
    setLoading(true);
    taskAPI.getAssignments(taskId)
      .then(res => {
        const data = res.data ?? [];
        setAssignments(data);
        // Pre-populate with existing values (null = equal split)
        const init = {};
        const count = data.length;
        data.forEach(a => {
          init[a._id] = a.contributionPercentage !== null && a.contributionPercentage !== undefined
            ? a.contributionPercentage
            : Math.round(100 / count);
        });
        setValues(init);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  const total = Object.values(values).reduce((s, v) => s + (Number(v) || 0), 0);
  const overAllocated = total > 100;
  const underAllocated = total < 100;

  function setEqual() {
    const count = assignments.length;
    if (!count) return;
    const share = Math.floor(100 / count);
    const remainder = 100 - share * count;
    const newVals = {};
    assignments.forEach((a, i) => {
      newVals[a._id] = share + (i === 0 ? remainder : 0);
    });
    setValues(newVals);
  }

  async function handleSave() {
    if (overAllocated) {
      setError("Total contributions exceed 100%. Please adjust before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        assignments.map(a =>
          workloadAPI.updateContribution(a._id, Number(values[a._id] ?? 0))
        )
      );
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800 text-base">Set Contributions</h2>
            {taskTitle && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{taskTitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500">Set how much of this task each person owns.</p>
                <button
                  onClick={setEqual}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Equal split
                </button>
              </div>

              {/* Total indicator */}
              <div className={`mb-4 flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold
                ${overAllocated ? "bg-red-50 text-red-700" : underAllocated ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                <span>Total assigned</span>
                <span>{total}%</span>
              </div>

              {/* Assignment rows */}
              <div className="space-y-3">
                {assignments.map(a => (
                  <div key={a._id} className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {initials(a.employeeId?.name ?? "?")}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {a.employeeId?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400">{a.status}</p>
                    </div>

                    {/* Number input */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={values[a._id] ?? ""}
                        onChange={e => setValues(prev => ({ ...prev, [a._id]: e.target.value }))}
                        className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1 text-sm font-semibold text-slate-700
                          focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      />
                      <span className="text-slate-400 text-sm">%</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || overAllocated}
            className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
          >
            {saving ? "Saving…" : "Save Contributions"}
          </button>
        </div>
      </div>
    </div>
  );
}
