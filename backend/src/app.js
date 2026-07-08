import express from "express";
import cors from "cors";

import userRouter            from "./routes/user.routes.js";
import companyRouter         from "./routes/company.routes.js";
import projectRouter         from "./routes/project.routes.js";
import employeeProjectRouter from "./routes/employeeProject.routes.js";
import taskRouter            from "./routes/task.routes.js";
import reportRouter          from "./routes/report.routes.js";
import analyticsRouter       from "./routes/analytics.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const API = `/${process.env.VERSION || "api/v1"}`;

// Routes
app.use(`${API}/users`,                       userRouter);
app.use(`${API}/companies`,                   companyRouter);
app.use(`${API}/projects`,                    projectRouter);
app.use(`${API}/projects/:projectId/employees`, employeeProjectRouter);
app.use(`${API}/tasks`,                       taskRouter);
app.use(`${API}/reports`,                     reportRouter);
app.use(`${API}/analytics`,                   analyticsRouter);

// Centralized error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

export { app };

//link :
//https://localhost:5000/api/v1/users/register
//https://localhost:5000/api/v1/users/login
