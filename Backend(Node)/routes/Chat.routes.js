import express from "express";
import {
    createChat,
    sendMessage,
    getMessages,
    getSeekersByProvider,
} from "../controllers/Chat.controller.js";

const router = express.Router();

// Create a chat between a help seeker and a help provider
// POST /api/chat/create
router.post("/create", createChat);

// Send a message in a chat (either party)
// POST /api/chat/:chatId/send
router.post("/:chatId/send", sendMessage);

// Get paginated messages using seeker and provider IDs directly
// GET /api/chat/messages?helpSeekerUserId=...&helpProviderId=...&page=1
router.get("/messages", getMessages);

// GET /api/chat/seekers/:providerId
router.get("/seekers/:providerId", getSeekersByProvider);

export default router;