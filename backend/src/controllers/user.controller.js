import { User } from "../models/User.js";

export const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            department,
            designation
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            department,
            designation
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};


export const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isPasswordValid =
            await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        const accessToken =
            user.generateAccessToken();

        const refreshToken =
            user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};