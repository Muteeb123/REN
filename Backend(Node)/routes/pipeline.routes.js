/**
 * pipeline.routes.js
 *
 * Mount in app.js:
 *   import pipelineRoutes from "./routes/pipeline.routes.js";
 *   app.use("/api/pipeline", pipelineRoutes);
 */

import express from "express";
import {
  triggerUserPipeline,
  triggerAllPipelines,
  getPipelineStatus,
} from "../controllers/pipeline.controller.js";

const router = express.Router();

// Trigger full pipeline (fetch → analyze → aggregate) for a single user
router.post("/run/:userId", triggerUserPipeline);

// Trigger full pipeline for ALL users — guard in production
router.post("/run-all", triggerAllPipelines);

// Get the current aggregated emotion (used by Gemini bot)
router.get("/status/:userId", getPipelineStatus);

export default router;
