import mongoose from "mongoose";

const sentimentResultSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RedditContent",
      required: true,
      unique: true,
      index: true,
    },
    emotionScores: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    dominantEmotion: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const SentimentResult = mongoose.model("SentimentResult", sentimentResultSchema);
export default SentimentResult;