// ────────────────────────────────────────────────────────
// Notification Controller
// Configure + trigger Discord / Gmail / combined alerts
// ────────────────────────────────────────────────────────

import discord from '../services/discord.service.js';
import gmail from '../services/gmail.service.js';
import { GHOSTING_ALERTS, BLOCKERS, HEALTH_SCORE, TEAM } from '../data/store.js';

/* ── Status ────────────────────────────────────────── */
export const getStatus = (_req, res) => {
  res.json({
    discord: discord.status,
    gmail:   gmail.status,
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

  if (discord.enabled) {
    try { await discord.sendHealthSummary(HEALTH_SCORE, TEAM); results.discord = true; }
    catch (err) { results.errors.push({ channel: 'discord', error: err.message }); }
  }
  if (gmail.enabled) {
    try { await gmail.sendHealthSummary(HEALTH_SCORE, TEAM); results.gmail = true; }
    catch (err) { results.errors.push({ channel: 'gmail', error: err.message }); }
  }

  res.json(results);
};
