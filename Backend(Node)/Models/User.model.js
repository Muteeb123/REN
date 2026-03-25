
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },


        token: {
            type: String,
            required: [true, "Token is required"],
        },


        name: {
            type: String,
            required: false,
            trim: true,
        },

        age: {
            type: Number,
            required: false,
            min: 0,
        },

        gender: {
            type: String,
            required: false,
            enum: ["Male", "Female", "Prefer not to say"],
        },

        goals: {
            type: [String],
            default: [],
        },

        causes: {
            type: [String],
            default: [],
        },

        refreshToken: {
            type: String,
            required: false,
        },

        personalized: {
            type: Boolean,
            default: false,
        },
        preferredName: {
            type: String,
            required: false,
            trim: true,
        },
        helpContactEmail: {
            type: String,
            required: false,
            trim: true,
        }

    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Helpful index on email for fast lookups (unique is already an index, but ensuring)
userSchema.index({ email: 1 }, { unique: true, background: true });

const User = mongoose.model("User", userSchema);
export default User;
