import crypto from "crypto";
import InviteCode from "../Models/InviteCode.model.js";
import HelpProvider from "../Models/HelpProvider.model.js";

// ─────────────────────────────────────────────────────────────
// HELP SEEKER: Generate (or regenerate) an invite code
// POST /api/invite/generate
// Body: { helpSeekerId }
// ─────────────────────────────────────────────────────────────
export const generateInviteCode = async (req, res) => {
    try {
        const { helpSeekerId } = req.body;

        if (!helpSeekerId) {
            return res.status(400).json({ message: "helpSeekerId is required" });
        }

        // Block regeneration if this seeker already has an active link with a provider.
        // They must remove the provider first before generating a new code.
        const activeLink = await InviteCode.findOne({ helpSeekerId, isActive: true });
        if (activeLink) {
            return res.status(400).json({
                message: "You already have an active help provider. Please remove them before generating a new invite code.",
            });
        }

        // Delete any existing pending (unused) codes for this seeker
        await InviteCode.deleteMany({ helpSeekerId, isActive: false });

        // Generate a collision-safe 8-character hex code
        let code;
        let attempts = 0;
        const MAX_ATTEMPTS = 10;
        do {
            code = crypto.randomBytes(4).toString("hex").toUpperCase();
            const existing = await InviteCode.findOne({ code });
            if (!existing) break;
            attempts++;
        } while (attempts < MAX_ATTEMPTS);

        if (attempts === MAX_ATTEMPTS) {
            return res.status(500).json({ message: "Failed to generate a unique code, please try again" });
        }

        const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute from now

        const inviteCode = await InviteCode.create({
            helpSeekerId,
            code,
            expiresAt,
        });

        res.status(201).json({
            message: "Invite code generated successfully",
            code: inviteCode.code,
            expiresAt: inviteCode.expiresAt,
        });
    } catch (error) {
        console.error("Generate Invite Code Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// HELP PROVIDER: Validate and consume an invite code
// POST /api/invite/validate
// Body: { code, helpProviderId }
// ─────────────────────────────────────────────────────────────
export const validateInviteCode = async (req, res) => {
    try {
        const { code, helpProviderId } = req.body;

        if (!code || !helpProviderId) {
            return res.status(400).json({ message: "code and helpProviderId are required" });
        }

        // Find the code document
        const inviteCode = await InviteCode.findOne({ code });

        if (!inviteCode) {
            return res.status(404).json({ message: "Invalid invite code" });
        }

        if (inviteCode.isActive) {
            return res.status(400).json({ message: "Invite code has already been used" });
        }

        if (new Date() > inviteCode.expiresAt) {
            return res.status(400).json({ message: "Invite code has expired" });
        }

        // Mark code as active and store the provider who consumed it
        inviteCode.isActive = true;
        inviteCode.helpProviderId = helpProviderId;
        await inviteCode.save();

        // Link the provider to this invite code only (seeker id lives on the code)
        const provider = await HelpProvider.findByIdAndUpdate(
            helpProviderId,
            { inviteCodeId: inviteCode._id },
            { new: true }
        );

        if (!provider) {
            return res.status(404).json({ message: "Help provider not found" });
        }

        res.status(200).json({
            message: "Invite code validated successfully. You are now linked to the help seeker.",
            linkedHelpSeekerId: inviteCode.helpSeekerId,
            provider,
        });
    } catch (error) {
        console.error("Validate Invite Code Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────
// HELP SEEKER: Remove / unlink a help provider
// POST /api/invite/remove-provider
// Body: { helpSeekerId, helpProviderId }
// ─────────────────────────────────────────────────────────────
export const removeHelpProvider = async (req, res) => {
    try {
        const { helpSeekerId, helpProviderId } = req.body;

        if (!helpSeekerId || !helpProviderId) {
            return res.status(400).json({ message: "helpSeekerId and helpProviderId are required" });
        }

        const provider = await HelpProvider.findById(helpProviderId);

        if (!provider) {
            return res.status(404).json({ message: "Help provider not found" });
        }

        if (!provider.inviteCodeId) {
            return res.status(400).json({ message: "This provider is not linked to any help seeker" });
        }

        console.log("Provider's inviteCodeId:", provider.inviteCodeId);

        const inviteCodeId = provider.inviteCodeId;
        console.log("InviteCodeId from provider record:", inviteCodeId);
        // Verify ownership via the invite code
        const inviteCode = await InviteCode.findById(inviteCodeId);

        console.log("InviteCode for provider:", inviteCode);
        console.log("Provider's inviteCodeId:", provider.inviteCodeId);
        console.log("HelpSeekerId from request:", helpSeekerId);

        if (!inviteCode || String(inviteCode.helpSeekerId) !== String(helpSeekerId)) {
            return res.status(403).json({ message: "This provider is not linked to your account" });
        }

        // Deactivate the link on the invite code — provider goes back to "enter code" screen
        inviteCode.isActive = false;
        await inviteCode.save();

        // Clear the provider's invite code reference
        provider.inviteCodeId = null;
        await provider.save();

        res.status(200).json({
            message: "Help provider has been removed successfully",
        });
    } catch (error) {
        console.error("Remove Help Provider Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};