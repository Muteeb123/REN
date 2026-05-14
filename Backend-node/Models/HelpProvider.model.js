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
        },

        name: {
            type: String,
            required: false,
            trim: true,
        },

        // Reference to the help_seeker (User) who invited this provider
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        passwordChanged: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

helpProviderSchema.index({ email: 1 }, { unique: true, background: true });

// Hash password before saving
helpProviderSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with stored hash
helpProviderSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const HelpProvider = mongoose.model("HelpProvider", helpProviderSchema);
export default HelpProvider;