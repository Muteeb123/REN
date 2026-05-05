/**
 * moodStats.service.js
 *
 * Computes mood statistics for a help seeker from their SentimentResult +
 * RedditContent records. These statistics are intended for display on the
 * help provider's dashboard.
 *
 * Changes from v1:
 *  - Persists results to MoodStats collection (upsert)
 *  - Attaches a `dataQuality` block with a `sufficient` flag and human-
 *    readable `warningMessage` when data is sparse
 *  - Accepts an optional `selectedStats` object to toggle dashboard panels
 *  - All queries are still read-only aggregations — nothing else is written
 */

import mongoose from "mongoose";
import RedditContent    from "../Models/RedditContent.model.js";
import SentimentResult  from "../Models/SentimentResult.model.js";
import AggregatedEmotion from "../Models/AggregatedEmotion.model.js";
import MoodStats        from "../Models/MoodStats.model.js";

const MS_PER_DAY = 86_400_000;

// ─── Data-quality thresholds ──────────────────────────────────────────────────

const DATA_QUALITY = {
  /** Minimum number of analysed content items before stats are "sufficient" */
  MIN_SAMPLE_SIZE: 5,
  /**
   * Minimum fraction of days in the window that must have at least one
   * content item before trend charts are considered reliable.
   */
  MIN_COVERAGE_RATIO: 0.3,
};

// ─── Emotion polarity maps ────────────────────────────────────────────────────

const POSITIVE_EMOTIONS = new Set([
  "joy", "love", "surprise", "optimism", "admiration",
  "excitement", "amusement", "gratitude", "pride", "relief",
]);
const NEGATIVE_EMOTIONS = new Set([
  "sadness", "anger", "fear", "disgust", "grief",
  "annoyance", "disapproval", "embarrassment", "remorse", "nervousness",
]);

const toPolarity = (emotion) => {
  if (POSITIVE_EMOTIONS.has(emotion)) return "positive";
  if (NEGATIVE_EMOTIONS.has(emotion)) return "negative";
  return "neutral";
};

// ─── Default selectedStats (all panels on) ───────────────────────────────────

const DEFAULT_SELECTED_STATS = {
  emotionBreakdown:    true,
  polaritySplit:       true,
  dailyTrend:          true,
  volatility:          true,
  distressDays:        true,
  consecutiveDistress: true,
  weekSnapshot:        true,
};

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Build a comprehensive mood statistics object for a single user,
 * persist it to MoodStats, and return it.
 *
 * @param {string} userId
 * @param {number} windowDays        — how many days of history to analyse (1–90, default 30)
 * @param {object} [selectedStats]   — optional panel-visibility overrides
 * @returns {Promise<object>}        — the full stats payload (also saved to DB)
 */
