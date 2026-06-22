import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cron from "node-cron";
import connectDB from "./src/db/index.js";
import userRouter            from "./src/routes/user.routes.js";
import companyRouter         from "./src/routes/company.routes.js";
import projectRouter         from "./src/routes/project.routes.js";
import employeeProjectRouter from "./src/routes/employeeProject.routes.js";
import taskRouter            from "./src/routes/task.routes.js";
import riskRouter            from "./src/routes/risk.routes.js";
import notificationRouter    from "./src/routes/notification.routes.js";
import reportRouter          from "./src/routes/report.routes.js";
import analyticsRouter       from "./src/routes/analytics.routes.js";
import { runRiskAgent }      from "./src/agents/riskAgent.js";
import activityLogRouter from "./src/routes/activityLog.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Route mounts ──────────────────────────────────────────────────────────────
app.use("/api/v1/users", userRouter);
app.use("/api/v1/companies", companyRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1/projects/:id/employees", employeeProjectRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/risks", riskRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/activity-logs", activityLogRouter);

app.get("/", (req, res) => res.send("AgentTrack AI — Server Running"));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors:  err.errors || [],
    });
});

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // ── Risk Agent — runs every hour ─────────────────────────────────────
        cron.schedule("0 * * * *", async () => {
            console.log("[RiskAgent] Running scheduled scan...");
            try {
                const result = await runRiskAgent(); // null = scan all companies
                console.log("[RiskAgent] Scan complete:", result);
            } catch (err) {
                console.error("[RiskAgent] Scan failed:", err);
            }
        });
    })
    .catch((err) => {
        console.log("MongoDB Connection Failed:", err);
    });