
import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true // ensure every journal belongs to a specific user
        },
        title: {
            type: String
        },

        // Token will store your auth token (JWT or provider token).
        // Marked required as you requested.
        content: {
            type: String,
        },

        // Optional fields
        sentiment: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);



const Journal = mongoose.model("Journal", journalSchema);
export default Journal;
