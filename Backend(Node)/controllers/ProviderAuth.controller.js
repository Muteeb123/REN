import HelpProvider from "../Models/HelpProvider.model.js";

// ─────────────────────────────────────────────────────────────
// HELP PROVIDER: Sign up with email + password
// POST /api/provider/auth/signup
// Body: { email, password, name? }
// ─────────────────────────────────────────────────────────────
export const providerSignup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const existing = await HelpProvider.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        // Password is hashed automatically by the pre-save hook in the model
        const provider = await HelpProvider.create({ email, password, name });

        // Never return the password hash
        const { password: _pw, ...safeProvider } = provider.toObject();

        res.status(201).json({
            message: "Help provider account created successfully",
            provider: safeProvider,
        });
    } catch (error) {
        console.error("Provider Signup Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// HELP PROVIDER: Log in with email + password
// POST /api/provider/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
export const providerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const provider = await HelpProvider.findOne({ email });
        if (!provider) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        const isMatch = await provider.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const { password: _pw, ...safeProvider } = provider.toObject();

        res.status(200).json({
            message: "Login successful",
            provider: safeProvider,
        });
    } catch (error) {
        console.error("Provider Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};