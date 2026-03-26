import User from "../Models/User.model.js";
import HelpProvider from "../Models/HelpProvider.model.js";
import { generateRandomPassword } from "../utils/Passwordhelper.js";
import { sendHelpProviderCredentials } from "../utils/Emailservice.js";

// ─────────────────────────────────────────────────────────────────────────────
// INVITE HELP PROVIDER
// Called by a logged-in help seeker from inside the app.
//
// POST /api/help-provider/invite
// Body: { helpSeekerUserId, email, name? }
//
// Flow:
//   1. Confirm the helpSeekerUserId belongs to a real User
//   2. Check email isn't already a User or HelpProvider
//   3. Generate a random password & create HelpProvider account
//   4. Email credentials to the provider
// ─────────────────────────────────────────────────────────────────────────────
export const inviteHelpProvider = async (req, res) => {
    try {
        const { helpSeekerUserId, email, name } = req.body;

        if (!helpSeekerUserId || !email) {
            return res.status(400).json({
                message: "helpSeekerUserId and email are required",
            });
        }

        console.log("email and helpseeker id recieved.");
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please provide a valid email address" });
        }

        // Confirm the help seeker exists in the User collection
        const helpSeeker = await User.findById(helpSeekerUserId);
        if (!helpSeeker) {
            return res.status(404).json({ message: "Help seeker not found" });
        }

        console.log("Help seeker found:", helpSeeker.email);

        // Make sure this email isn't already registered as a User or HelpProvider
        const emailLower = email.toLowerCase();
        const existingUser = await User.findOne({ email: emailLower });
        const existingProvider = await HelpProvider.findOne({ email: emailLower });

        if (existingUser || existingProvider) {
            return res.status(409).json({
                message: "A user with this email already exists",
            });
        }

        // Generate password, create account (password hashed by pre-save hook)
        const plainPassword = generateRandomPassword();

        const helpProvider = await HelpProvider.create({
            email: emailLower,
            name: name || undefined,
            password: plainPassword,
            invitedBy: helpSeekerUserId,
        });

        // Email credentials to the provider
        await sendHelpProviderCredentials(email, plainPassword);

        res.status(201).json({
            message: `Help provider account created. Credentials sent to ${email}.`,
            helpProvider: {
                id: helpProvider._id,
                name: helpProvider.name,
                email: helpProvider.email,
                invitedBy: helpProvider.invitedBy,
            },
        });
    } catch (error) {
        console.error("Invite Help Provider Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELP PROVIDER LOGIN
// Password-based login using credentials received via email.
//
// POST /api/help-provider/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────────────────────
export const helpProviderLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const provider = await HelpProvider.findOne({ email: email.toLowerCase() });

        // Use a generic message to avoid leaking whether the email exists
        if (!provider) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (!provider.isActive) {
            return res.status(403).json({ message: "Your account has been deactivated" });
        }

        const isMatch = await provider.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({
            message: "Login successful",
            helpProvider: {
                id: provider._id,
                name: provider.name,
                email: provider.email,
                invitedBy: provider.invitedBy,
            },
        });
    } catch (error) {
        console.error("Help Provider Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};