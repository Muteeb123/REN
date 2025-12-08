
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

        // Token will store your auth token (JWT or provider token).
        // Marked required as you requested.
        token: {
            type: String,
            required: [true, "Token is required"],
        },

        // Optional fields
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

        refreshToken: {
            type: String,
            required: false,
        },
        // If you want to allow arbitrary extra fields in the future,
        // consider adding a `meta` object (optional). Commented out for now.
        // meta: {
        //   type: mongoose.Schema.Types.Mixed,
        //   default: {},
        // },
    },
    {
        timestamps: true, // createdAt, updatedAt
        versionKey: false,
    }
);

// Helpful index on email for fast lookups (unique is already an index, but ensuring)
userSchema.index({ email: 1 }, { unique: true, background: true });

const User = mongoose.model("User", userSchema);
export default User;
