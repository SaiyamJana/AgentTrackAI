import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/users", userRouter);

export { app };

//link :
//https://localhost:5000/api/v1/users/register
//https://localhost:5000/api/v1/users/login