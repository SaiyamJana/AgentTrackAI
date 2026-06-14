import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import connectDB from "./db/index.js";
import { app } from "./app.js";



const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.error("❌ Express app error:", error);
            throw error;
        });

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port: ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    });
