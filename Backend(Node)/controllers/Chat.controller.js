import Chat from "../Models/Chat.model.js";
import User from "../Models/User.model.js";
import HelpProvider from "../Models/HelpProvider.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE CHAT
// Creates a chat between a help seeker and a help provider.
// If one already exists for this pair, returns the existing one.
//
// POST /api/chat/create
// Body: { helpSeekerUserId, helpProviderId }
// ─────────────────────────────────────────────────────────────────────────────
export const createChat = async (req, res) => {
    try {
        const { helpSeekerUserId, helpProviderId } = req.body;

        if (!helpSeekerUserId || !helpProviderId) {
            return res.status(400).json({
                message: "helpSeekerUserId and helpProviderId are required",
            });
        }

        const [seeker, provider] = await Promise.all([
            User.findById(helpSeekerUserId),
            HelpProvider.findById(helpProviderId),
        ]);

        if (!seeker) {
            return res.status(404).json({ message: "Help seeker not found" });
        }
        if (!provider) {
            return res.status(404).json({ message: "Help provider not found" });
        }

        const existing = await Chat.findOne({
            helpSeekerId: helpSeekerUserId,
            helpProviderId,
        });

        if (existing) {
            return res.status(200).json({
                message: "Chat already exists",
                chat: {
                    chatId: existing._id,
                    helpSeekerId: existing.helpSeekerId,
                    helpProviderId: existing.helpProviderId,
                    createdAt: existing.createdAt,
                },
            });
        }

        const chat = await Chat.create({
            helpSeekerId: helpSeekerUserId,
            helpProviderId,
        });

        res.status(201).json({
            message: "Chat created",
            chat: {
                chatId: chat._id,
                helpSeekerId: chat.helpSeekerId,
                helpProviderId: chat.helpProviderId,
                createdAt: chat.createdAt,
            },
        });
    } catch (error) {
        console.error("Create Chat Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND MESSAGE
// Either party sends a message into the shared chat.
//
// POST /api/chat/:chatId/send
// Body: { senderId, senderModel ("User" | "HelpProvider"), text }
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { senderId, senderModel, text } = req.body;

        if (!senderId || !senderModel || !text?.trim()) {
            return res.status(400).json({
                message: "senderId, senderModel, and text are required",
            });
        }

        if (!["User", "HelpProvider"].includes(senderModel)) {
            return res.status(400).json({
                message: 'senderModel must be "User" or "HelpProvider"',
            });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const seekerIdStr = chat.helpSeekerId.toString();
        const providerIdStr = chat.helpProviderId.toString();

        if (senderModel === "User" && seekerIdStr !== senderId) {
            return res.status(403).json({ message: "Sender is not part of this chat" });
        }
        if (senderModel === "HelpProvider" && providerIdStr !== senderId) {
            return res.status(403).json({ message: "Sender is not part of this chat" });
        }

        chat.messages.push({ senderModel, senderId, text: text.trim() });
        await chat.save();

        const savedMessage = chat.messages[chat.messages.length - 1];

        res.status(201).json({
            message: "Message sent",
            data: savedMessage,
        });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CHAT ID
// Returns the chatId for a specific (helpSeeker, helpProvider) pair.
//
// GET /api/chat/find?helpSeekerUserId=...&helpProviderId=...
// ─────────────────────────────────────────────────────────────────────────────
export const getChatId = async (req, res) => {
    try {
        const { helpSeekerUserId, helpProviderId } = req.query;

        if (!helpSeekerUserId || !helpProviderId) {
            return res.status(400).json({
                message: "helpSeekerUserId and helpProviderId query params are required",
            });
        }

        const chat = await Chat.findOne({
            helpSeekerId: helpSeekerUserId,
            helpProviderId,
        }).select("_id helpSeekerId helpProviderId createdAt");

        if (!chat) {
            return res.status(404).json({ message: "No chat found for this pair" });
        }

        res.status(200).json({
            chatId: chat._id,
            helpSeekerId: chat.helpSeekerId,
            helpProviderId: chat.helpProviderId,
            createdAt: chat.createdAt,
        });
    } catch (error) {
        console.error("Get Chat ID Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MESSAGES (paginated)
// Fetches messages for a chat, 10 per page, most recent first.
//
// GET /api/chat/:chatId/messages?page=1
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const PAGE_SIZE = 10;

        const chat = await Chat.findById(chatId).select(
            "messages helpSeekerId helpProviderId"
        );

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const totalMessages = chat.messages.length;
        const totalPages = Math.ceil(totalMessages / PAGE_SIZE) || 1;

        if (page > totalPages) {
            return res.status(400).json({
                message: `Page ${page} does not exist. Total pages: ${totalPages}`,
            });
        }

        const end = totalMessages - (page - 1) * PAGE_SIZE;
        const start = Math.max(0, end - PAGE_SIZE);
        const messages = chat.messages.slice(start, end);

        res.status(200).json({
            chatId: chat._id,
            helpSeekerId: chat.helpSeekerId,
            helpProviderId: chat.helpProviderId,
            messages ,
            pagination: {
                currentPage: page,
                totalPages,
                totalMessages,
                hasNextPage: page < totalPages,
            },
        });
    } catch (error) {
        console.error("Get Messages Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};