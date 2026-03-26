import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import journalRoutes from "./routes/journal.routes.js";
import userRoutes from "./routes/user.routes.js";
import sentimentRoutes from "./routes/sentiment.routes.js";
import helpProviderRoutes from "./routes/Helpprovider.routes.js";
import pipelineRoutes from "./routes/pipeline.routes.js";   // ← NEW
import { initCronJobs } from "./cron.js";


// Connect DB, then start cron jobs
connectDB().then(() => {
  initCronJobs();  // safe to start after DB is ready
});

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/user", userRoutes);
app.use("/api/sentiment", sentimentRoutes);
app.use("/api/help-provider", helpProviderRoutes);
app.use("/api/pipeline", pipelineRoutes);

export default app;
