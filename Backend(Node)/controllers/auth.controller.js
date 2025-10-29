// src/controllers/auth.controller.js
import User from "../Models/User.model.js";

// --- SIGNUP: store Reddit user (create if not exists) ---
export const signup = async (req, res) => {
    try {
        const { email, token, name, age } = req.body;

        if (!email || !token) {
            return res.status(400).json({ message: "Email and token are required" });
        }

        // Check if the user already exists
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(200).json({
                message: "User already exists (logged in)",
                user: existingUser,
            });
        }

        // Create a new user
        const newUser = await User.create({
            email,
            token,
            name,
            age,
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

// --- LOGIN: find Reddit user using email ---
export const login = async (req, res) => {
    console.log("Login request received:", req.body);
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
