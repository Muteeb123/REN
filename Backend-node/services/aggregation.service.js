/**
 * aggregation.service.js
 *
 * Computes a weighted, time-decayed aggregated emotion profile from a user's
 * recent SentimentResult records and persists it to AggregatedEmotion.
 *
 * Design decisions
 * ----------------
 * • Only content within `WINDOW_DAYS` (default 7) is included so the profile
 *   reflects current mental state, not a lifetime average.
 * • More-recent content is weighted more heavily via a simple linear decay:
 *     weight = 1 + (daysOld / WINDOW_DAYS) * (RECENCY_FACTOR - 1)
 *   where RECENCY_FACTOR = 2 means the newest item counts twice as much as
 *   the oldest boundary item.
 * • The resulting scores are L1-normalised (sum to 1) so they are always
 *   comparable regardless of window size.
 * • llmContext is a short English sentence injected into the Gemini system
 *   prompt to give the bot instant emotional awareness.
 */

import mongoose from "mongoose";
import RedditContent from "../Models/RedditContent.model.js";
import SentimentResult from "../Models/SentimentResult.model.js";
import AggregatedEmotion from "../Models/AggregatedEmotion.model.js";

// ─── Config ──────────────────────────────────────────────────────────────────
const WINDOW_DAYS     = Number(process.env.AGGREGATION_WINDOW_DAYS  || 7);
const RECENCY_FACTOR  = Number(process.env.AGGREGATION_RECENCY_FACTOR || 2);
const TOP_N_EMOTIONS  = Number(process.env.AGGREGATION_TOP_N        || 3);
const MS_PER_DAY      = 86_400_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a short natural-language string for the LLM system prompt.
 * Example: "Recently the user has been feeling mostly joy (42 %), with some
 * sadness (18 %) and surprise (11 %)."
 */
const buildLlmContext = (topEmotions, dominantEmotion) => {
  if (!topEmotions.length) return "";

  const fmt = (e) =>
    `${e.emotion} (${Math.round(e.score * 100)} %)`;

  const [first, ...rest] = topEmotions;
  if (!rest.length) {
    return `Recently the user has been feeling mostly ${fmt(first)}.`;
  }

  const restStr = rest.map(fmt).join(", ");
  return (
    `Recently the user has been feeling mostly ${fmt(first)}, ` +
    `with some ${restStr}.`
  );
};

// ─── Core export ─────────────────────────────────────────────────────────────

/**
 * Compute and persist the aggregated emotion profile for a single user.
 *
 * @param {string} userId  - MongoDB ObjectId string
 * @returns {Promise<import("../Models/AggregatedEmotion.model.js").default>}
 *          The upserted AggregatedEmotion document.
 */
