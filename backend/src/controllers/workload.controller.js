import { Workload }        from "../models/workloads.model.js";
import { Task }            from "../models/Task.js";
import { TaskAssignment }  from "../models/TaskAssignment.js";
import { User }            from "../models/User.js";
import { Project }         from "../models/Project.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { Notification }    from "../models/Notification.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";
import {
  computePersonalHours,
  computeTeamMetrics,
} from "../services/workloadCalculation.service.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/*
 * getLatestSnapshot — latest WorkloadSnapshot for an employee.
 * Returns null if none exists yet.
 */
async function getLatestSnapshot(employeeId) {
  return Workload.findOne({ employeeId })
    .sort({ calculatedAt: -1 })
    .populate("employeeId", "name email department designation capacityHoursPerWeek")
    .lean();
}

/*
 * isProjectManagerOf — checks if userId is manager of projectId.
 * Admins always return true.
 */
async function isProjectManagerOf(userId, userRole, projectId) {
  if (userRole === "admin") return true;
  const ep = await EmployeeProject.findOne({
    projectId,
    employeeId: userId,
    projectRole: "manager",
    isActive: true,
  });
  return !!ep;
}

// ── GET /api/v1/workloads/me ──────────────────────────────────────────────────

/*
 * getMyWorkload
 * Any logged-in employee — their own latest snapshot + 14-day history.
 */
export const getMyWorkload = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;

  const latest = await getLatestSnapshot(employeeId);

  // 14-day history for the trend chart
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
  const history = await Workload.find({
    employeeId,
    calculatedAt: { $gte: fourteenDaysAgo },
  })
  .sort({ calculatedAt: 1 })
  .select("workloadScore burnoutRiskScore utilizationPct status calculatedAt")
  .lean();

  // Active assignments with task details for the priority queue
  const activeAssignments = await TaskAssignment.find({
    employeeId,
    status: { $ne: "completed" },
  })
  .populate({
    path: "taskId",
    populate: { path: "projectId", select: "title" },
  })
  .lean();

  const priorityQueue = activeAssignments
    .filter(a => a.taskId)
    .map(a => {
      const task = a.taskId;
      const daysLeft = Math.round((new Date(task.deadline) - Date.now()) / 86400000);
      return {
        taskId:                task._id,
        title:                 task.title,
        priority:              task.priority,
        complexityScore:       task.complexityScore ?? 5,
        effortScore:           task.effortScore ?? 5,
        deadline:              task.deadline,
        daysLeft,
        status:                a.status,
        completionPercentage:  a.completionPercentage,
        contributionPct:       a.contributionPercentage,
        estimatedPersonalHours:a.estimatedPersonalHours,
        project:               task.projectId,
        overdue:               daysLeft < 0,
      };
    })
    // Sort: overdue first, then by effortScore descending
    .sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      return (b.effortScore ?? 0) - (a.effortScore ?? 0);
    });

  // If AI gave us a suggested order, apply it
  const suggestedOrder = latest?.aiRecommendations ?? [];

  return res.status(200).json(new ApiResponse(200, {
    snapshot: latest,
    history,
    priorityQueue,
    aiSummary:         latest?.aiSummary ?? null,
    aiRecommendations: latest?.aiRecommendations ?? [],
  }, "Personal workload fetched"));
});

// ── GET /api/v1/workloads/team?projectId= ────────────────────────────────────

/*
 * getTeamWorkload
 * Manager: latest snapshot for every member of a specific project.
 */
export const getTeamWorkload = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  if (!projectId) throw new ApiError(400, "projectId query param is required");

  const canAccess = await isProjectManagerOf(req.user._id, req.user.role, projectId);
  if (!canAccess) throw new ApiError(403, "Only project manager or admin can view team workload");

  // Get all active project members
  const projectMembers = await EmployeeProject.find({
    projectId,
    isActive: true,
  }).populate("employeeId", "name email department designation capacityHoursPerWeek").lean();

  const memberSnapshots = await Promise.all(
    projectMembers.map(async (pm) => {
      const emp      = pm.employeeId;
      if (!emp) return null;
      const snapshot = await getLatestSnapshot(emp._id);
      return {
        employee:    emp,
        projectRole: pm.projectRole,
        snapshot,
      };
    })
  );

  const valid = memberSnapshots.filter(Boolean);
  const teamMetrics = computeTeamMetrics(valid.map(v => v.snapshot).filter(Boolean));

  const project = await Project.findById(projectId).select("title status progressPercentage").lean();

  return res.status(200).json(new ApiResponse(200, {
    project,
    teamMetrics,
    members: valid,
  }, "Team workload fetched"));
});