export const computeMoodStats = async (
  userId,
  windowDays = 360,
  selectedStats = {}
) => {
  // ── Input validation ────────────────────────────────────────────────────
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error(`computeMoodStats: invalid userId "${userId}"`);
  }

  const clampedDays = Math.min(Math.max(1, windowDays), 90);
  const mergedSelectedStats = { ...DEFAULT_SELECTED_STATS, ...selectedStats };

  const uid         = new mongoose.Types.ObjectId(userId);
  const windowStart = new Date(Date.now() - clampedDays * MS_PER_DAY);

  // ── 1. Fetch RedditContent in window ─────────────────────────────────
  const recentContent = await RedditContent.find({
    userId: uid,
    createdAt: { $gte: windowStart },
  })
    .select("_id createdAt type")
    .lean();


    console.log("recentContent count:", recentContent.length);
    console.log("windowStart:", windowStart);

  if (!recentContent.length) {
    return _persistAndReturn(
      userId,
      clampedDays,
      mergedSelectedStats,
      _emptyStats(userId, clampedDays, mergedSelectedStats, 0, 0)
    );
  }

  const contentIds  = recentContent.map((c) => c._id);
  const contentById = Object.fromEntries(
    recentContent.map((c) => [c._id.toString(), c])
  );

  // ── 2. Fetch matching SentimentResults ───────────────────────────────
  const sentimentDocs = await SentimentResult.find({
    contentId: { $in: contentIds },
  })
    .select("contentId dominantEmotion emotionScores createdAt")
    .lean();

  if (!sentimentDocs.length) {
    return _persistAndReturn(
      userId,
      clampedDays,
      mergedSelectedStats,
      _emptyStats(userId, clampedDays, mergedSelectedStats, recentContent.length, 0)
    );
  }

  // ── 3. Attach date from RedditContent to each result ─────────────────
  const enriched = sentimentDocs.map((s) => ({
    ...s,
    contentDate: contentById[s.contentId.toString()]?.createdAt ?? s.createdAt,
  }));

  // ── 4. Overall emotion frequency & average score ──────────────────────
  const emotionFreq     = {};
  const emotionScoreSum = {};

  for (const doc of enriched) {
    const e = doc.dominantEmotion;
    emotionFreq[e]     = (emotionFreq[e]     || 0) + 1;
    emotionScoreSum[e] = (emotionScoreSum[e] || 0) +
      (doc.emotionScores?.[e] ?? 0);
  }

  const total = enriched.length;
  const emotionBreakdown = Object.entries(emotionFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, count]) => ({
      emotion,
      count,
      percentage: Math.round((count / total) * 100),
      avgScore:   +(emotionScoreSum[emotion] / count).toFixed(4),
    }));

  const dominantEmotion = emotionBreakdown[0]?.emotion ?? "neutral";

  // ── 5. Polarity split ─────────────────────────────────────────────────
  let positiveCount = 0, negativeCount = 0, neutralCount = 0;
  for (const { emotion, count } of emotionBreakdown) {
    const p = toPolarity(emotion);
    if (p === "positive") positiveCount += count;
    else if (p === "negative") negativeCount += count;
    else neutralCount += count;
  }

  const polaritySplit = {
    positive: { count: positiveCount, percentage: Math.round((positiveCount / total) * 100) },
    negative: { count: negativeCount, percentage: Math.round((negativeCount / total) * 100) },
    neutral:  { count: neutralCount,  percentage: Math.round((neutralCount  / total) * 100) },
  };

  // ── 6. Daily mood trend ───────────────────────────────────────────────
  const dayMap = {};
  for (const doc of enriched) {
    const day = doc.contentDate.toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { positive: 0, negative: 0, neutral: 0 };
    dayMap[day][toPolarity(doc.dominantEmotion)]++;
  }

  const dailyTrend = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => {
      const dayTotal = counts.positive + counts.negative + counts.neutral;
      const dominant =
        counts.positive >= counts.negative && counts.positive >= counts.neutral
          ? "positive"
          : counts.negative >= counts.neutral
          ? "negative"
          : "neutral";
      return {
        date,
        dominant,
        positive: Math.round((counts.positive / dayTotal) * 100),
        negative: Math.round((counts.negative / dayTotal) * 100),
        neutral:  Math.round((counts.neutral  / dayTotal) * 100),
      };
    });

  // ── 7. Volatility ─────────────────────────────────────────────────────
  let moodShifts = 0;
  for (let i = 1; i < dailyTrend.length; i++) {
    if (dailyTrend[i].dominant !== dailyTrend[i - 1].dominant) moodShifts++;
  }
  const volatilityScore =
    dailyTrend.length > 1
      ? +(moodShifts / (dailyTrend.length - 1)).toFixed(2)
      : 0;
  const volatilityLabel =
    volatilityScore >= 0.66 ? "high" :
    volatilityScore >= 0.33 ? "moderate" : "low";

  // ── 8. Distress signals ───────────────────────────────────────────────
  const distressDays = dailyTrend
    .filter((d) => d.dominant === "negative")
    .map((d) => d.date);

  const consecutiveDistress = _longestConsecutiveNegative(dailyTrend);

  // ── 9. 7-day snapshot ─────────────────────────────────────────────────
  const sevenDaysAgo   = new Date(Date.now() - 7 * MS_PER_DAY);
  const recentEnriched = enriched.filter((d) => d.contentDate >= sevenDaysAgo);
  const recentTotal    = recentEnriched.length;
  let   recentPositive = 0, recentNegative = 0;
  for (const d of recentEnriched) {
    const p = toPolarity(d.dominantEmotion);
    if (p === "positive") recentPositive++;
    if (p === "negative") recentNegative++;
  }

  const weekSnapshot = {
    totalPosts:         recentTotal,
    positivePercentage: recentTotal ? Math.round((recentPositive / recentTotal) * 100) : 0,
    negativePercentage: recentTotal ? Math.round((recentNegative / recentTotal) * 100) : 0,
  };

  // ── 10. Aggregated emotion context ───────────────────────────────────
  const agg = await AggregatedEmotion.findOne({ userId: uid })
    .select("dominantEmotion topEmotions llmContext lastComputedAt")
    .lean();

  // ── 11. Data quality assessment ──────────────────────────────────────
  const activeDays    = Object.keys(dayMap).length;
  const coverageRatio = clampedDays > 0
    ? +( activeDays / clampedDays ).toFixed(2)
    : 0;

  const isSampleSufficient  = total >= DATA_QUALITY.MIN_SAMPLE_SIZE;
  const isCoverageSufficient = coverageRatio >= DATA_QUALITY.MIN_COVERAGE_RATIO;
  const sufficient           = isSampleSufficient && isCoverageSufficient;

  let warningMessage = null;
  if (!sufficient) {
    const parts = [];
    if (!isSampleSufficient) {
      parts.push(
        `only ${total} post${total !== 1 ? "s" : ""} analysed ` +
        `(minimum ${DATA_QUALITY.MIN_SAMPLE_SIZE} recommended)`
      );
    }
    if (!isCoverageSufficient) {
      parts.push(
        `activity on only ${activeDays} of ${clampedDays} days ` +
        `(${Math.round(coverageRatio * 100)}% coverage)`
      );
    }
    warningMessage =
      `Statistics may be inaccurate — ${parts.join(" and ")}. ` +
      `Encourage the user to stay more active or extend the analysis window.`;
  }

  const dataQuality = {
    sufficient,
    sampleSize: total,
    activeDays,
    coverageRatio,
    warningMessage,
  };

  // ── 12. Assemble full stats payload ──────────────────────────────────
  const statsPayload = {
    userId,
    windowDays: clampedDays,
    generatedAt: new Date(),
    dataQuality,
    summary: {
      totalContentAnalyzed: total,
      dominantEmotion,
      volatility: { score: volatilityScore, label: volatilityLabel },
      distressDaysCount: distressDays.length,
      longestConsecutiveDistress: consecutiveDistress,
    },
    polaritySplit,
    emotionBreakdown,
    dailyTrend,
    weekSnapshot,
    distressDays,
    currentAggregation: agg
      ? {
          dominantEmotion:  agg.dominantEmotion,
          topEmotions:      agg.topEmotions,
          llmContext:       agg.llmContext,
          lastComputedAt:   agg.lastComputedAt,
        }
      : null,
    selectedStats: mergedSelectedStats,
  };

  return _persistAndReturn(userId, clampedDays, mergedSelectedStats, statsPayload);
};

