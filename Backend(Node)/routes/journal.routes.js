import express from "express";
import { createJournal, updateJournal, deleteJournal, getJournals } from "../controllers/journal.controller.js";

const router = express.Router();

router.post("/create", createJournal);
router.put("/update", updateJournal);
router.delete("/delete", deleteJournal);
router.get("/get/:userId", getJournals);

export default router;