// ── GET /api/v1/workloads/company ────────────────────────────────────────────

/*
 * getCompanyWorkload
 * Admin only — latest snapshot for every employee in the company.
 */
export const getCompanyWorkload = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }

  const employees = await User.find({
    companyId: req.user.companyId,
    role: "employee",
    isActive: true,
  }).select("name email department designation capacityHoursPerWeek").lean();

  const snapshots = await Promise.all(
    employees.map(async (emp) => {
      const snapshot = await getLatestSnapshot(emp._id);
      return { employee: emp, snapshot };
    })
  );

  const teamMetrics = computeTeamMetrics(snapshots.map(s => s.snapshot).filter(Boolean));

  return res.status(200).json(new ApiResponse(200, {
    teamMetrics,
    employees: snapshots,
  }, "Company workload fetched"));
});

// ── GET /api/v1/workloads/employee/:employeeId ───────────────────────────────

/*
 * getEmployeeWorkload
 * Manager / Admin — detailed workload for a specific employee.
 */
export const getEmployeeWorkload = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  // Role check: admin always passes. Manager must share a project with the employee.
  if (req.user.role !== "admin") {
    const sharedProject = await EmployeeProject.findOne({
      employeeId: req.user._id,
      projectRole: "manager",
      isActive: true,
    });
    if (!sharedProject) throw new ApiError(403, "Manager access required");

    const empOnProject = await EmployeeProject.findOne({
      projectId: sharedProject.projectId,
      employeeId,
      isActive: true,
    });
    if (!empOnProject) throw new ApiError(403, "Employee is not in any of your managed projects");
  }

  const employee = await User.findById(employeeId)
    .select("name email department designation capacityHoursPerWeek")
    .lean();
  if (!employee) throw new ApiError(404, "Employee not found");

  const latest = await getLatestSnapshot(employeeId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const history = await Workload.find({
    employeeId,
    calculatedAt: { $gte: thirtyDaysAgo },
  })
  .sort({ calculatedAt: 1 })
  .select("workloadScore burnoutRiskScore utilizationPct status calculatedAt")
  .lean();

  return res.status(200).json(new ApiResponse(200, {
    employee,
    snapshot: latest,
    history,
  }, "Employee workload fetched"));
});

// ── GET /api/v1/workloads/alerts ─────────────────────────────────────────────

/*
 * getWorkloadAlerts
 * Manager/Admin — list of employees currently overloaded or at burnout risk.
 */
export const getWorkloadAlerts = asyncHandler(async (req, res) => {
  if (req.user.role === "employee") {
    // Employee can only see their own alert status
    const snap = await getLatestSnapshot(req.user._id);
    return res.status(200).json(new ApiResponse(200, {
      alerts: snap ? [snap] : [],
    }, "Workload alerts fetched"));
  }

  // Admin: all company employees
  // Manager: only their project members
  let employeeIds;
  if (req.user.role === "admin") {
    const employees = await User.find({
      companyId: req.user.companyId,
      role: "employee",
      isActive: true,
    }).select("_id").lean();
    employeeIds = employees.map(e => e._id);
  } else {
    const managedProjects = await EmployeeProject.find({
      employeeId: req.user._id,
      projectRole: "manager",
      isActive: true,
    }).distinct("projectId");

    const projectMembers = await EmployeeProject.find({
      projectId: { $in: managedProjects },
      isActive: true,
    }).distinct("employeeId");

    employeeIds = projectMembers;
  }

  // Latest snapshot for each, filter to alerts only
  const snapshots = await Promise.all(
    employeeIds.map(id => getLatestSnapshot(id))
  );

  const alerts = snapshots
    .filter(s => s && ["overloaded","critical","at-risk"].includes(s.status))
    .sort((a, b) => (b.workloadScore ?? 0) - (a.workloadScore ?? 0));

  return res.status(200).json(new ApiResponse(200, {
    alerts,
    totalAlerts: alerts.length,
  }, "Workload alerts fetched"));
});

// ── GET /api/v1/workloads/history ────────────────────────────────────────────

/*
 * getWorkloadHistory
 * Manager/Admin — snapshot history for an employee over N days.
 */
