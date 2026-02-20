// ────────────────────────────────────────────────────────
// Google OAuth2 Refresh Token Generator for DevPulse
// Run:  node get-refresh-token.js
//
// Uses the OAuth Playground redirect URI so no extra
// redirect URI setup is needed in Google Cloud Console.
// ────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';
import readline from 'readline';

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Use the OAuth Playground redirect URI — it's pre-whitelisted
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/calendar'],
});

console.log('\n🔑 Google OAuth2 — Refresh Token Generator\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nSTEP 1: Open this URL in your browser:\n');
console.log(`  ${authUrl}\n`);
console.log('STEP 2: Sign in with your Google account and allow access.');
console.log('');
console.log('STEP 3: After you click "Allow", Google will redirect you to');
console.log('        the OAuth Playground page. Look at the URL bar —');
console.log('        it will contain a "code" parameter like:');
console.log('');
console.log('        https://developers.google.com/oauthplayground?code=4/0A...');
console.log('');
console.log('        Copy EVERYTHING after "code=" (up to & or end of URL).');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the authorization code here: ', async (code) => {
  rl.close();
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    console.error('❌ No code provided.');
    process.exit(1);
  }

  try {
    // Decode in case user copied URL-encoded version
    const decodedCode = decodeURIComponent(trimmedCode);
    const { tokens } = await oauth2Client.getToken(decodedCode);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! Tokens received:\n');
    console.log('Access Token :', tokens.access_token?.slice(0, 40) + '…');
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('Expiry       :', new Date(tokens.expiry_date).toLocaleString());
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Add this to your .env file:\n');
    console.log(`   GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    console.log('Then restart your server. Google Calendar events will');
    console.log('be created automatically when checkpoints are added! 🎉\n');

  } catch (err) {
    console.error('\n❌ Failed to exchange code for tokens:', err.message);
    console.error('\nCommon fixes:');
    console.error('  • Make sure you copied the FULL code from the URL bar');
    console.error('  • The code can only be used once — get a new one if reusing');
    console.error('  • Ensure "https://developers.google.com/oauthplayground"');
    console.error('    is listed as an Authorized Redirect URI in your');
    console.error('    Google Cloud Console OAuth credentials.\n');
    process.exit(1);
  }
});
