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
// SEND MESSAGE (HelpProvider only)
// Only HelpProvider can send messages to help seekers.
//
// POST /api/chat/:chatId/send
// Body: { senderId (HelpProvider ID), text }
// ─────────────────────────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { senderId, text } = req.body;

        if (!senderId || !text?.trim()) {
            return res.status(400).json({
                message: "senderId and text are required",
            });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        const providerIdStr = chat.helpProviderId.toString();

        // Only HelpProvider can send messages
        if (providerIdStr !== senderId) {
            return res.status(403).json({
                message: "Only the help provider can send messages in this chat",
            });
        }

        chat.messages.push({ senderId, text: text.trim() });
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
// ADD REACTION (HelpSeeker only)
// Help seeker reacts to a message with an emoji.
//
// POST /api/chat/:chatId/:messageId/react
// Body: { helpSeekerId, emoji }
// Valid emojis: "❤️", "👍", "😊", "🙏", "😢", "😮"
// ─────────────────────────────────────────────────────────────────────────────
export const addReaction = async (req, res) => {
    try {
        const { chatId, messageId } = req.params;
        const { helpSeekerId, emoji } = req.body;

        if (!helpSeekerId || !emoji) {
            return res.status(400).json({
                message: "helpSeekerId and emoji are required",
            });
        }

        const validEmojis = ["❤️", "👍", "😊", "🙏", "😢", "😮"];
        if (!validEmojis.includes(emoji)) {
            return res.status(400).json({
                message: `Invalid emoji. Valid emojis are: ${validEmojis.join(", ")}`,
            });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Verify that the user is the help seeker in this chat
        if (chat.helpSeekerId.toString() !== helpSeekerId) {
            return res.status(403).json({
                message: "Only the help seeker can react to messages",
            });
        }

        // Find the message
        const message = chat.messages.id(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Check if user already reacted with this emoji, if so remove it (toggle behavior)
        const existingReactionIndex = message.reactions.findIndex(
            (r) =>
                r.helpSeekerId.toString() === helpSeekerId && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            // Remove existing reaction (toggle off)
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Add new reaction
            message.reactions.push({ helpSeekerId, emoji });
        }

        await chat.save();

        res.status(200).json({
            message: existingReactionIndex > -1 ? "Reaction removed" : "Reaction added",
            data: message,
        });
    } catch (error) {
        console.error("Add Reaction Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MESSAGES (paginated)
// Finds the chat by (helpSeekerId, helpProviderId) pair and returns
// paginated messages with reactions — no need to know the chatId upfront.
//
// GET /api/chat/messages?helpSeekerUserId=...&helpProviderId=...&page=1
// ─────────────────────────────────────────────────────────────────────────────
export const getMessages = async (req, res) => {
    try {
        const {
            helpSeekerUserId,
            helpProviderId: helpProviderIdQuery,
            helpProvider,
            page: pageQuery,
        } = req.query;
        const page = Math.max(1, parseInt(pageQuery) || 1);
        const PAGE_SIZE = 10;

        if (!helpSeekerUserId || (!helpProviderIdQuery && !helpProvider)) {
            return res.status(400).json({
                message: "helpSeekerUserId and either helpProviderId or helpProvider are required",
            });
        }

        let helpProviderId = helpProviderIdQuery;

        if (!helpProviderId) {
            const provider = await HelpProvider.findOne({ email: helpProvider }).select("_id");
            if (!provider) {
                return res.status(404).json({ message: "Help provider not found" });
            }
            helpProviderId = provider._id;
        }

        const chat = await Chat.findOne({
            helpSeekerId: helpSeekerUserId,
            helpProviderId,
        }).select("messages helpSeekerId helpProviderId");

        if (!chat) {
            return res.status(404).json({ message: "No chat found for this pair" });
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
            messages,
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

// GET /api/chat/seekers/:providerId
export const getSeekersByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;

        // Find the provider to get their email first
        const provider = await HelpProvider.findById(providerId);
        if (!provider) {
            return res.status(404).json({ message: "Help provider not found" });
        }

        // Find all users who have this provider's email as their helpContactEmail
        const seekers = await User.find({ helpContactEmail: provider.email })
            .select("name avatar preferredName email helpContactEmail");

        if (!seekers.length) {
            return res.status(404).json({ message: "No seekers found for this provider" });
        }

        res.status(200).json({ seekers });
    } catch (error) {
        console.error("Get Seekers By Provider Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};