export const computeAndSaveAggregation = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error(`computeAndSaveAggregation: invalid userId "${userId}"`);
  }

  const windowStart = new Date(Date.now() - WINDOW_DAYS * MS_PER_DAY);

  // ── 1. Fetch RedditContent IDs within the window ──────────────────────────
  const recentContent = await RedditContent.find({
    userId,
    createdAt: { $gte: windowStart },
  })
    .select("_id createdAt")
    .lean();

  if (!recentContent.length) {
    // No content in the window — write a neutral/empty record so the LLM
    // knows there is no data rather than receiving stale info.
    const empty = await AggregatedEmotion.findOneAndUpdate(
      { userId },
      {
        $set: {
          userId,
          aggregatedScores: {},
          dominantEmotion: "neutral",
          topEmotions: [],
          llmContext: "No recent Reddit activity was found for this user.",
          windowMeta: {
            contentCount: 0,
            windowDays: WINDOW_DAYS,
          },
          lastComputedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return empty;
  }

  const contentIds = recentContent.map((c) => c._id);

  // ── 2. Fetch corresponding SentimentResults ───────────────────────────────
  const sentimentDocs = await SentimentResult.find({
    contentId: { $in: contentIds },
  })
    .select("contentId emotionScores")
    .lean();

  if (!sentimentDocs.length) {
    // Content exists but hasn't been analysed yet — caller should trigger
    // sentiment analysis first (the cron job does this automatically).
    throw new Error(
      `No SentimentResult records found for userId ${userId} within the window. ` +
        "Run sentiment analysis before aggregating."
    );
  }

  // Build a lookup: contentId → createdAt for recency weighting
  const createdAtMap = Object.fromEntries(
    recentContent.map((c) => [c._id.toString(), c.createdAt])
  );

  // ── 3. Weighted accumulation ──────────────────────────────────────────────
  const now = Date.now();
  const accumulatedScores = {};

  for (const doc of sentimentDocs) {
    const cid = doc.contentId.toString();
    const createdAt = createdAtMap[cid];
    const daysOld = createdAt
      ? (now - new Date(createdAt).getTime()) / MS_PER_DAY
      : WINDOW_DAYS;

    // weight: 1 (oldest) → RECENCY_FACTOR (newest)
    const recencyWeight =
      RECENCY_FACTOR - (daysOld / WINDOW_DAYS) * (RECENCY_FACTOR - 1);
    const weight = Math.max(recencyWeight, 0.1); // floor at 0.1

    for (const [emotion, score] of Object.entries(doc.emotionScores || {})) {
      const n = Number(score);
      if (!Number.isFinite(n) || n <= 0) continue;
      accumulatedScores[emotion] =
        (accumulatedScores[emotion] || 0) + n * weight;
    }
  }

  if (!Object.keys(accumulatedScores).length) {
    throw new Error(`Empty emotion scores after accumulation for userId ${userId}.`);
  }

  // ── 4. L1-normalise ───────────────────────────────────────────────────────
  const total = Object.values(accumulatedScores).reduce((s, v) => s + v, 0);
  const aggregatedScores = Object.fromEntries(
    Object.entries(accumulatedScores).map(([k, v]) => [k, v / total])
  );

  // ── 5. Rank & derive metadata ─────────────────────────────────────────────
  const sorted = Object.entries(aggregatedScores).sort((a, b) => b[1] - a[1]);
  const dominantEmotion = sorted[0][0];
  const topEmotions = sorted.slice(0, TOP_N_EMOTIONS).map(([emotion, score]) => ({
    emotion,
    score: Math.round(score * 10_000) / 10_000, // 4 d.p.
  }));

  const dates = recentContent.map((c) => new Date(c.createdAt).getTime());
  const windowMeta = {
    contentCount:      sentimentDocs.length,
    windowDays:        WINDOW_DAYS,
    oldestContentDate: new Date(Math.min(...dates)),
    newestContentDate: new Date(Math.max(...dates)),
  };

  const llmContext = buildLlmContext(topEmotions, dominantEmotion);

  // ── 6. Upsert ─────────────────────────────────────────────────────────────
  const result = await AggregatedEmotion.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        aggregatedScores,
        dominantEmotion,
        topEmotions,
        llmContext,
        windowMeta,
        lastComputedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return result;
};

/**
 * Convenience wrapper: aggregate for every user who has unprocessed sentiment
 * results (or all users if `forceAll` is true).
 *
 * @param {boolean} forceAll  - Re-aggregate every user, not just those with
 *                              new data since their last aggregation.
 * @returns {Promise<{succeeded: string[], failed: Array<{userId:string, error:string}>}>}
 */
export const aggregateAllUsers = async (forceAll = false) => {
  // Find users who have SentimentResults newer than their last aggregation
  const pipeline = [
    {
      $lookup: {
        from: "aggregatedemotions",
        localField: "userId",
        foreignField: "userId",
        as: "existing",
      },
    },
    {
      $match: forceAll
        ? {}
        : {
            $expr: {
              $or: [
                { $eq: [{ $size: "$existing" }, 0] },
                {
                  $gt: [
                    "$updatedAt",
                    { $arrayElemAt: ["$existing.lastComputedAt", 0] },
                  ],
                },
              ],
            },
          },
    },
    { $group: { _id: "$userId" } },
  ];

  const userGroups = await SentimentResult.aggregate(pipeline);
  const userIds = userGroups.map((g) => g._id.toString());

  if (!userIds.length) {
    return { succeeded: [], failed: [] };
  }

  const succeeded = [];
  const failed    = [];

  // Sequential to avoid hammering MongoDB; parallelism can be increased
  // by batching if user counts grow large.
  for (const uid of userIds) {
    try {
      await computeAndSaveAggregation(uid);
      succeeded.push(uid);
    } catch (err) {
      failed.push({ userId: uid, error: err.message });
    }
  }

  return { succeeded, failed };
};