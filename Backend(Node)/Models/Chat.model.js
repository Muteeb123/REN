import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderModel: {
            type: String,
            required: true,
            enum: ["User", "HelpProvider"],
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "messages.senderModel",
        },
        text: {
            type: String,
            required: [true, "Message text is required"],
            trim: true,
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