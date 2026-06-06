import mongoose from 'mongoose';
import { DB_NAME } from "../../constants.js";

const connectDB = async () => {
    try {
        const fullURI = `${process.env.MONGO_URI}/${DB_NAME}`;

        const conn = await mongoose.connect(fullURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`MongoDB Connected !! DB_HOST: ${conn.connection.host}`);

        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`Mongoose connection error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('Mongoose disconnected from DB');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;