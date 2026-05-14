import mongoose from "mongoose";

const redditContentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    redditId: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["post", "comment"],
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  { versionKey: false }
);

// Prevent duplicate save for the same reddit item per user/type
redditContentSchema.index({ userId: 1, redditId: 1, type: 1 }, { unique: true });

const RedditContent = mongoose.model("RedditContent", redditContentSchema);
export default RedditContent;