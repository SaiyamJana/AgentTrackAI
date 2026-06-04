import express from "express";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
const app = express();

app.use(cors());
app.use("/api/v1/users", userRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export { app };