/**
 * Gmail Organizer — Core Logic
 *
 * Uses the Gmail API to label, archive, and clean up emails
 * based on the rules defined in rules.js.
 */

const { google } = require("googleapis");
const { LABEL_RULES, NOISE_QUERIES, OLD_LABELS } = require("./rules");

const BATCH_SIZE = 100; // Gmail API batch limit for modify

class GmailOrganizer {
  constructor(auth) {
    this.gmail = google.gmail({ version: "v1", auth });
    this.userId = "me";
    this.labelCache = {};
    this.stats = { labeled: 0, archived: 0, errors: 0 };
  }

  async run() {
    console.log(`\n[${new Date().toISOString()}] Starting Gmail organizer...`);
    this.stats = { labeled: 0, archived: 0, errors: 0 };

    // Cache all existing labels
    await this.loadLabels();

    // Process label rules
    for (const rule of LABEL_RULES) {
      await this.processRule(rule);
    }

    // Archive noise
    await this.archiveNoise();

    console.log(
      `Done! Labeled: ${this.stats.labeled} | Archived: ${this.stats.archived} | Errors: ${this.stats.errors}\n`
    );
    return this.stats;
  }

  async cleanupOldLabels() {
    console.log("Cleaning up old labels...");
    await this.loadLabels();

    for (const name of OLD_LABELS) {
      const labelId = this.labelCache[name];
      if (labelId) {
        try {
          await this.gmail.users.labels.delete({
            userId: this.userId,
            id: labelId,
          });
          console.log(`  Deleted label: ${name}`);
        } catch (err) {
          console.log(`  Could not delete "${name}": ${err.message}`);
        }
      } else {
        console.log(`  Label not found: ${name}`);
      }
    }
    console.log("Done cleaning up labels!");
  }

  // ── Internal methods ──

  async loadLabels() {
    const res = await this.gmail.users.labels.list({ userId: this.userId });
    this.labelCache = {};
    for (const label of res.data.labels || []) {
      this.labelCache[label.name] = label.id;
    }
  }

  async getOrCreateLabel(name) {
    if (this.labelCache[name]) {
      return this.labelCache[name];
    }

    // For nested labels like "ILC/Team Reports", create parent first
    const parts = name.split("/");
    if (parts.length > 1) {
      const parent = parts[0];
      if (!this.labelCache[parent]) {
        await this.createLabel(parent);
      }
    }

    return this.createLabel(name);
  }

  async createLabel(name) {
    try {
      const res = await this.gmail.users.labels.create({
        userId: this.userId,
        requestBody: {
          name,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      this.labelCache[name] = res.data.id;
      console.log(`  Created label: ${name}`);
      return res.data.id;
    } catch (err) {
      // Label might already exist with different casing
      if (err.code === 409) {
        await this.loadLabels();
        return this.labelCache[name];
      }
      throw err;
    }
  }

  async searchMessages(query) {
    const messageIds = [];
    let pageToken;

    do {
      const res = await this.gmail.users.messages.list({
        userId: this.userId,
        q: query,
        maxResults: 500,
        pageToken,
      });

      if (res.data.messages) {
        for (const msg of res.data.messages) {
          messageIds.push(msg.id);
        }
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);

    return messageIds;
  }

  async batchModify(messageIds, addLabelIds, removeLabelIds) {
    // Gmail batchModify handles up to 1000 messages at a time
    for (let i = 0; i < messageIds.length; i += 1000) {
      const batch = messageIds.slice(i, i + 1000);
      await this.gmail.users.messages.batchModify({
        userId: this.userId,
        requestBody: {
          ids: batch,
          addLabelIds: addLabelIds || [],
          removeLabelIds: removeLabelIds || [],
        },
      });
    }
  }

  async processRule(rule) {
    const labelId = await this.getOrCreateLabel(rule.label);

    for (const query of rule.queries) {
      try {
        const messageIds = await this.searchMessages(query);

        if (messageIds.length > 0) {
          console.log(
            `  [${rule.label}] ${messageIds.length} messages for: ${query}`
          );

          // Label + archive (remove INBOX)
          await this.batchModify(messageIds, [labelId], ["INBOX"]);
          this.stats.labeled += messageIds.length;
          this.stats.archived += messageIds.length;
        }
      } catch (err) {
        console.error(`  Error processing "${query}": ${err.message}`);
        this.stats.errors++;
      }
    }
  }

  async archiveNoise() {
    for (const query of NOISE_QUERIES) {
      try {
        const fullQuery = query + " in:inbox";
        const messageIds = await this.searchMessages(fullQuery);

        if (messageIds.length > 0) {
          console.log(
            `  [NOISE] Archiving ${messageIds.length} messages: ${query}`
          );
          await this.batchModify(messageIds, [], ["INBOX"]);
          this.stats.archived += messageIds.length;
        }
      } catch (err) {
        console.error(`  Error archiving noise "${query}": ${err.message}`);
        this.stats.errors++;
      }
    }
  }
}

module.exports = { GmailOrganizer };
