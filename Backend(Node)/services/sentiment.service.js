// import axios from "axios"

// export const analyzeText = async (text) => {

//     const response = await axios.post(
//         "http://127.0.0.1:8000/analyze",
//         { text }
//     )

//     return response.data
// }

import axios from "axios";
import mongoose from "mongoose";
import RedditContent from "../Models/RedditContent.model.js";
import SentimentResult from "../Models/SentimentResult.model.js";

const PY_SENTIMENT_URL = process.env.PY_SENTIMENT_URL || "http://127.0.0.1:8000/analyze";
const PY_SENTIMENT_TIMEOUT_MS = Number(process.env.PY_SENTIMENT_TIMEOUT_MS || 15000);

const normalizeClassifierResult = (result) => {
  // Common HF pipeline output: [{ label: "joy", score: 0.91 }, ...]
  if (Array.isArray(result)) {
    const scores = {};
    for (const item of result) {
      if (!item || typeof item !== "object") continue;
      const label = String(item.label || "").trim();
      const score = Number(item.score);
      if (label && Number.isFinite(score)) scores[label] = score;
    }

    const dominantEmotion =
      Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";

    return { emotionScores: scores, dominantEmotion };
  }

  // If service returns object format directly
  if (result && typeof result === "object") {
    const scores = { ...result };
    let dominantEmotion = "unknown";
    let max = -Infinity;

    for (const [key, val] of Object.entries(scores)) {
      const n = Number(val);
      if (Number.isFinite(n) && n > max) {
        max = n;
        dominantEmotion = key;
      }
    }

    return { emotionScores: scores, dominantEmotion };
  }

  return { emotionScores: { raw: result }, dominantEmotion: "unknown" };
};

export const analyzeText = async (text) => {
  if (!text || typeof text !== "string" || !text.trim()) {
    throw new Error("text must be a non-empty string");
  }

  try {
    const response = await axios.post(
      PY_SENTIMENT_URL,
      { text: text.trim() },
      { timeout: PY_SENTIMENT_TIMEOUT_MS }
    );

    // Supports both { result: ... } and raw payload
    return response.data?.result ?? response.data;
  } catch (error) {
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to call Python sentiment service";
    throw new Error(message);
  }
};

/**
 * Fetch RedditContent for a user, analyze each text via Python service,
 * and upsert result in SentimentResult.
 * @param {string} userId
 * @returns {Promise<Array<{contentId: string, dominantEmotion: string, emotionScores: object}>>}
 */
export const analyzeUserRedditContent = async (userId) => {
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Invalid userId");
  }

  const contents = await RedditContent.find({ userId })
    .select("_id text")
    .lean();

  if (!contents.length) return [];

  const settled = await Promise.allSettled(
    contents.map(async (content) => {
      const raw = await analyzeText(content.text);
      const { emotionScores, dominantEmotion } = normalizeClassifierResult(raw);

      const saved = await SentimentResult.findOneAndUpdate(
        { contentId: content._id },
        { $set: { contentId: content._id, emotionScores, dominantEmotion } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        contentId: saved.contentId,
        dominantEmotion: saved.dominantEmotion,
        emotionScores: saved.emotionScores,
      };
    })
  );

  // Keep successful ones; if needed, failed items can be logged.
  return settled
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
};