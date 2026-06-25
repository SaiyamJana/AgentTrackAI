/*
 * AIRecommendationsPanel
 * Renders the Gemini-generated aiSummary and aiRecommendations array
 * from a WorkloadSnapshot. Mirrors the styling of the Reports module's
 * AI output panel.
 */

export default function AIRecommendationsPanel({
  aiSummary         = "",
  aiRecommendations = [],
  usedAI            = false,
  calculatedAt      = null,
  isLoading         = false,
}) {
  if (isLoading) {
    return (
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-600 text-lg">✦</span>
          <span className="text-sm font-semibold text-blue-700">AI Analysis</span>
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-blue-200 rounded w-3/4" />
          <div className="h-3 bg-blue-200 rounded w-full" />
          <div className="h-3 bg-blue-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!aiSummary && !aiRecommendations.length) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
        <span className="text-slate-400 text-sm">
          No AI analysis yet. Trigger a recalculation to generate insights.
        </span>
      </div>
    );
  }

  const lastUpdated = calculatedAt
    ? new Date(calculatedAt).toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-blue-600 text-lg">✦</span>
          <span className="text-sm font-semibold text-blue-700">AI Workload Analysis</span>
          {usedAI && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              Gemini
            </span>
          )}
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-slate-400">{lastUpdated}</span>
        )}
      </div>

      {/* Summary */}
      {aiSummary && (
        <p className="text-sm text-slate-700 leading-relaxed mb-4">{aiSummary}</p>
      )}

      {/* Recommendations */}
      {aiRecommendations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
            Recommendations
          </p>
          <ul className="space-y-2">
            {aiRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 w-4 h-4 shrink-0 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
