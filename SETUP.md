# Gmail Organizer — Setup Guide

## What It Does

Runs daily on your VPS and automatically:
- Labels emails into organized folders (Negative Ions, ILC, BizBroker, Personal)
- Archives noise senders (Temu, TikTok, Realtor.com, etc.)
- Cleans up old unused labels

## Step 1: Create Gmail API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Gmail API**:
   - APIs & Services → Library → search "Gmail API" → Enable
4. Create credentials:
   - APIs & Services → Credentials → Create Credentials → **OAuth client ID**
   - Application type: **Desktop app**
   - Name: `Gmail Organizer`
   - Click Create
5. Download the JSON file and save it as `credentials.json` in the project root

## Step 2: Deploy to Your VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone the repo
git clone https://github.com/benny-boy123/gmail-organizer.git /opt/gmail-organizer
cd /opt/gmail-organizer

# Install dependencies
npm install

# Copy your credentials.json to the server
# (from your local machine)
# scp credentials.json root@your-vps-ip:/opt/gmail-organizer/
```

## Step 3: Authenticate

```bash
cd /opt/gmail-organizer
npm run auth
```

This will:
1. Print a URL — open it in your browser
2. Sign in with **benny@bpinnovations.us**
3. Copy the authorization code
4. Paste it back into the terminal
5. `token.json` gets saved — you won't need to do this again

## Step 4: Test It

```bash
# Run once to verify everything works
npm run run-once
```

You should see output like:
```
Starting Gmail organizer...
  [Negative Ions/Payments] 142 messages for: from:noreply@messaging.squareup.com
  [NOISE] Archiving 23 messages: from:@temu.com
Done! Labeled: 312 | Archived: 458 | Errors: 0
```

## Step 5: Set Up as a Service (runs daily at 6 AM)

```bash
# Copy the systemd service file
cp gmail-organizer.service /etc/systemd/system/

# Enable and start
systemctl daemon-reload
systemctl enable gmail-organizer
systemctl start gmail-organizer

# Check status
systemctl status gmail-organizer

# View logs
journalctl -u gmail-organizer -f
```

## Optional: Clean Up Old Labels

```bash
node src/index.js --cleanup
```

This removes stale labels like `✔`, `Notification`, `Unroll.me`, etc.

## Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run auth` | Set up Gmail API authentication |
| `npm run run-once` | Run organizer once and exit |
| `npm run daemon` | Start daemon (runs at 6 AM daily) |
| `node src/index.js --cleanup` | Delete old unused labels |

## Troubleshooting

**"Missing credentials.json"** — Download OAuth credentials from Google Cloud Console (Step 1)

**"Token has been expired or revoked"** — Delete `token.json` and run `npm run auth` again

**"Insufficient Permission"** — Make sure you enabled the Gmail API and authorized with the correct Google account

**Rate limit errors** — The script handles batching, but if you have a massive inbox, run `npm run run-once` multiple times
