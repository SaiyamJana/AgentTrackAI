import { Report }          from "../models/reports.model.js";
import { Project }         from "../models/Project.js";
import { Task }            from "../models/Task.js";
import { EmployeeProject } from "../models/EmployeeProject.js";
import { ApiError }        from "../utils/ApiError.js";
import { ApiResponse }     from "../utils/ApiResponse.js";
import { asyncHandler }    from "../utils/asyncHandler.js";
import { generateProjectReport } from "../services/reportingAgent.service.js";

// Returns the caller's projectRole, or "admin" for admins, or null if not assigned
async function getProjectRole(userId, userRole, projectId) {
  if (userRole === "admin") return "admin";
  const ep = await EmployeeProject.findOne({ projectId, employeeId: userId, isActive: true });
  return ep ? ep.projectRole : null;
}

function periodRange(reportType) {
  const now = new Date();
  if (reportType === "daily") {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    return { periodStart: start, periodEnd: now };
  }
  if (reportType === "weekly") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { periodStart: start, periodEnd: now };
  }
  // project-summary — whole project lifetime
  return { periodStart: null, periodEnd: now };
}

async function computeMetrics(project, periodStart) {
  const filter = { projectId: project._id };
  if (periodStart) filter.updatedAt = { $gte: periodStart };

  const allTasks = await Task.find({
    projectId: project._id
  }).lean();

  const periodTasks = periodStart ? allTasks.filter( t => new Date(t.updatedAt) >= periodStart) : allTasks;

  const now = Date.now();
  const totalTasks        = allTasks.length;
  const completedTasks    = allTasks.filter(t => t.status === "completed").length;
  const inProgressTasks   = allTasks.filter(t => t.status === "in-progress").length;
  const pendingTasks      = allTasks.filter(t => t.status === "pending").length;
  const overdueTasks      = allTasks.filter(t => t.status !== "completed" && new Date(t.deadline) < now).length;
  const highPriorityOpen  = allTasks.filter(t => t.priority === "high" && t.status !== "completed").length;

  return {
    metrics: {
      progressPercentage: project.progressPercentage ?? 0,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      highPriorityOpen,
    },
    periodTasks,
  };
}

function tasksToSnapshot(tasks) {
  if (!tasks.length) return "No task updates recorded in this period.";
  return tasks
    .slice(0, 15)
    .map(t => `- "${t.title}" — status: ${t.status}, priority: ${t.priority}, progress: ${t.completionPercentage ?? 0}%`)
    .join("\n");
}

// POST /api/v1/reports/generate  (admin / manager / sub-manager)
// body: { projectId, reportType: "daily" | "weekly" | "project-summary" }
export const generateReport = asyncHandler(async (req, res) => {
  const { projectId, reportType } = req.body;

  if (!projectId || !reportType)
    throw new ApiError(400, "projectId and reportType are required");

  if (!["daily", "weekly", "project-summary"].includes(reportType))
    throw new ApiError(400, "reportType must be one of: daily, weekly, project-summary");

  const role = await getProjectRole(req.user._id, req.user.role, projectId);

  const project = await Project.findById(projectId).lean();
  if (!project) throw new ApiError(404, "Project not found");

  //role check
  let canGenerate = role === "admin" || role === "manager";

  if(!canGenerate){
    //if the user is a sub-manager
    const managesAnyTask = await Task.exists({
      projectId,
      subManagerId: req.user._id,
    });

    canGenerate = !!managesAnyTask;
  }

  if(!canGenerate){
    throw new ApiError(403, "Access denied: insufficient permissions to generate report for this project");
  }

  const { periodStart, periodEnd } = periodRange(reportType);
  const { metrics, periodTasks } = await computeMetrics(project, periodStart);
  const tasksSnapshot = tasksToSnapshot(periodTasks);

  const { summary, usedAI } = await generateProjectReport({
    reportType,
    project,
    metrics,
    tasksSnapshot,
  });

  const titleMap = {
    daily: "Daily Status Report",
    weekly: "Weekly Status Report",
    "project-summary": "Project Summary Report",
  };

  const report = await Report.create({
    projectId,
    companyId:  req.user.companyId,
    reportType,
    title:      `${titleMap[reportType]} — ${project.title}`,
    summary,
    metrics,
    generatedBy: req.user._id,
    periodStart,
    periodEnd,
  });

  const populated = await Report.findById(report._id)
    .populate("projectId",   "title status")
    .populate("generatedBy", "name email")
    .lean();

  return res.status(201).json(new ApiResponse(201, { ...populated, usedAI }, "Report generated successfully"));
});

// GET /api/v1/reports?projectId=&reportType=  (admin / manager / sub-manager)
export const getReports = asyncHandler(async (req, res) => {
  const { projectId, reportType } = req.query;
  if (!projectId) throw new ApiError(400, "projectId query param is required");

  const role = await getProjectRole(req.user._id, req.user.role, projectId);
  let hasAccess = role === "admin" || role === "manager";

  if(!hasAccess){
    //if the user is a sub-manager
    const managesAnyTask = await Task.exists({
      projectId,
      subManagerId: req.user._id,
    });

    hasAccess = !!managesAnyTask;
  }

  if(!hasAccess){
    throw new ApiError(403, "Access denied: insufficient permissions to view reports for this project");
  }

  const filter = { projectId };
  if (reportType) filter.reportType = reportType;

  const reports = await Report.find(filter)
    .populate("projectId",   "title status")
    .populate("generatedBy", "name email")
    .sort({ generatedAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, reports, "Reports fetched"));
});

// GET /api/v1/reports/:id  (admin / manager / sub-manager of that project)
export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate("projectId",   "title status")
    .populate("generatedBy", "name email")
    .lean();
  if (!report) throw new ApiError(404, "Report not found");

  const projectId = report.projectId?._id || report.projectId;
  
  const role = await getProjectRole(req.user._id , req.user.role, projectId);

  let hasAccess = role === "admin" || role === "manager";

  if(!hasAccess){
    //if the user is a sub-manager
    const managesAnyTask = await Task.exists({
      projectId,
      subManagerId: req.user._id,
    });

    hasAccess = !!managesAnyTask;
  }

  if(!hasAccess){
    throw new ApiError(403, "Access denied: insufficient permissions to view this report");
  }

  return res.status(200).json(new ApiResponse(200, report, "Report fetched"));
});

// DELETE /api/v1/reports/:id  (admin / manager / sub-manager of that project)
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, "Report not found");

  const projectId = report.projectId?._id || report.projectId;
  const role = await getProjectRole(req.user._id , req.user.role, projectId);
  let hasAccess = role === "admin" || role === "manager";

  if(!hasAccess){
    //if the user is a sub-manager
    const managesAnyTask = await Task.exists({
      projectId,
      subManagerId: req.user._id,
    });

    hasAccess = !!managesAnyTask;

  }
  if(!hasAccess){
    throw new ApiError(403, "Access denied: insufficient permissions to delete this report");
  }

  await Report.findByIdAndDelete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, "Report deleted"));
});
