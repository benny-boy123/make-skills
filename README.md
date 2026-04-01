# Gmail Organizer

Automated Gmail inbox manager that runs daily on your VPS. Labels, archives, and cleans up emails based on configurable rules.

## Features

- **Auto-labeling** — Sorts emails into organized folders (Negative Ions, ILC, BizBroker, Personal)
- **Noise archival** — Silently archives junk from Temu, TikTok, Realtor.com, CNN, etc.
- **Old label cleanup** — Removes stale labels from previous systems
- **Daily daemon** — Runs at 6 AM via systemd on your VPS

## Quick Start

```bash
npm install
npm run auth          # One-time Gmail API setup
npm run run-once      # Test it
npm run daemon        # Start the daily scheduler
```

See [SETUP.md](SETUP.md) for full deployment instructions.

## Project Structure

```
├── src/
│   ├── index.js       # CLI entry point + cron scheduler
│   ├── auth.js        # Gmail OAuth2 authentication
│   ├── organizer.js   # Core labeling/archiving logic
│   └── rules.js       # All label rules and noise queries
├── gmail-organizer.service  # systemd unit file for VPS
├── gmail-bulk-organizer.js  # Original Google Apps Script version
├── gmail-filter-reference.md
├── SETUP.md
└── package.json
```