/**
 * Return cached stats when possible; recompute only if new content exists.
 *
 * Cache criteria:
 *  - Same windowDays
 *  - No RedditContent newer than cached generatedAt within the window
 *
 * If selectedStats differs, update it without recomputing.
 *
 * @param {string} userId
 * @param {number} windowDays
 * @param {object} [selectedStats]
 * @returns {Promise<object>}
 */
export const getMoodStatsCached = async (
  userId,
  windowDays = 360,
  selectedStats = {}
) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error(`getMoodStatsCached: invalid userId "${userId}"`);
  }

  const clampedDays = Math.min(Math.max(1, windowDays), 90);
  const mergedSelectedStats = { ...DEFAULT_SELECTED_STATS, ...selectedStats };
  const uid = new mongoose.Types.ObjectId(userId);

  const cached = await MoodStats.findOne({
    userId: uid,
    windowDays: clampedDays,
  })
    .sort({ generatedAt: -1 })
    .lean();

  if (cached) {
    const windowStart = new Date(Date.now() - clampedDays * MS_PER_DAY);
    const recentContent = await RedditContent.find({
      userId: uid,
      createdAt: { $gte: windowStart },
    })
      .select("_id createdAt")
      .lean();

    if (!recentContent.length) {
      return computeMoodStats(userId, clampedDays, mergedSelectedStats);
    }

    const contentIds = recentContent.map((c) => c._id);
    const latestContentAt = recentContent.reduce((latest, item) => {
      if (!latest || item.createdAt > latest) return item.createdAt;
      return latest;
    }, null);

    const latestSentiment = await SentimentResult.findOne({
      contentId: { $in: contentIds },
    })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();

    const hasNewContent =
      latestContentAt && cached.generatedAt && latestContentAt > cached.generatedAt;
    const hasNewSentiment =
      latestSentiment && cached.generatedAt && latestSentiment.createdAt > cached.generatedAt;

    if (!hasNewContent && !hasNewSentiment) {
      if (!_selectedStatsEqual(cached.selectedStats, mergedSelectedStats)) {
        await MoodStats.findOneAndUpdate(
          { _id: cached._id },
          { $set: { selectedStats: mergedSelectedStats } }
        );
      }

      return {
        ...cached,
        userId: cached.userId?.toString?.() ?? cached.userId,
        selectedStats: mergedSelectedStats,
      };
    }
  }

  return computeMoodStats(userId, clampedDays, mergedSelectedStats);
};

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Persist stats to MoodStats (upsert) then return the payload.
 */
