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
        const { helpSeekerUserId, email } = req.body;

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

        console.log("Help seeker's provider found!", helpSeeker.helpContactEmail);

        //one help seeker can only have one provider, so if they already have a provider assigned, we should not allow them to create another one. This is to prevent confusion and ensure that the help seeker has a clear point of contact for their needs.
        if (helpSeeker.helpContactEmail) {
            return res.status(409).json({
                message: "You already have a help provider assigned. Only one provider is allowed per help seeker.",
            });
        }

        // Make sure this email isn't already registered as a User or HelpProvider
        //checking if the email entered is already registered as a user. there can be more than one provider
        const emailLower = email.toLowerCase();
        const existingUser = await User.findOne({ email: emailLower });

        if (existingUser) {
            return res.status(409).json({
                message: "A help seeker with this email already exists",
            });
        }

        // Generate password, create account (password hashed by pre-save hook)
        const plainPassword = generateRandomPassword();

        // ← WRAP all three in a try/catch so any failure is fully atomic
        try {
            await sendHelpProviderCredentials(email, plainPassword);

            console.log("Email sent successfully to", email);

            const helpProvider = await HelpProvider.create({
                email: emailLower,

                password: plainPassword,
                invitedBy: helpSeekerUserId,
            });

            await User.findByIdAndUpdate(helpSeekerUserId, {
                helpContactEmail: emailLower,
            });

            return res.status(201).json({
                message: `Help provider account created. Credentials sent to ${email}.`,
                helpProvider: {
                    id: helpProvider._id,
                    name: helpProvider.name,
                    email: helpProvider.email,
                    invitedBy: helpProvider.invitedBy,
                },
            });
        } catch (operationError) {
            // Rollback: delete the provider doc if it was created before the failure
            await HelpProvider.findOneAndDelete({ email: emailLower });

            // Rollback: clear helpContactEmail on the seeker if it was set
            await User.findByIdAndUpdate(helpSeekerUserId, {
                $unset: { helpContactEmail: "" },
            });

            console.error("Invite operation failed, changes rolled back:", operationError);
            return res.status(500).json({
                message: "Failed to complete invitation. No changes were made.",
                error: operationError.message,
            });
        }
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
                passwordChanged: provider.passwordChanged,
            },
        });
    } catch (error) {
        console.error("Help Provider Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PASSWORD FOR HELP PROVIDER
// Updates password on first login (when passwordChanged is false).
//
// POST /api/auth/update-password
// Body: { userId, newPassword }
//
// Flow:
//   1. Validate userId and newPassword are provided
//   2. Find HelpProvider by userId
//   3. Validate password strength (min 6 characters)
//   4. Update password and set passwordChanged to true
//   5. Return success
// ─────────────────────────────────────────────────────────────────────────────
export const updatePassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({
                message: "userId and newPassword are required",
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
            });
        }

        // Find the help provider
        const helpProvider = await HelpProvider.findById(userId);

        if (!helpProvider) {
            return res.status(404).json({
                message: "Help provider not found",
            });
        }

        // Update password (will be auto-hashed by pre-save hook)
        helpProvider.password = newPassword;
        helpProvider.passwordChanged = true;

        await helpProvider.save();

        res.status(200).json({
            message: "Password updated successfully",
            helpProvider: {
                id: helpProvider._id,
                name: helpProvider.name,
                email: helpProvider.email,
                passwordChanged: helpProvider.passwordChanged,
            },
        });
    } catch (error) {
        console.error("Update Password Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

