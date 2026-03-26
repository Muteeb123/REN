/**
 * moodStats.service.js
 *
 * Computes mood statistics for a help seeker from their SentimentResult +
 * RedditContent records. These statistics are intended for display on the
 * help provider's dashboard.
 *
 * All queries are read-only aggregations — nothing is written here.
 */

import mongoose from "mongoose";
import RedditContent from "../Models/RedditContent.model.js";
import SentimentResult from "../Models/SentimentResult.model.js";
import AggregatedEmotion from "../Models/AggregatedEmotion.model.js";

const MS_PER_DAY = 86_400_000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map raw classifier emotion labels to a simplified polarity bucket.
 * Adjust buckets here if the model's label set changes.
 */
const POSITIVE_EMOTIONS  = new Set(["joy", "love", "surprise", "optimism", "admiration", "excitement", "amusement", "gratitude", "pride", "relief"]);
const NEGATIVE_EMOTIONS  = new Set(["sadness", "anger", "fear", "disgust", "grief", "annoyance", "disapproval", "embarrassment", "remorse", "nervousness"]);
// Anything not in either set is treated as neutral

const toPolarity = (emotion) => {
  if (POSITIVE_EMOTIONS.has(emotion)) return "positive";
  if (NEGATIVE_EMOTIONS.has(emotion)) return "negative";
  return "neutral";
};

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Build a comprehensive mood statistics object for a single user.
 *
 * @param {string} userId
 * @param {number} windowDays  — how many days of history to analyse (default 30)
 * @returns {Promise<MoodStats>}
 */
export const computeMoodStats = async (userId, windowDays = 30) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error(`computeMoodStats: invalid userId "${userId}"`);
  }

  const uid         = new mongoose.Types.ObjectId(userId);
  const windowStart = new Date(Date.now() - windowDays * MS_PER_DAY);

  // ── 1. Fetch RedditContent in window ──────────────────────────────────────
  const recentContent = await RedditContent.find({
    userId: uid,
    createdAt: { $gte: windowStart },
  })
    .select("_id createdAt type")
    .lean();

  if (!recentContent.length) {
    return _emptyStats(userId, windowDays);
  }

  const contentIds   = recentContent.map((c) => c._id);
  const contentById  = Object.fromEntries(
    recentContent.map((c) => [c._id.toString(), c])
  );

  // ── 2. Fetch matching SentimentResults ────────────────────────────────────
  const sentimentDocs = await SentimentResult.find({
    contentId: { $in: contentIds },
  })
    .select("contentId dominantEmotion emotionScores createdAt")
    .lean();

  if (!sentimentDocs.length) {
    return _emptyStats(userId, windowDays);
  }

  // ── 3. Attach date from RedditContent to each result ─────────────────────
  const enriched = sentimentDocs.map((s) => ({
    ...s,
    contentDate: contentById[s.contentId.toString()]?.createdAt ?? s.createdAt,
  }));

  // ── 4. Overall emotion frequency & average score ──────────────────────────
  const emotionFreq   = {};   // { joy: 5, sadness: 3, ... }
  const emotionScoreSum = {}; // running sum for average

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

  // ── 5. Polarity split ─────────────────────────────────────────────────────
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

  // ── 6. Daily mood trend (dominant polarity per calendar day) ──────────────
  const dayMap = {}; // "YYYY-MM-DD" → { positive: n, negative: n, neutral: n }

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
        positive:  Math.round((counts.positive / dayTotal) * 100),
        negative:  Math.round((counts.negative / dayTotal) * 100),
        neutral:   Math.round((counts.neutral  / dayTotal) * 100),
      };
    });

  // ── 7. Volatility — how much the dominant emotion changes day-to-day ──────
  let moodShifts = 0;
  for (let i = 1; i < dailyTrend.length; i++) {
    if (dailyTrend[i].dominant !== dailyTrend[i - 1].dominant) moodShifts++;
  }
  const volatilityScore =
    dailyTrend.length > 1
      ? +(moodShifts / (dailyTrend.length - 1)).toFixed(2)
      : 0;
  const volatilityLabel =
    volatilityScore >= 0.66 ? "high" : volatilityScore >= 0.33 ? "moderate" : "low";

  // ── 8. Distress signals — days where negative polarity dominated ──────────
  const distressDays = dailyTrend
    .filter((d) => d.dominant === "negative")
    .map((d) => d.date);

  const consecutiveDistress = _longestConsecutiveNegative(dailyTrend);

  // ── 9. Most recent 7-day snapshot (for "this week" card) ─────────────────
  const sevenDaysAgo    = new Date(Date.now() - 7 * MS_PER_DAY);
  const recentEnriched  = enriched.filter((d) => d.contentDate >= sevenDaysAgo);
  const recentTotal     = recentEnriched.length;
  let   recentPositive  = 0, recentNegative = 0;
  for (const d of recentEnriched) {
    const p = toPolarity(d.dominantEmotion);
    if (p === "positive") recentPositive++;
    if (p === "negative") recentNegative++;
  }

  const weekSnapshot = {
    totalPosts: recentTotal,
    positivePercentage: recentTotal
      ? Math.round((recentPositive / recentTotal) * 100) : 0,
    negativePercentage: recentTotal
      ? Math.round((recentNegative / recentTotal) * 100) : 0,
  };

  // ── 10. Fetch current aggregated context (already computed by pipeline) ───
  const agg = await AggregatedEmotion.findOne({ userId: uid })
    .select("dominantEmotion topEmotions llmContext lastComputedAt")
    .lean();

  return {
    userId,
    windowDays,
    generatedAt: new Date(),
    summary: {
      totalContentAnalyzed: total,
      dominantEmotion,
      volatility: { score: volatilityScore, label: volatilityLabel },
      distressDaysCount: distressDays.length,
      longestConsecutiveDistress: consecutiveDistress,
    },
    polaritySplit,
    emotionBreakdown,       // full sorted list — use top 5 for chart
    dailyTrend,             // array of { date, dominant, positive%, negative%, neutral% }
    weekSnapshot,
    distressDays,           // ISO date strings where negative dominated
    currentAggregation: agg
      ? {
          dominantEmotion:  agg.dominantEmotion,
          topEmotions:      agg.topEmotions,
          llmContext:       agg.llmContext,
          lastComputedAt:   agg.lastComputedAt,
        }
      : null,
  };
};

// ─── Private helpers ──────────────────────────────────────────────────────────

const _emptyStats = (userId, windowDays) => ({
  userId,
  windowDays,
  generatedAt: new Date(),
  summary: {
    totalContentAnalyzed: 0,
    dominantEmotion: null,
    volatility: { score: 0, label: "low" },
    distressDaysCount: 0,
    longestConsecutiveDistress: 0,
  },
  polaritySplit: {
    positive: { count: 0, percentage: 0 },
    negative: { count: 0, percentage: 0 },
    neutral:  { count: 0, percentage: 0 },
  },
  emotionBreakdown: [],
  dailyTrend: [],
  weekSnapshot: { totalPosts: 0, positivePercentage: 0, negativePercentage: 0 },
  distressDays: [],
  currentAggregation: null,
});

/**
 * Returns the length of the longest consecutive run of negative-dominant days.
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