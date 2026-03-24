import mongoose from "mongoose";

const inviteCodeSchema = new mongoose.Schema(
    {
        // The help seeker who owns/generated this code
        helpSeekerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        code: {
            type: String,
            required: true,
            unique: true,
        },

        // Expires 1 minute after generation
        expiresAt: {
            type: Date,
            required: true,
        },

        // The help provider who consumed this code.
        // Null until a provider validates it.
        helpProviderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HelpProvider",
            default: null,
        },

        // true  → code has been consumed and the link is active
        // false → code is pending (not yet used) or the seeker removed the provider
        isActive: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// TTL index — MongoDB will automatically delete the document after expiry.
// This is a safety net; business logic also checks expiresAt manually.
inviteCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const InviteCode = mongoose.model("InviteCode", inviteCodeSchema);
export default InviteCode;