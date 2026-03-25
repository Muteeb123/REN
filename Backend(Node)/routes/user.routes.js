import express from "express";
import { getUserById, personalize } from "../controllers/user.controller.js";

const router = express.Router();

router.put("/personalize", personalize);
router.get("/:userId", getUserById);

export default router;
