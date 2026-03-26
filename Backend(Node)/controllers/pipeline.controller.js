/**
 * pipeline.controller.js
 *
 * Exposes HTTP endpoints to:
 *   POST /api/pipeline/run/:userId   — trigger the full pipeline for one user
 *   POST /api/pipeline/run-all       — trigger for all users (admin/internal)
 *   GET  /api/pipeline/status/:userId — return the current AggregatedEmotion
 */

import { runPipelineForUser, runPipelineForAllUsers } from "../services/pipeline.service.js";
import AggregatedEmotion from "../Models/AggregatedEmotion.model.js";
import mongoose from "mongoose";

/**
 * POST /api/pipeline/run/:userId
 * Trigger the full pipeline for a single user.
 * Useful during testing and for on-demand refreshes.
 */
export const triggerUserPipeline = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const result = await runPipelineForUser(userId);
    const status = result.success ? 200 : 500;
    return res.status(status).json(result);
  } catch (err) {
    console.error("[pipeline.controller] triggerUserPipeline error:", err);
    return res.status(500).json({ message: err.message || "Pipeline failed" });
  }
};

/**
 * POST /api/pipeline/run-all
 * Trigger the full pipeline for all users.
 * Protect this route in production (e.g. internal-only middleware).
 */
export const triggerAllPipelines = async (req, res) => {
  try {
    // Fire and forget — respond immediately, let it run in background
    res.status(202).json({ message: "Pipeline started for all users." });
    const result = await runPipelineForAllUsers();

    console.log("[pipeline.controller] run-all finished:", result);

  } catch (err) {

    console.error("[pipeline.controller] triggerAllPipelines error:", err);
  }
};

/**
 * GET /api/pipeline/status/:userId
 * Return the most recent AggregatedEmotion for a user.
 * The Gemini bot calls this to hydrate its system prompt.
 */
export const getPipelineStatus = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  try {
    const agg = await AggregatedEmotion.findOne({ userId }).lean();

    if (!agg) {
      return res.status(404).json({
        message: "No aggregated emotion found for this user. Run the pipeline first.",
      });
    }

    return res.status(200).json(agg);
  
  } catch (err) {
    console.error("[pipeline.controller] getPipelineStatus error:", err);
    return res.status(500).json({ message: "Failed to fetch aggregated emotion" });
  }
};
