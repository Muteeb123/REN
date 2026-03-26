/**
 * pipeline.service.js
 *
 * Orchestrates the full sentiment pipeline for one user:
 *   1. Fetch Reddit content  (reddit.service)
 *   2. Run sentiment analysis on NEW, unanalysed content only (batch)
 *   3. Compute aggregated emotion  (aggregation.service)
 *
 * Each stage is independently error-tolerant: a failure in one stage is
 * captured and reported without crashing the others where possible.
 */

import mongoose from "mongoose";
import RedditContent from "../Models/RedditContent.model.js";
import SentimentResult from "../Models/SentimentResult.model.js";
import { fetchAuthenticatedUserContent } from "./reddit.service.js";
import { analyzeText } from "./sentiment.service.js";
import { computeAndSaveAggregation } from "./aggregation.service.js";
import User from "../Models/User.model.js";

// ─── Config ──────────────────────────────────────────────────────────────────
const BATCH_SIZE          = Number(process.env.PIPELINE_BATCH_SIZE          || 20);
const BATCH_DELAY_MS      = Number(process.env.PIPELINE_BATCH_DELAY_MS      || 500);
const PY_SENTIMENT_TIMEOUT = Number(process.env.PY_SENTIMENT_TIMEOUT_MS     || 15000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Normalise raw HuggingFace / Python classifier output to
 * { emotionScores, dominantEmotion }
 */
const normalizeClassifierResult = (result) => {
  if (Array.isArray(result)) {
    const scores = {};
    for (const item of result) {
      const label = String(item?.label || "").trim();
      const score = Number(item?.score);
      if (label && Number.isFinite(score)) scores[label] = score;
    }
    const dominantEmotion =
      Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
    return { emotionScores: scores, dominantEmotion };
  }

  if (result && typeof result === "object") {
    const scores = { ...result };
    let dominantEmotion = "unknown";
    let max = -Infinity;
    for (const [k, v] of Object.entries(scores)) {
      const n = Number(v);
      if (Number.isFinite(n) && n > max) { max = n; dominantEmotion = k; }
    }
    return { emotionScores: scores, dominantEmotion };
  }

  return { emotionScores: { raw: result }, dominantEmotion: "unknown" };
};

// ─── Stage helpers ────────────────────────────────────────────────────────────

/**
 * Stage 1 – Fetch Reddit content for the user and upsert into DB.
 * Returns count of items stored (new + updated).
 */
const stageFetchReddit = async (user) => {
  if (!user.refreshToken) {
    throw new Error(`User ${user._id} has no refreshToken — cannot fetch Reddit data.`);
  }
  const texts = await fetchAuthenticatedUserContent({
    refreshToken: user.refreshToken,
    userId: user._id.toString(),
  });
  return { fetchedCount: texts.length };
};

/**
 * Stage 2 – Batch-analyse only content that has no SentimentResult yet.
 * Uses Promise.allSettled per batch so one bad item does not block others.
 */
const stageBatchAnalyze = async (userId) => {
  // Find all content IDs that already have a result
  const analyzed = await SentimentResult.find({})
    .select("contentId")
    .lean();
  const analyzedIds = new Set(analyzed.map((r) => r.contentId.toString()));

  // Fetch only unanalysed content
  const pending = await RedditContent.find({ userId })
    .select("_id text")
    .lean();

  const toAnalyze = pending.filter((c) => !analyzedIds.has(c._id.toString()));

  if (!toAnalyze.length) {
    return { analyzed: 0, skipped: pending.length, failed: 0 };
  }

  let analyzedCount = 0;
  let failedCount   = 0;

  // Process in batches
  for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
    const batch = toAnalyze.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (content) => {
        const raw = await analyzeText(content.text);
        const { emotionScores, dominantEmotion } = normalizeClassifierResult(raw);

        await SentimentResult.findOneAndUpdate(
          { contentId: content._id },
          { $set: { contentId: content._id, emotionScores, dominantEmotion } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") analyzedCount++;
      else {
        failedCount++;
        console.error("[pipeline] sentiment analysis item failed:", r.reason?.message);
      }
    }

    // Brief pause between batches to avoid overwhelming the Python service
    if (i + BATCH_SIZE < toAnalyze.length) await sleep(BATCH_DELAY_MS);
  }

  return {
    analyzed: analyzedCount,
    skipped:  pending.length - toAnalyze.length,
    failed:   failedCount,
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the full pipeline for a single user.
 *
 * @param {string} userId
 * @returns {Promise<PipelineResult>}
 */
export const runPipelineForUser = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error(`runPipelineForUser: invalid userId "${userId}"`);
  }

  const user = await User.findById(userId).lean();
  if (!user) throw new Error(`User ${userId} not found.`);

  const result = {
    userId,
    stages: { fetch: null, analyze: null, aggregate: null },
    success: false,
    error: null,
  };

  try {
    // ── Stage 1: Fetch ──────────────────────────────────────────────────────
    result.stages.fetch = await stageFetchReddit(user);
  } catch (err) {
    result.stages.fetch = { error: err.message };
    // Cannot proceed without data
    result.error = `Fetch stage failed: ${err.message}`;
    return result;
  }

  try {
    // ── Stage 2: Batch Analyse ──────────────────────────────────────────────
    result.stages.analyze = await stageBatchAnalyze(userId);
  } catch (err) {
    result.stages.analyze = { error: err.message };
    // Aggregation might still work on previously stored results — don't abort
    console.warn(`[pipeline] Analyze stage failed for ${userId}:`, err.message);
  }

  try {
    // ── Stage 3: Aggregate ──────────────────────────────────────────────────
    const agg = await computeAndSaveAggregation(userId);
    result.stages.aggregate = {
      dominantEmotion: agg.dominantEmotion,
      contentCount:    agg.windowMeta?.contentCount,
    };
    result.success = true;
  } catch (err) {
    result.stages.aggregate = { error: err.message };
    result.error = `Aggregate stage failed: ${err.message}`;
  }

  return result;
};

/**
 * Run the pipeline for all active users (those with a refreshToken).
 * Designed to be called from the cron job.
 *
 * @returns {Promise<{ succeeded: string[], failed: Array<{userId, error}> }>}
 */
export const runPipelineForAllUsers = async () => {
  const users = await User.find({ refreshToken: { $exists: true, $ne: null } })
    .select("_id")
    .lean();

  if (!users.length) {
    console.log("[pipeline] No users with refreshToken found. Skipping run.");
    return { succeeded: [], failed: [] };
  }

  console.log(`[pipeline] Starting pipeline for ${users.length} user(s).`);

  const succeeded = [];
  const failed    = [];

  for (const { _id } of users) {
    const uid = _id.toString();
    try {
      const r = await runPipelineForUser(uid);
      if (r.success) {
        succeeded.push(uid);
        console.log(`[pipeline] ✓ ${uid}`, r.stages);
      } else {
        failed.push({ userId: uid, error: r.error });
        console.warn(`[pipeline] ✗ ${uid}:`, r.error);
      }
    } catch (err) {
      failed.push({ userId: uid, error: err.message });
      console.error(`[pipeline] ✗ ${uid} unexpected error:`, err.message);
    }
    // Brief pause between users to avoid overload
    const delay = Number(process.env.PIPELINE_FETCH_DELAY_MS) || 1000;
    await new Promise(r => setTimeout(r, delay)); 
  }

  console.log(
    `[pipeline] Done. succeeded=${succeeded.length}, failed=${failed.length}`
  );
  return { succeeded, failed };
};
