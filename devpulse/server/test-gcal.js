// Quick diagnostic script: node test-gcal.js
import dotenv from 'dotenv';
dotenv.config();
import { google } from 'googleapis';
import { readFileSync, existsSync } from 'fs';

console.log('\n=== Google Calendar Diagnostic ===\n');

// 1. Check env vars
const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key   = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL:', email ? `✅ set (${email})` : '❌ not set');
console.log('GOOGLE_SERVICE_ACCOUNT_KEY:  ', key   ? `✅ set (${key.substring(0, 30)}...)` : '❌ not set');
console.log('GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', keyFile || '❌ not set');
console.log('GOOGLE_CALENDAR_ID:          ', calendarId);
console.log();

let authEmail, authKey;

// Try key file first
if (keyFile) {
  if (!existsSync(keyFile)) {
    console.error(`❌ Key file not found: ${keyFile}`);
    process.exit(1);
  }
  const creds = JSON.parse(readFileSync(keyFile, 'utf-8'));
  authEmail = creds.client_email;
  authKey = creds.private_key;
  console.log('📄 Using credentials from key file');
  console.log('   client_email:', authEmail);
  console.log('   private_key starts with:', authKey.substring(0, 40));
  console.log('   private_key length:', authKey.length, 'chars');
} else if (email && key) {
  authEmail = email;
  authKey = key.replace(/\\n/g, '\n');
  console.log('📄 Using inline env var credentials');
  console.log('   private_key starts with:', authKey.substring(0, 40));
  console.log('   private_key length:', authKey.length, 'chars');
  console.log('   contains real newlines:', authKey.includes('\n'));
  console.log('   starts with BEGIN PRIVATE KEY:', authKey.startsWith('-----BEGIN PRIVATE KEY-----'));
  console.log('   ends with END PRIVATE KEY:', authKey.trimEnd().endsWith('-----END PRIVATE KEY-----'));
} else {
  console.error('❌ No service account credentials found. Set either:');
  console.error('   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./path-to-key.json');
  console.error('   or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_KEY');
  process.exit(1);
}

console.log('\n--- Attempting JWT authorization ---\n');

const auth = new google.auth.JWT({
  email: authEmail,
  key: authKey,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

try {
  const tokens = await auth.authorize();
  console.log('✅ Authorization SUCCESSFUL!');
  console.log('   Access token:', tokens.access_token?.substring(0, 20) + '...');
  console.log('   Expires:', new Date(tokens.expiry_date).toISOString());
} catch (err) {
  console.error('❌ Authorization FAILED:', err.message);
  if (err.message.includes('PEM')) {
    console.error('\n   → Private key is malformed. Make sure the full PEM key is in the .env');
    console.error('   → Easiest fix: use GOOGLE_SERVICE_ACCOUNT_KEY_FILE pointing to the JSON file');
  }
  if (err.message.includes('invalid_grant') || err.message.includes('unauthorized')) {
    console.error('\n   → Service account may not have Calendar API enabled');
    console.error('   → Go to: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com');
  }
  process.exit(1);
}

console.log('\n--- Attempting to list events from calendar ---\n');
const calendar = google.calendar({ version: 'v3', auth });

try {
  const res = await calendar.events.list({
    calendarId,
    maxResults: 1,
    timeMin: new Date().toISOString(),
  });
  console.log(`✅ Calendar access successful! Found ${res.data.items?.length || 0} upcoming event(s).`);
  console.log('\n🎉 Everything is working! Google Calendar integration is ready.\n');
} catch (err) {
  console.error('❌ Calendar access FAILED:', err.message);
  if (err.code === 404) {
    console.error(`\n   → Calendar "${calendarId}" not found or not shared with the service account.`);
    console.error(`   → Share your calendar with: ${authEmail}`);
    console.error('   → Permission needed: "Make changes to events"');
  } else if (err.code === 403) {
    console.error(`\n   → Permission denied. Share your calendar with: ${authEmail}`);
    console.error('   → Go to Google Calendar → Settings → Share with specific people');
    console.error('   → Permission needed: "Make changes to events"');
  }
  process.exit(1);
}
