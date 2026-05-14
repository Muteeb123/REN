import express from "express";
import {
    redditAuth,
    redditCallback,
} from "../controllers/auth.controller.js";
import { helpProviderLogin, updatePassword } from "../controllers/Helpprovider.controller.js";

const router = express.Router();

router.get("/reddit", redditAuth);
router.get("/reddit/callback", redditCallback);

// Help provider login endpoint
router.post("/help-provider-login", helpProviderLogin);

// Update password endpoint (for first-time password change)
router.post("/update-password", updatePassword);

export default router;