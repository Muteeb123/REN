import express from "express";
import { getUserById, personalize, ackGoalsReminder } from "../controllers/user.controller.js";

const router = express.Router();

router.put("/personalize", personalize);
router.post("/ack-goals", ackGoalsReminder);
router.get("/:userId", getUserById);

export default router;
