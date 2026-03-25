import express from "express";
import {
    redditAuth,
    redditCallback,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/reddit", redditAuth);
router.get("/reddit/callback", redditCallback);

export default router;