const _persistAndReturn = async (userId, windowDays, selectedStats, payload) => {
  try {
    await MoodStats.upsertForUser(userId, payload);
  } catch (dbError) {
    // Don't crash the API if persistence fails — stats are still returned
    console.error(
      `[moodStats.service] Failed to persist MoodStats for user ${userId}:`,
      dbError
    );
  }
  return payload;
};

/**
 * Build an empty (zero-data) stats payload.
 *
 * @param {string} userId
 * @param {number} windowDays
 * @param {object} selectedStats
 * @param {number} contentCount   — raw RedditContent items found (may have no sentiment yet)
 * @param {number} sentimentCount — SentimentResult items found
 */
const _emptyStats = (userId, windowDays, selectedStats, contentCount, sentimentCount) => {
  const warningMessage =
    contentCount === 0
      ? "No Reddit activity found in this time window. Statistics cannot be computed."
      : `${contentCount} post${contentCount !== 1 ? "s" : ""} found but none have been analysed yet. Statistics will appear once sentiment analysis completes.`;

  return {
    userId,
    windowDays,
    generatedAt: new Date(),
    dataQuality: {
      sufficient:     false,
      sampleSize:     sentimentCount,
      activeDays:     0,
      coverageRatio:  0,
      warningMessage,
    },
    summary: {
      totalContentAnalyzed:       0,
      dominantEmotion:            null,
      volatility:                 { score: 0, label: "low" },
      distressDaysCount:          0,
      longestConsecutiveDistress: 0,
    },
    polaritySplit: {
      positive: { count: 0, percentage: 0 },
      negative: { count: 0, percentage: 0 },
      neutral:  { count: 0, percentage: 0 },
    },
    emotionBreakdown: [],
    dailyTrend:       [],
    weekSnapshot:     { totalPosts: 0, positivePercentage: 0, negativePercentage: 0 },
    distressDays:     [],
    currentAggregation: null,
    selectedStats,
  };
};

/**
 * Returns the length of the longest consecutive run of negative-dominant days.
 *
 * @param {Array<{dominant: string}>} dailyTrend
 * @returns {number}
 */
const _longestConsecutiveNegative = (dailyTrend) => {
  let max = 0, current = 0;
  for (const day of dailyTrend) {
    if (day.dominant === "negative") {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
};

const _selectedStatsEqual = (left = {}, right = {}) => {
  const leftKeys = Object.keys(DEFAULT_SELECTED_STATS);
  for (const key of leftKeys) {
    if (Boolean(left?.[key]) !== Boolean(right?.[key])) return false;
  }
  return true;
};