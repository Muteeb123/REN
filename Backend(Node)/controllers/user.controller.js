// controllers/user.controller.js
import User from "../Models/User.model.js";

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-__v");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- PERSONALIZE: Update user with personalization data ---
export const personalize = async (req, res) => {
    try {
        const { userId, name, gender, age, goals, causes, helpContactEmail } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const updatePayload = {
            personalized: true,
        };

        if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
            updatePayload.preferredName = name && name.trim() ? name.trim() : undefined;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "gender")) {
            updatePayload.gender = gender || undefined;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "age")) {
            updatePayload.age = age || undefined;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "goals")) {
            updatePayload.goals = goals || undefined;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "causes")) {
            updatePayload.causes = causes || undefined;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "helpContactEmail")) {
            updatePayload.helpContactEmail =
                helpContactEmail && helpContactEmail.trim()
                    ? helpContactEmail.trim()
                    : undefined;
        }

        // Find and update the user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updatePayload,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User personalization updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Personalization Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
