import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import journalRoutes from "./routes/journal.routes.js";
import userRoutes from "./routes/user.routes.js";
import sentimentRoutes from "./routes/sentiment.routes.js";
import helpProviderRoutes from "./routes/Helpprovider.routes.js";
import chatRoutes from "./routes/Chat.routes.js";


dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sentiment", sentimentRoutes);
app.use("/api/help-provider", helpProviderRoutes);
app.use("/api/chat", chatRoutes);

export default app;
