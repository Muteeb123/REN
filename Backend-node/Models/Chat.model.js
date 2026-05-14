import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
    {
        helpSeekerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        emoji: {
            type: String,
            required: true,
            enum: ["❤️", "👍", "😊", "🙏", "😢", "😮"],
        },
    },
    {
        timestamps: true,
        _id: false,
    }
);

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HelpProvider",
            required: true,
        },
        text: {
            type: String,
            required: [true, "Message text is required"],
            trim: true,
        },
        reactions: {
            type: [reactionSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const chatSchema = new mongoose.Schema(
    {
        helpSeekerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        helpProviderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HelpProvider",
            required: true,
        },
        messages: {
            type: [messageSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// One chat per (seeker, provider) pair — enforced at DB level
chatSchema.index({ helpSeekerId: 1, helpProviderId: 1 }, { unique: true });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;