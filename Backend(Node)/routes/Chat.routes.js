import express from "express";
import {
    createChat,
    sendMessage,
    getChatId,
    getMessages,
} from "../controllers/chat.controller.js";

const router = express.Router();

// Create a chat between a help seeker and a help provider
// POST /api/chat/create
router.post("/create", createChat);

// Send a message in a chat (either party)
// POST /api/chat/:chatId/send
router.post("/:chatId/send", sendMessage);

// Get the chatId for a specific (helpSeeker, helpProvider) pair
// GET /api/chat/find?helpSeekerUserId=...&helpProviderId=...
router.get("/find", getChatId);

// Get paginated messages for a chat
// GET /api/chat/:chatId/messages?page=1
router.get("/:chatId/messages", getMessages);

export default router;