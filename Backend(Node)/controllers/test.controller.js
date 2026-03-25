import { analyzeText, analyzeUserRedditContent } from "../services/sentiment.service.js";
import { fetchAuthenticatedUserContent } from "../services/reddit.service.js"; 

export const testSentiment = async (req, res) => {
  try {
    const result = await analyzeText(req.body.text);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Sentiment analysis failed" });
  }
};

export const analyzeUserSentiment = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await analyzeUserRedditContent(userId);
    return res.json({ count: result.length, results: result });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to analyze user content" });
  }
};

export const fetchRedditData = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await fetchAuthenticatedUserContent(userId);
    return res.json({ count: result.length, results: result });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to fetch user data from reddit" });
  }
};