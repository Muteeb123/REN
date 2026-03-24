// src/routes/invite.routes.js
import express from "express";
import {
    generateInviteCode,
    validateInviteCode,
    removeHelpProvider,
} from "../controllers/Invite.controller.js";

const router = express.Router();

// Help seeker generates a code
router.post("/generate", generateInviteCode);

// Help provider submits a code
router.post("/validate", validateInviteCode);

// Help seeker removes their linked provider
router.post("/remove-provider", removeHelpProvider);

export default router;