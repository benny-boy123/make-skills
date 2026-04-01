/**
 * Gmail OAuth2 Authentication
 *
 * First-time setup:
 *   1. Place your credentials.json in the project root
 *   2. Run: npm run auth
 *   3. Open the URL it prints, authorize, paste the code back
 *   4. token.json is saved — you won't need to do this again
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.labels",
];

const CREDENTIALS_PATH = path.join(__dirname, "..", "credentials.json");
const TOKEN_PATH = path.join(__dirname, "..", "token.json");

function loadCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(
      "Missing credentials.json — download it from Google Cloud Console."
    );
    console.error("See SETUP.md for instructions.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
}

function getOAuth2Client() {
  const creds = loadCredentials();
  const { client_secret, client_id, redirect_uris } =
    creds.installed || creds.web;
  return new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris ? redirect_uris[0] : "urn:ietf:wg:oauth:2.0:oob"
  );
}

async function authorize() {
  const oAuth2Client = getOAuth2Client();

  // If we already have a token, use it
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
    oAuth2Client.setCredentials(token);

    // Auto-refresh if expired
    oAuth2Client.on("tokens", (tokens) => {
      const current = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
      const updated = { ...current, ...tokens };
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(updated, null, 2));
    });

    return oAuth2Client;
  }

  // No token — run interactive auth flow
  return getNewToken(oAuth2Client);
}

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\n=== Gmail Authorization ===\n");
  console.log("1. Open this URL in your browser:\n");
  console.log(`   ${authUrl}\n`);
  console.log("2. Authorize the app and copy the code.\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("3. Paste the code here: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code.trim(), (err, token) => {
        if (err) {
          console.error("Error getting token:", err.message);
          reject(err);
          return;
        }
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
        console.log("\nToken saved to token.json — you're all set!");
        resolve(oAuth2Client);
      });
    });
  });
}

// If run directly, do the auth flow
if (require.main === module) {
  authorize()
    .then(() => {
      console.log("Authentication successful.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Authentication failed:", err.message);
      process.exit(1);
    });
}

module.exports = { authorize };
