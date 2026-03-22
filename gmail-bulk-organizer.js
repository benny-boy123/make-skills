/**
 * Gmail Bulk Organizer — Google Apps Script
 *
 * Setup:
 *   1. Go to script.google.com → New Project
 *   2. Delete the default code and paste this entire file
 *   3. Select "organizeAllEmails" from the function dropdown → ▶️ Run
 *   4. Review Permissions → pick your account → Allow
 *      (If "unverified app" warning: Advanced → Go to Untitled project (unsafe))
 *   5. Wait ~60s. Re-run if you have 500+ threads in any category.
 *
 * Optional: Run "cleanupOldLabels" to remove stale labels.
 */

// ─── Configuration ──────────────────────────────────────────────────────────

var CONFIG = {
  batchSize: 500,       // Gmail API caps at 500 threads per search
  archiveAfterLabel: true // Skip the inbox after labeling
};

// ─── Label + Query Rules ────────────────────────────────────────────────────

var RULES = [
  // ── Negative Ions ──
  {
    label: "Negative Ions/Payments",
    queries: [
      "from:noreply@messaging.squareup.com",
      "from:no-reply@square.com",
      "subject:\"payment received\" from:square"
    ]
  },
  {
    label: "Negative Ions/Sourcing",
    queries: [
      "from:@alibaba.com",
      "from:@aliexpress.com",
      "from:@1688.com",
      "subject:alibaba"
    ]
  },

  // ── ILC ──
  {
    label: "ILC/Team Reports",
    queries: [
      "subject:EOD report",
      "subject:SOD report",
      "subject:\"daily report\"",
      "subject:\"end of day\"",
      "subject:\"start of day\""
    ]
  },
  {
    label: "ILC/Client Comms",
    queries: [
      "subject:\"consultation report\"",
      "subject:\"client consultation\"",
      "subject:\"consultation summary\""
    ]
  },
  {
    label: "ILC/Invoices & Payments",
    queries: [
      "subject:invoice from:quickbooks",
      "subject:invoice from:intuit",
      "subject:\"payment received\" -from:square",
      "subject:\"invoice\" from:@ilc"
    ]
  },
  {
    label: "ILC/Ads & Marketing",
    queries: [
      "from:ads-noreply@google.com",
      "from:@facebookmail.com subject:ad",
      "from:noreply@business.facebook.com",
      "subject:\"ad receipt\"",
      "subject:\"advertising receipt\"",
      "from:noreply@meta.com subject:ad"
    ]
  },

  // ── BizBroker ──
  {
    label: "BizBroker",
    queries: [
      "from:grok subject:digest",
      "from:@x.com subject:grok",
      "subject:\"Grok digest\""
    ]
  },

  // ── Personal ──
  {
    label: "Personal",
    queries: [
      "from:@southwest.com",
      "from:@united.com",
      "from:@delta.com",
      "from:@aa.com",
      "from:@spirit.com",
      "from:@fly.com",
      "subject:\"flight confirmation\"",
      "subject:\"boarding pass\"",
      "subject:\"itinerary\"",
      "from:@edu",
      "subject:\"school\" from:@k12",
      "subject:\"class schedule\"",
      "subject:\"transcript\""
    ]
  }
];

// ─── Noise senders to archive silently ──────────────────────────────────────

var NOISE_QUERIES = [
  "from:@realtor.com",
  "from:@tiktok.com",
  "from:@temu.com",
  "from:@cnn.com",
  "from:@ubereats.com",
  "from:@uber.com subject:eats",
  "from:@avg.com",
  "from:@vacationstogo.com",
  "from:@indeed.com",
  "from:@nellisauction.com",
  "from:@quora.com",
  "from:@nextdoor.com",
  "from:@linkedin.com subject:digest",
  "from:@groupon.com",
  "from:@retailmenot.com",
  "from:@wish.com",
  "from:@shein.com",
  "from:@aliexpress.com subject:sale",
  "from:@pinterest.com",
  "from:@medium.com"
];

// ─── Old labels to clean up ─────────────────────────────────────────────────

var OLD_LABELS = [
  "✔",
  "✔✔",
  "Notification",
  "Meeting Update",
  "Notes",
  "Unroll.me",
  "[Notion]",
  "MailTracker"
];

// ═══════════════════════════════════════════════════════════════════════════
// Main entry point — select this in the function dropdown and click Run
// ═══════════════════════════════════════════════════════════════════════════

function organizeAllEmails() {
  Logger.log("Starting Gmail Bulk Organizer...");

  var totalLabeled = 0;
  var totalArchived = 0;

  // Process each labeling rule
  for (var i = 0; i < RULES.length; i++) {
    var rule = RULES[i];
    var label = getOrCreateLabel_(rule.label);

    for (var q = 0; q < rule.queries.length; q++) {
      var query = rule.queries[q] + " -label:" + rule.label.replace(/\//g, "-").replace(/ /g, "-");
      var threads = searchThreads_(query);

      if (threads.length > 0) {
        Logger.log("  [" + rule.label + "] " + threads.length + " threads for: " + rule.queries[q]);
        label.addToThreads(threads);
        totalLabeled += threads.length;

        if (CONFIG.archiveAfterLabel) {
          archiveThreads_(threads);
          totalArchived += threads.length;
        }
      }
    }
  }

  // Archive noise
  for (var n = 0; n < NOISE_QUERIES.length; n++) {
    var noiseQuery = NOISE_QUERIES[n] + " in:inbox";
    var noiseThreads = searchThreads_(noiseQuery);

    if (noiseThreads.length > 0) {
      Logger.log("  [NOISE] Archiving " + noiseThreads.length + " threads: " + NOISE_QUERIES[n]);
      archiveThreads_(noiseThreads);
      totalArchived += noiseThreads.length;
    }
  }

  Logger.log("Done! Labeled: " + totalLabeled + " | Archived: " + totalArchived);
}

// ═══════════════════════════════════════════════════════════════════════════
// Optional — run this to delete old unused labels
// ═══════════════════════════════════════════════════════════════════════════

function cleanupOldLabels() {
  Logger.log("Cleaning up old labels...");

  for (var i = 0; i < OLD_LABELS.length; i++) {
    var name = OLD_LABELS[i];
    var label = GmailApp.getUserLabelByName(name);
    if (label) {
      label.deleteLabel();
      Logger.log("  Deleted label: " + name);
    } else {
      Logger.log("  Label not found (already removed): " + name);
    }
  }

  Logger.log("Done cleaning up labels!");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getOrCreateLabel_(name) {
  var label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
    Logger.log("  Created label: " + name);
  }
  return label;
}

function searchThreads_(query) {
  try {
    return GmailApp.search(query, 0, CONFIG.batchSize);
  } catch (e) {
    Logger.log("  Search error for '" + query + "': " + e.message);
    return [];
  }
}

function archiveThreads_(threads) {
  // Gmail moveThreadsToArchive handles up to 100 at a time
  for (var i = 0; i < threads.length; i += 100) {
    var batch = threads.slice(i, i + 100);
    GmailApp.moveThreadsToArchive(batch);
  }
}
