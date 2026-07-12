import { generateText } from "./aiClient.service.js";

/*
 * Reporting Agent — uses Gemini to turn raw project/task data into a
 * polished, professional narrative report (daily / weekly / project summary).
 *
 * If GEMINI_API_KEY is not configured (or the call fails for any reason),
 * we fall back to a clean, deterministic, template-based summary so the
 * Reports feature keeps working without the AI layer.
 */
const REPORT_LABELS = {
  daily: "Daily Status Report",
  weekly: "Weekly Status Report",
  "project-summary": "Project Summary Report",
};

function buildPrompt({ reportType, project, metrics, tasksSnapshot }) {
  const label = REPORT_LABELS[reportType] ?? "Status Report";

  return `You are a senior project management assistant generating a formal status report for a software delivery team.

Write a "${label}" for the project "${project.title}".

Project context:
- Status: ${project.status}
- Priority: ${project.priority}
- Overall progress: ${metrics.progressPercentage}%
- Start date: ${project.startDate}
- End date: ${project.endDate}

Task metrics for this reporting period:
- Total tasks: ${metrics.totalTasks}
- Completed: ${metrics.completedTasks}
- In progress: ${metrics.inProgressTasks}
- Pending: ${metrics.pendingTasks}
- Overdue: ${metrics.overdueTasks}
- High priority open tasks: ${metrics.highPriorityOpen}

Recent task activity:
${tasksSnapshot}

Write the report in clear, professional business English using the following structure with markdown headings:

## Executive Summary
A short paragraph (3-5 sentences) summarizing overall project health and progress for this period.

## Key Highlights
3-5 bullet points covering notable completions, milestones, or wins.

## Risks & Concerns
2-4 bullet points covering overdue tasks, blockers, or risks (if none, state that no significant risks were identified).

## Recommendations
2-3 bullet points with concrete, actionable next steps for the project manager.

Keep it concise, factual, and free of filler. Do not include any preamble before "## Executive Summary" and do not add a closing signature.`;
}

function buildFallbackSummary({ reportType, project, metrics }) {
  const label = REPORT_LABELS[reportType] ?? "Status Report";
  const riskLine =
    metrics.overdueTasks > 0
      ? `- ${metrics.overdueTasks} task(s) are overdue and require immediate attention.`
      : `- No overdue tasks were identified during this period.`;

  return `## Executive Summary
${label} for "${project.title}". The project is currently ${project.status} with an overall progress of ${metrics.progressPercentage}%. Out of ${metrics.totalTasks} total tasks, ${metrics.completedTasks} have been completed, ${metrics.inProgressTasks} are in progress, and ${metrics.pendingTasks} are pending.

## Key Highlights
- ${metrics.completedTasks} task(s) completed to date.
- ${metrics.inProgressTasks} task(s) currently in progress.
- Overall project progress stands at ${metrics.progressPercentage}%.

## Risks & Concerns
${riskLine}
- ${metrics.highPriorityOpen} high-priority task(s) remain open.

## Recommendations
- Review overdue and high-priority tasks with the team during the next sync.
- Continue monitoring progress against the project end date of ${new Date(project.endDate).toLocaleDateString()}.
- Reassign workload if any team member appears blocked or overloaded.`;
}

/*
 * generateProjectReport — main entry point used by the controller.
 * Returns { summary: string, usedAI: boolean }
 */
export async function generateProjectReport({ reportType, project, metrics, tasksSnapshot }) {
  const prompt = buildPrompt({ reportType, project, metrics, tasksSnapshot });

  try {
    const text = await generateText(prompt);

    if (!text) {
      return { summary: buildFallbackSummary({ reportType, project, metrics }), usedAI: false };
    }

    return { summary: text, usedAI: true };
  } catch (err) {
    console.error("Reporting Agent (Groq) error:", err.message, err.cause);
    return { summary: buildFallbackSummary({ reportType, project, metrics }), usedAI: false };
  }
}