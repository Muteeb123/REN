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
import { sendPushNotification } from "./services/pushNotification.service.js";
import User from "./Models/User.model.js";

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

// ---------------- Reminder job ----------------

let isReminderRunning = false;

const runReminderJob = async () => {
  if (isReminderRunning) {
    console.warn('[cron] Reminder job already running — skipping this tick.');
    return;
  }

  isReminderRunning = true;
  const start = Date.now();
  console.log(`[cron] Reminder job started at ${new Date().toISOString()}`);

  try {
    const testMode = String(process.env.REMINDER_TEST_MODE || '').toLowerCase() === 'true';
    const inactivityMinutes = parseInt(process.env.REMINDER_INACTIVITY_MINUTES || (testMode ? '1' : '1440'), 10); // minutes
    const cutoff = new Date(Date.now() - inactivityMinutes * 60 * 1000);

    // Find users who have notifications enabled and an FCM token
    const candidates = await User.find({ notificationsEnabled: true, fcmToken: { $ne: null } }).lean();

    const toNotify = [];

    for (const u of candidates) {
      const lastSeen = u.lastLoginAt || u.updatedAt || u.createdAt || null;
      if (!lastSeen) {
        // If no timestamps available, consider as candidate
        toNotify.push(u);
        continue;
      }

      if (new Date(lastSeen) < cutoff) {
        toNotify.push(u);
      }
    }

    console.log(`[cron] Reminder job: found ${toNotify.length} users to notify (cutoff: ${cutoff.toISOString()})`);

    for (const user of toNotify) {
      try {
        const notification = {
          title: 'We miss you at REN',
          body: "Looks like you haven't logged in recently  tap to open the app and check in.",
        };

        const data = {
          notificationType: 'inactivity_reminder',
          userId: user._id?.toString?.() || String(user._id),
        };

        await sendPushNotification(user.fcmToken, notification, data);
        console.log(`[cron] Reminder sent to user ${user._id}`);
      } catch (err) {
        console.error(`[cron] Failed to send reminder to ${user._id}:`, err && err.message ? err.message : err);
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`[cron] Reminder job finished in ${elapsed}s`);
  } catch (err) {
    console.error('[cron] Unexpected reminder job error:', err);
  } finally {
    isReminderRunning = false;
  }
};

export const initReminderJob = () => {
  const testMode = String(process.env.REMINDER_TEST_MODE || '').toLowerCase() === 'true';
  const REMINDER_SCHEDULE = process.env.CRON_REMINDER_SCHEDULE || (testMode ? '* * * * *' : '0 * * * *');

  if (!cron.validate(REMINDER_SCHEDULE)) {
    console.error(`[cron] Invalid CRON_REMINDER_SCHEDULE "${REMINDER_SCHEDULE}". Reminder job NOT started.`);
    return;
  }

  cron.schedule(REMINDER_SCHEDULE, runReminderJob, { timezone: process.env.TZ || 'UTC' });

  console.log(`[cron] Reminder job scheduled — "${REMINDER_SCHEDULE}" (tz: ${process.env.TZ || 'UTC'})`);
};
