import mongoose from "mongoose";

/**
 * Stores the aggregated emotion profile for a user, computed from their
 * recent SentimentResult records. This is the primary input for the LLM
 * conversational bot to personalise responses.
 */
const aggregatedEmotionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,   // one live record per user, always overwritten
      index: true,
    },

    // -----------------------------------------------------------------
    // Weighted average score per emotion label across the analysis window
    // e.g. { joy: 0.42, sadness: 0.18, anger: 0.07, ... }
    // -----------------------------------------------------------------
    aggregatedScores: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },

    // The single emotion with the highest aggregated score
    dominantEmotion: {
      type: String,
      required: true,
      trim: true,
    },

    // Top-N emotions sorted by score — handy for the LLM prompt
    topEmotions: {
      type: [
        {
          emotion: { type: String, required: true },
          score:   { type: Number, required: true },
        },
      ],
      default: [],
    },

    // Human-readable summary injected directly into the LLM system prompt
    llmContext: {
      type: String,
      trim: true,
      default: "",
    },

    // Metadata about the window used to produce this aggregate
    windowMeta: {
      contentCount:      { type: Number, default: 0 },  // # items analysed
      windowDays:        { type: Number, default: 7  },  // look-back window
      oldestContentDate: { type: Date   },
      newestContentDate: { type: Date   },
    },

    // ISO timestamp of the last time this record was recomputed
    lastComputedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, versionKey: false }
);

const AggregatedEmotion = mongoose.model(
  "AggregatedEmotion",
  aggregatedEmotionSchema
);
export default AggregatedEmotion;
