import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./src/db/index.js";
import userRouter from "./src/routes/user.routes.js";
import taskRouter from "./src/routes/task.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Server Running");
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/tasks", taskRouter);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB Connection Failed:", err);
    });
