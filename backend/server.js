import dotenv from "dotenv";
dotenv.config();

import http    from "http";
import express from "express";
import cors    from "cors";
import cron    from "node-cron";
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
import workloadRouter        from "./src/routes/workload.routes.js";
import activityLogRouter     from "./src/routes/activityLog.routes.js";
import chatRouter            from "./src/routes/chat.routes.js";        // NEW
import { runRiskAgent }      from "./src/agents/riskAgent.js";
import { runWorkloadAgent, refreshEffortScores } from "./src/agents/workloadAgent.js";
import { initSocket, setIO } from "./src/socket/socket.js";             // NEW

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Must use explicit origin (not "*") so Socket.IO credentials work.
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const API = `/${process.env.VERSION || "api/v1"}`

// ── Route mounts ──────────────────────────────────────────────────────────────
app.use(`${API}/users`,              userRouter);
app.use(`${API}/companies`,          companyRouter);
app.use(`${API}/projects`,           projectRouter);
app.use(`${API}/projects/:id/employees`, employeeProjectRouter);
app.use(`${API}/tasks`,              taskRouter);
app.use(`${API}/risks`,              riskRouter);
app.use(`${API}/notifications`,      notificationRouter);
app.use(`${API}/reports`,            reportRouter);
app.use(`${API}/analytics`,          analyticsRouter);
app.use(`${API}/workloads`,          workloadRouter);
app.use(`${API}/activity-logs`,      activityLogRouter);
app.use(`${API}/chat`,               chatRouter);                       // NEW

app.get("/", (req, res) => res.send("AgentTrack AI — Server Running"));

// ── Static file serving for chat attachments ──────────────────────────────────
// Files are saved to src/uploads/chat/<companyId>/<filename> by chatUpload.middleware.js
// and referenced in Message.attachments.url as /uploads/chat/<companyId>/<filename>.
app.use("/uploads", express.static("src/uploads"));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    // Multer-specific errors (file too large, too many files, wrong field name)
    // arrive as MulterError instances — give a clearer message than the generic 500.
    if (err.name === "MulterError") {
        const message =
            err.code === "LIMIT_FILE_SIZE" ? "File exceeds the 15MB size limit" :
            err.code === "LIMIT_FILE_COUNT" ? "Too many files — max 5 per message" :
            err.message;
        return res.status(400).json({ success: false, message, errors: [] });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors:  err.errors || [],
    });
});

// ── HTTP server — shared between Express and Socket.IO ───────────────────────
// Previously: app.listen(PORT)
// Now:        httpServer.listen(PORT) so Socket.IO can attach to the same port.
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // ── Socket.IO init — must happen AFTER DB is connected ────────────────
        // Reason: socket event handlers query MongoDB, so the connection must
        // be established before any socket events can fire.
        const io = initSocket(httpServer);
        setIO(io); // make io accessible to REST controllers via getIO()

        // ── Risk Agent — runs every hour ──────────────────────────────────────
        cron.schedule("0 * * * *", async () => {
            console.log("[RiskAgent] Running scheduled scan...");
            try {
                const result = await runRiskAgent();
                console.log("[RiskAgent] Scan complete:", result);
            } catch (err) {
                console.error("[RiskAgent] Scan failed:", err);
            }
        });

        // ── Workload Agent — full snapshot, runs daily at 2 AM ────────────────
        cron.schedule("0 2 * * *", async () => {
            console.log("[WorkloadAgent] Running daily snapshot...");
            try {
                const result = await runWorkloadAgent(null, "scheduled");
                console.log("[WorkloadAgent] Snapshot complete:", result);
            } catch (err) {
                console.error("[WorkloadAgent] Snapshot failed:", err);
            }
        });

        // ── effortScore refresh — every 6 hours ───────────────────────────────
        cron.schedule("0 */6 * * *", async () => {
            console.log("[WorkloadAgent] Refreshing effort scores...");
            try {
                const result = await refreshEffortScores();
                console.log("[WorkloadAgent] effortScores refreshed:", result);
            } catch (err) {
                console.error("[WorkloadAgent] effortScore refresh failed:", err);
            }
        });
    })
    .catch((err) => {
        console.log("MongoDB Connection Failed:", err);
    });
