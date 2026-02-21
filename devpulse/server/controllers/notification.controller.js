// ────────────────────────────────────────────────────────
// Notification Controller
// Configure + trigger Discord / Gmail / combined alerts
// ────────────────────────────────────────────────────────

import discord from '../services/discord.service.js';
import gmail from '../services/gmail.service.js';
import googleCalendar from '../services/google-calendar.service.js';
import { GHOSTING_ALERTS, BLOCKERS, TEAM } from '../data/store.js';
import { computeHealthScore } from '../services/metrics.service.js';

/* ── Status ────────────────────────────────────────── */
export const getStatus = (_req, res) => {
  res.json({
    discord: discord.status,
    gmail: gmail.status,
    googleCalendar: googleCalendar.status,
  });
};

/* ── Discord ───────────────────────────────────────── */
export const configureDiscord = (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl is required' });
  discord.configure(webhookUrl);
  res.json({ status: 'configured', ...discord.status });
};

export const disconnectDiscord = (_req, res) => {
  discord.disconnect();
  res.json({ status: 'disconnected' });
};

export const testDiscord = async (_req, res) => {
  try {
    if (!discord.enabled) return res.status(400).json({ error: 'Discord not configured' });
    await discord.sendMessage('✅ **DevPulse test notification** — Discord is connected successfully!');
    res.json({ status: 'sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Gmail ─────────────────────────────────────────── */
export const configureGmail = (req, res) => {
  const { email, password, to } = req.body;
  if (!email || !password || !to) {
    return res.status(400).json({ error: 'email, password, and to are required' });
  }
  gmail.configure({ email, password, to });
  res.json({ status: 'configured', ...gmail.status });
};

export const disconnectGmail = (_req, res) => {
  gmail.disconnect();
  res.json({ status: 'disconnected' });
};

export const testGmail = async (_req, res) => {
  try {
    if (!gmail.enabled) return res.status(400).json({ error: 'Gmail not configured' });
    const result = await gmail._send(
      '✅ DevPulse Test — Gmail Connected',
      '<div style="font-family:system-ui;padding:20px;background:#1a1a2e;color:#e5e5e5;border-radius:12px;text-align:center"><h2 style="color:#10b981">✅ Gmail Connected</h2><p>DevPulse notifications are working correctly.</p></div>',
    );
    res.json({ status: 'sent', messageId: result?.messageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Google Calendar ───────────────────────────────── */
export const configureGoogleCalendar = (req, res) => {
  const { serviceAccountEmail, serviceAccountKey, clientId, clientSecret, refreshToken } = req.body;

  try {
    // Prefer service account approach
    if (serviceAccountEmail && serviceAccountKey) {
      googleCalendar.configure({ serviceAccountEmail, serviceAccountKey });
    } else if (clientId && clientSecret && refreshToken) {
      googleCalendar.configure({ clientId, clientSecret, refreshToken });
    } else {
      return res.status(400).json({
        error: 'Provide either serviceAccountEmail + serviceAccountKey, or clientId + clientSecret + refreshToken',
      });
    }
    res.json({ status: 'configured', ...googleCalendar.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const disconnectGoogleCalendar = (_req, res) => {
  googleCalendar.disconnect();
  res.json({ status: 'disconnected' });
};

export const testGoogleCalendar = async (_req, res) => {
  try {
    if (!googleCalendar.enabled) return res.status(400).json({ error: 'Google Calendar not configured' });
    const testEvent = await googleCalendar.createCheckpointEvent(
      {
        title: 'DevPulse Test Event',
        description: 'This is a test event to verify Google Calendar integration.',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        priority: 'medium',
        assigneeName: 'Test',
        createdBy: 'DevPulse',
      },
      [],
      'DevPulse Test',
    );
    res.json({ status: 'sent', event: testEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Send all ghosting alerts ──────────────────────── */
export const sendGhostingAlerts = async (_req, res) => {
  const repoName = TEAM?.repo || 'Project';
  const results = { discord: [], gmail: [], errors: [] };

  for (const alert of GHOSTING_ALERTS) {
    if (discord.enabled) {
      try {
        await discord.sendGhostingAlert(alert, repoName);
        results.discord.push(alert.name);
      } catch (err) { results.errors.push({ channel: 'discord', name: alert.name, error: err.message }); }
    }
    if (gmail.enabled) {
      try {
        await gmail.sendGhostingAlert(alert, repoName);
        results.gmail.push(alert.name);
      } catch (err) { results.errors.push({ channel: 'gmail', name: alert.name, error: err.message }); }
    }
  }

  res.json({ sent: results, total: GHOSTING_ALERTS.length });
};

/* ── Send all blocker alerts ─────────────────────────── */
export const sendBlockerAlerts = async (req, res) => {
  const severity = req.query.severity || 'critical';   // default: only critical
  const filtered = BLOCKERS.filter(b => b.severity === severity || severity === 'all');
  const repoName = TEAM?.repo || 'Project';
  const results = { discord: [], gmail: [], errors: [] };

  for (const blocker of filtered) {
    if (discord.enabled) {
      try {
        await discord.sendBlockerAlert(blocker, repoName);
        results.discord.push(blocker.id);
      } catch (err) { results.errors.push({ channel: 'discord', id: blocker.id, error: err.message }); }
    }
    if (gmail.enabled) {
      try {
        await gmail.sendBlockerAlert(blocker, repoName);
        results.gmail.push(blocker.id);
      } catch (err) { results.errors.push({ channel: 'gmail', id: blocker.id, error: err.message }); }
    }
  }

  res.json({ sent: results, total: filtered.length });
};

/* ── Send health summary ─────────────────────────────── */
export const sendHealthSummary = async (_req, res) => {
  const results = { discord: false, gmail: false, errors: [] };
  const liveHealth = computeHealthScore();

  if (discord.enabled) {
    try { await discord.sendHealthSummary(liveHealth, TEAM); results.discord = true; }
    catch (err) { results.errors.push({ channel: 'discord', error: err.message }); }
  }
  if (gmail.enabled) {
    try { await gmail.sendHealthSummary(liveHealth, TEAM); results.gmail = true; }
    catch (err) { results.errors.push({ channel: 'gmail', error: err.message }); }
  }

  res.json(results);
};
