import { Task }    from "../models/Task.js";
import { Project } from "../models/Project.js";
import { Company } from "../models/Company.js";
import { Risk }    from "../models/risks.model.js";
import { Notification } from "../models/Notification.js";

/*
 * Helper — create a Risk + Notifications for its recipients.
 * recipients: array of userId strings (already deduped by caller)
 */
const createRiskAndNotify = async ({ projectId, taskId, companyId, category, riskLevel, reason, recommendation, recipients }) => {
    const risk = await Risk.create({
        projectId, taskId, companyId, category, riskLevel, reason, recommendation,
    });

    for (const userId of recipients) {
        await Notification.create({
            userId,
            companyId,
            type: "risk_detected",
            title: category === "delayed_project" ? "Project Overdue" : "Task Overdue",
            message: reason,
            relatedEntity: { type: "risk", id: risk._id },
            read: false,
        });
    }

    return { risk, notificationsCreated: recipients.length };
};

/*
 * ── Overdue Task Check ──────────────────────────────────────────────────
 * deadline < now AND status != "completed"
 */
const scanOverdueTasks = async (companyId, now) => {
    const taskFilter = {
        deadline: { $lt: now },
        status: { $ne: "completed" },
    };
    if (companyId) taskFilter.companyId = companyId;

    const overdueTasks = await Task.find(taskFilter).lean();

    let risksCreated = 0, notificationsCreated = 0, skipped = 0;

    for (const task of overdueTasks) {
        const existing = await Risk.findOne({ taskId: task._id, resolved: false });
        if (existing) { skipped++; continue; }

        const project = await Project.findById(task.projectId).lean();
        if (!project) continue;

        const daysOverdue = Math.floor((now - new Date(task.deadline)) / (1000 * 60 * 60 * 24));
        let riskLevel;
        if (daysOverdue >= 7)      riskLevel = "critical";
        else if (daysOverdue >= 3) riskLevel = "high";
        else if (daysOverdue >= 1) riskLevel = "medium";
        else                       riskLevel = "low";

        const reason = `Task "${task.title}" was due on ${new Date(task.deadline).toLocaleDateString()} and is still "${task.status}" — ${daysOverdue} day(s) overdue.`;
        const recommendation = daysOverdue >= 7
            ? "Reassign this task or escalate to project manager immediately."
            : daysOverdue >= 3
            ? "Follow up with the assigned employee and consider extending the deadline."
            : "Check in with the assigned employee on progress.";

        const recipients = new Set();
        recipients.add(task.assignedTo.toString());
        recipients.add(task.assignedBy.toString());
        recipients.add(project.managerId.toString());

        if (riskLevel === "critical") {
            const company = await Company.findById(task.companyId).lean();
            if (company?.adminId) recipients.add(company.adminId.toString());
        }

        const { notificationsCreated: n } = await createRiskAndNotify({
            projectId: task.projectId, taskId: task._id, companyId: task.companyId,
            category: "overdue_task", riskLevel, reason, recommendation,
            recipients: [...recipients],
        });

        risksCreated++;
        notificationsCreated += n;
    }

    return { tasksScanned: overdueTasks.length, risksCreated, notificationsCreated, skipped };
};

/*
 * ── Delayed Project Check ───────────────────────────────────────────────
 * endDate < now AND status != "completed"
 * Notifies: project.managerId, and admin if critical
 */
const scanDelayedProjects = async (companyId, now) => {
    const projectFilter = {
        endDate: { $lt: now },
        status: { $ne: "completed" },
    };
    if (companyId) projectFilter.companyId = companyId;

    const delayedProjects = await Project.find(projectFilter).lean();

    let risksCreated = 0, notificationsCreated = 0, skipped = 0;

    for (const project of delayedProjects) {
        // Skip if an unresolved "delayed_project" risk already exists for this project
        const existing = await Risk.findOne({ projectId: project._id, category: "delayed_project", resolved: false });
        if (existing) { skipped++; continue; }

        const daysOverdue = Math.floor((now - new Date(project.endDate)) / (1000 * 60 * 60 * 24));
        let riskLevel;
        if (daysOverdue >= 14)     riskLevel = "critical";
        else if (daysOverdue >= 7) riskLevel = "high";
        else if (daysOverdue >= 1) riskLevel = "medium";
        else                       riskLevel = "low";

        const reason = `Project "${project.title}" was due to end on ${new Date(project.endDate).toLocaleDateString()} and is still "${project.status}" (${project.progressPercentage ?? 0}% complete) — ${daysOverdue} day(s) overdue.`;
        const recommendation = daysOverdue >= 14
            ? "Escalate immediately — review project scope and resourcing with Admin."
            : daysOverdue >= 7
            ? "Review remaining tasks and consider extending the project timeline."
            : "Check overall project progress and address any blockers.";

        const recipients = new Set();
        recipients.add(project.managerId.toString());

        if (riskLevel === "critical" || riskLevel === "high") {
            const company = await Company.findById(project.companyId).lean();
            if (company?.adminId) recipients.add(company.adminId.toString());
        }

        const { notificationsCreated: n } = await createRiskAndNotify({
            projectId: project._id, taskId: null, companyId: project.companyId,
            category: "delayed_project", riskLevel, reason, recommendation,
            recipients: [...recipients],
        });

        risksCreated++;
        notificationsCreated += n;
    }

    return { projectsScanned: delayedProjects.length, risksCreated, notificationsCreated, skipped };
};

/*
 * Risk Agent — rule-based, no LLM.
 * Runs both overdue-task and delayed-project scans.
 *
 * @param {ObjectId} [companyId] — optional, scan only this company.
 * @returns {Object} combined summary of both scans
 */
export const runRiskAgent = async (companyId = null) => {
    const now = new Date();

    const taskResult    = await scanOverdueTasks(companyId, now);
    const projectResult = await scanDelayedProjects(companyId, now);

    return {
        scannedAt: now,
        tasks: taskResult,
        projects: projectResult,
        totalRisksCreated: taskResult.risksCreated + projectResult.risksCreated,
        totalNotificationsCreated: taskResult.notificationsCreated + projectResult.notificationsCreated,
    };
};