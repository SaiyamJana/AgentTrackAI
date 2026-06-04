import express from "express";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/users", userRouter);

export { app };

//link :
//https://localhost:5000/api/v1/users/register
//https://localhost:5000/api/v1/users/login