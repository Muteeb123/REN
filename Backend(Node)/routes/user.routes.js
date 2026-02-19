import express from "express";
import { personalize } from "../controllers/user.controller.js";

const router = express.Router();

router.put("/personalize", personalize);

export default router;
