/**
 * Gmail Organizer Rules Configuration
 *
 * Each rule has a label and an array of Gmail search queries.
 * Matching threads get labeled and archived.
 */

const LABEL_RULES = [
  // ── Negative Ions ──
  {
    label: "Negative Ions/Payments",
    queries: [
      "from:noreply@messaging.squareup.com",
      "from:no-reply@square.com",
      'subject:"payment received" from:square',
    ],
  },
  {
    label: "Negative Ions/Sourcing",
    queries: [
      "from:@alibaba.com",
      "from:@aliexpress.com",
      "from:@1688.com",
      "subject:alibaba",
    ],
  },

  // ── ILC ──
  {
    label: "ILC/Team Reports",
    queries: [
      "subject:EOD report",
      "subject:SOD report",
      'subject:"daily report"',
      'subject:"end of day"',
      'subject:"start of day"',
    ],
  },
  {
    label: "ILC/Client Comms",
    queries: [
      'subject:"consultation report"',
      'subject:"client consultation"',
      'subject:"consultation summary"',
    ],
  },
  {
    label: "ILC/Invoices & Payments",
    queries: [
      "subject:invoice from:quickbooks",
      "subject:invoice from:intuit",
      'subject:"payment received" -from:square',
      "subject:invoice from:@ilc",
    ],
  },
  {
    label: "ILC/Ads & Marketing",
    queries: [
      "from:ads-noreply@google.com",
      "from:@facebookmail.com subject:ad",
      "from:noreply@business.facebook.com",
      'subject:"ad receipt"',
      'subject:"advertising receipt"',
      "from:noreply@meta.com subject:ad",
    ],
  },

  // ── BizBroker ──
  {
    label: "BizBroker",
    queries: [
      "from:grok subject:digest",
      "from:@x.com subject:grok",
      'subject:"Grok digest"',
    ],
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
      'subject:"flight confirmation"',
      'subject:"boarding pass"',
      'subject:"itinerary"',
      "from:@edu",
      "subject:school from:@k12",
      'subject:"class schedule"',
      'subject:"transcript"',
    ],
  },
];

// Noise senders — archive silently, no label
const NOISE_QUERIES = [
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
  "from:@medium.com",
];

// Old labels to clean up
const OLD_LABELS = [
  "✔",
  "✔✔",
  "Notification",
  "Meeting Update",
  "Notes",
  "Unroll.me",
  "[Notion]",
  "MailTracker",
];

module.exports = { LABEL_RULES, NOISE_QUERIES, OLD_LABELS };
