import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./src/db/index.js";
import userRouter from "./src/routes/user.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server Running");
});

app.use("/api/users", userRouter);

const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB Connection Failed:", err);
    });