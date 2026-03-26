/**
 * cron.js
 *
 * Registers scheduled jobs using `node-cron`.
 * Import and call `initCronJobs()` once from app.js after DB is connected.
 *
 * Schedule (default): 02:00 server time every day.
 * Override via CRON_PIPELINE_SCHEDULE env var (standard cron expression).
 *
 * Install dependency:
 *   npm install node-cron
 */

import cron from "node-cron";
import { runPipelineForAllUsers } from "./services/pipeline.service.js";

// Guard: prevent overlapping runs if a previous job is still executing
let isRunning = false;

const runDailyPipeline = async () => {
  if (isRunning) {
    console.warn("[cron] Daily pipeline already running — skipping this tick.");
    return;
  }

  isRunning = true;
  const start = Date.now();
  console.log(`[cron] Daily pipeline started at ${new Date().toISOString()}`);

  try {
    const { succeeded, failed } = await runPipelineForAllUsers();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    console.log(
      `[cron] Daily pipeline finished in ${elapsed}s — ` +
        `succeeded: ${succeeded.length}, failed: ${failed.length}`
    );

    if (failed.length) {
      console.warn("[cron] Failed users:", failed);
    }
  } catch (err) {
    console.error("[cron] Unexpected pipeline error:", err);
  } finally {
    isRunning = false;
  }
};

export const initCronJobs = () => {

  const PIPELINE_SCHEDULE = process.env.CRON_PIPELINE_SCHEDULE || "0 2 * * *";

  if (!cron.validate(PIPELINE_SCHEDULE)) {
    console.error(
      `[cron] Invalid CRON_PIPELINE_SCHEDULE "${PIPELINE_SCHEDULE}". Cron jobs NOT started.`
    );
    return;
  }

  cron.schedule(PIPELINE_SCHEDULE, runDailyPipeline, {
    timezone: process.env.TZ || "UTC",
  });

  console.log(
    `[cron] Daily pipeline scheduled — "${PIPELINE_SCHEDULE}" ` +
      `(tz: ${process.env.TZ || "UTC"})`
  );
};
