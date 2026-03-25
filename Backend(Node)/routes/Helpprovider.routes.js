import express from "express";
import { inviteHelpProvider, helpProviderLogin } from "../controllers/Helpprovider.controller.js";

const router = express.Router();

// POST /api/help-provider/invite
// Help seeker invites a provider by entering their email inside the app
router.post("/invite", inviteHelpProvider);

// POST /api/help-provider/login
// Help provider logs in using emailed credentials
router.post("/login", helpProviderLogin);

export default router;