export const getWorkloadHistory = asyncHandler(async (req, res) => {
  const { employeeId, days = "30" } = req.query;
  if (!employeeId) throw new ApiError(400, "employeeId query param is required");

  // Auth: admin or manager of this employee
  if (req.user.role !== "admin" && req.user._id.toString() !== employeeId) {
    const sharedProject = await EmployeeProject.findOne({
      employeeId: req.user._id,
      projectRole: "manager",
      isActive: true,
    });
    if (!sharedProject) throw new ApiError(403, "Access denied");
  }

  const daysNum = Math.min(90, Math.max(1, parseInt(days, 10) || 30));
  const since   = new Date(Date.now() - daysNum * 86400000);

  const history = await Workload.find({
    employeeId,
    calculatedAt: { $gte: since },
  })
  .sort({ calculatedAt: 1 })
  .select("workloadScore burnoutRiskScore utilizationPct capacityScore status calculatedAt snapshotType")
  .lean();

  return res.status(200).json(new ApiResponse(200, { employeeId, days: daysNum, history }, "History fetched"));
});

// ── POST /api/v1/workloads/recalculate ───────────────────────────────────────

/*
 * triggerRecalculation
 * Manager/Admin — manually trigger a workload snapshot run.
 * Mirrors triggerRiskScan in risk.controller.js.
 */
export const triggerRecalculation = asyncHandler(async (req, res) => {
  const { runWorkloadAgent } = await import("../agents/workloadAgent.js");

  const companyId = req.user.companyId;
  const result    = await runWorkloadAgent(companyId, "manual");

  return res.status(200).json(new ApiResponse(200, result, "Workload recalculation complete"));
});

// ── PATCH /api/v1/workloads/assignments/:assignmentId/contribution ─────────────

/*
 * updateContribution
 * Manager/Admin — set contributionPercentage for a TaskAssignment.
 * Also recalculates estimatedPersonalHours.
 */
export const updateContribution = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { contributionPercentage } = req.body;

  if (contributionPercentage === undefined || contributionPercentage === null) {
    throw new ApiError(400, "contributionPercentage is required");
  }
  if (typeof contributionPercentage !== "number" || contributionPercentage < 0 || contributionPercentage > 100) {
    throw new ApiError(400, "contributionPercentage must be a number between 0 and 100");
  }

  const assignment = await TaskAssignment.findById(assignmentId).populate("taskId");
  if (!assignment) throw new ApiError(404, "Assignment not found");

  // Role check: must be manager of this task's project or admin
  const task = assignment.taskId;
  const canEdit = await isProjectManagerOf(req.user._id, req.user.role, task.projectId);
  if (!canEdit) throw new ApiError(403, "Only project manager or admin can set contribution percentages");

  // Check total contributions don't exceed 100 for this task (soft warning via response)
  const allAssignments = await TaskAssignment.find({ taskId: task._id, _id: { $ne: assignmentId } }).lean();
  const otherTotal = allAssignments.reduce((sum, a) => sum + (a.contributionPercentage ?? 0), 0);
  const willExceed = otherTotal + contributionPercentage > 100;

  assignment.contributionPercentage   = contributionPercentage;
  assignment.estimatedPersonalHours   = computePersonalHours(task.estimatedHours, contributionPercentage);
  await assignment.save();

  // Notify the employee about the contribution change
  await Notification.create({
    userId:    assignment.employeeId,
    companyId: req.user.companyId,
    type:      "workload_alert",
    title:     "Task Contribution Updated",
    message:   `Your contribution on task "${task.title}" has been set to ${contributionPercentage}%.`,
    relatedEntity: { type: "task", id: task._id },
    read: false,
  });

  return res.status(200).json(new ApiResponse(200, {
    assignment,
    warning: willExceed ? `Total contributions for this task now exceed 100% (${otherTotal + contributionPercentage}%).` : null,
  }, "Contribution updated"));
});

// ── PATCH /api/v1/workloads/capacity ─────────────────────────────────────────

/*
 * updateCapacity
 * Admin only — set capacityHoursPerWeek for an employee.
 */
export const updateCapacity = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") throw new ApiError(403, "Admin access required");

  const { employeeId, capacityHoursPerWeek } = req.body;
  if (!employeeId) throw new ApiError(400, "employeeId is required");
  if (!capacityHoursPerWeek || typeof capacityHoursPerWeek !== "number") {
    throw new ApiError(400, "capacityHoursPerWeek must be a number");
  }
  if (capacityHoursPerWeek < 1 || capacityHoursPerWeek > 80) {
    throw new ApiError(400, "capacityHoursPerWeek must be between 1 and 80");
  }

  const employee = await User.findOneAndUpdate(
    { _id: employeeId, companyId: req.user.companyId },
    { capacityHoursPerWeek },
    { new: true, runValidators: true }
  ).select("name email capacityHoursPerWeek");

  if (!employee) throw new ApiError(404, "Employee not found in your company");

  return res.status(200).json(new ApiResponse(200, employee, "Capacity updated"));
});
