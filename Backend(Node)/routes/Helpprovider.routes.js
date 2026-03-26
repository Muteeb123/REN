import express from "express";
import { inviteHelpProvider, helpProviderLogin, getMoodStats, } from "../controllers/Helpprovider.controller.js";

const router = express.Router();

// POST /api/help-provider/invite
// Help seeker invites a provider by entering their email inside the app
router.post("/invite", inviteHelpProvider);

// POST /api/help-provider/login
// Help provider logs in using emailed credentials
router.post("/login", helpProviderLogin);

// GET /api/helpprovider/mood-stats/:providerId?windowDays=30
// Help provider fetches mood statistics for their assigned seeker
router.get("/mood-stats/:providerId", getMoodStats);

export default router;