// src/Models/HelpProvider.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const helpProviderSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },

        name: {
            type: String,
            trim: true,
        },

        // The InviteCode document _id this provider used to link up.
        // Null until the provider enters a valid code.
        // Use this to populate the InviteCode (which holds helpSeekerId) when needed.
        inviteCodeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InviteCode",
            default: null,
            get: (v) => v.toString()
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Hash password before saving
helpProviderSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Helper method to compare passwords on login
helpProviderSchema.methods.comparePassword = async function (plainText) {
    return bcrypt.compare(plainText, this.password);
};

const HelpProvider = mongoose.model("HelpProvider", helpProviderSchema);
export default HelpProvider;