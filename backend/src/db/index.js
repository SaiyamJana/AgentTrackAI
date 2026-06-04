import mongoose from 'mongoose';
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`, {
            serverSelectionTimeoutMS: 5000,   // Timeout after 5s if no server found
            socketTimeoutMS: 45000,           // Close sockets after 45s of inactivity
        });

        console.log(`MongoDB Connected !! DB_HOST: ${conn.connection.host}`);

        // Connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.error(` Mongoose connection error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('  Mongoose disconnected from DB');
        });

        // Graceful shutdown on app termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log(' MongoDB connection closed due to app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(` MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
