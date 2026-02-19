// src/controllers/auth.controller.js
import User from "../Models/User.model.js";

// --- SIGNUP: Unified auth endpoint (create if not exists, or return existing user) ---
// This endpoint handles both login and signup flows:
// - New users: Created with personalized = false, redirected to Personalization page
// - Existing users: Returned with their personalized status
//   - If personalized = true: Redirected to MainTabs
//   - If personalized = false: Redirected to Personalization page
export const signup = async (req, res) => {
    try {
        const { email, token, name, age, refreshToken } = req.body;

        if (!email || !token) {
            return res.status(400).json({ message: "Email and token are required" });
        }

        // Check if the user already exists
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(200).json({
                message: "User already exists",
                user: existingUser,
            });
        }

        // Create a new user (personalized defaults to false)
        const newUser = await User.create({
            email,
            token,
            name,
            age,
            refreshToken,
        });

        res.status(201).json({
            message: "User created successfully",
            user: newUser,
        });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- LOGIN: Deprecated - Use signup endpoint instead (handles both login and signup) ---
// Kept for backward compatibility
export const login = async (req, res) => {

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Login successful",
            user,
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
