#!/usr/bin/env node

/**
 * Gmail Organizer — Entry Point
 *
 * Usage:
 *   npm run run-once    — Run organizer once and exit
 *   npm run daemon      — Run on a daily schedule (6 AM)
 *   npm run auth        — Set up Gmail API credentials
 */

const cron = require("node-cron");
const { authorize } = require("./auth");
const { GmailOrganizer } = require("./organizer");

const DAILY_SCHEDULE = "0 6 * * *"; // 6:00 AM every day

async function runOnce() {
  const auth = await authorize();
  const organizer = new GmailOrganizer(auth);
  await organizer.run();
}

async function runDaemon() {
  console.log("Gmail Organizer daemon started.");
  console.log(`Scheduled to run daily at 6:00 AM (cron: ${DAILY_SCHEDULE})`);
  console.log("Running initial pass now...\n");

  // Run immediately on start
  await runOnce();

  // Then run on schedule
  cron.schedule(DAILY_SCHEDULE, async () => {
    try {
      await runOnce();
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Run failed:`, err.message);
    }
  });

  console.log("Daemon running. Press Ctrl+C to stop.\n");
}

async function cleanupLabels() {
  const auth = await authorize();
  const organizer = new GmailOrganizer(auth);
  await organizer.cleanupOldLabels();
}

// CLI handling
const args = process.argv.slice(2);
const flag = args[0];

if (flag === "--once" || flag === "once") {
  runOnce().catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
  });
} else if (flag === "--cleanup") {
  cleanupLabels().catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
  });
} else if (flag === "--daemon" || !flag) {
  runDaemon().catch((err) => {
    console.error("Failed:", err.message);
    process.exit(1);
  });
}
