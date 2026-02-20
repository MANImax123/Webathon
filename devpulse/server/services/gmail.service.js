// ────────────────────────────────────────────────────────
// Gmail / SMTP Notification Service
// Uses Nodemailer with Gmail App Password
// ────────────────────────────────────────────────────────

import nodemailer from 'nodemailer';

class GmailService {
  constructor() {
    this.email    = process.env.GMAIL_USER || null;
    this.password = process.env.GMAIL_APP_PASSWORD || null;
    this.to       = process.env.GMAIL_TO || null;       // comma-separated recipients
    this.enabled  = false;
    this.sentLog  = [];
    this._transporter = null;
  }

  get status() {
    return {
      enabled:    this.enabled,
      configured: Boolean(this.email && this.password),
      email:      this.email || null,
      to:         this.to || null,
      sent:       this.sentLog.length,
    };
  }

  configure({ email, password, to }) {
    if (email)    this.email    = email;
    if (password) this.password = password;
    if (to)       this.to       = to;
    this.enabled = true;
    this._transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.email, pass: this.password },
    });
  }

  disconnect() {
    this.email    = null;
    this.password = null;
    this.to       = null;
    this.enabled  = false;
    this._transporter = null;
  }

  /* ── Internal send helper ──────────────────────────── */
  async _send(subject, html) {
    if (!this.enabled || !this._transporter || !this.to) return null;

    const info = await this._transporter.sendMail({
      from:    `"DevPulse" <${this.email}>`,
      to:      this.to,
      subject,
      html,
    });

    const entry = { messageId: info.messageId, subject, sentAt: new Date().toISOString() };
    this.sentLog.unshift(entry);
    if (this.sentLog.length > 50) this.sentLog.length = 50;
    return entry;
  }

  /* ── Ghosting Alert ────────────────────────────────── */
  async sendGhostingAlert(alert, repoName = 'Project') {
    const urgencyColor = alert.daysSinceCommit >= 5 ? '#ef4444' : '#f59e0b';
    const subject = `👻 Ghosting Alert: ${alert.name} — ${repoName}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#1a1a2e;color:#e5e5e5;border-radius:12px;overflow:hidden">
        <div style="padding:24px 28px;border-bottom:1px solid #333">
          <h2 style="margin:0;color:${urgencyColor};font-size:18px">👻 Ghosting Detected</h2>
          <p style="margin:4px 0 0;color:#888;font-size:13px">${repoName}</p>
        </div>
        <div style="padding:24px 28px">
          <p style="margin:0 0 16px;font-size:15px">${alert.alert}</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr>
              <td style="padding:8px 0;color:#888">Member</td>
              <td style="padding:8px 0;font-weight:600">${alert.name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888">Last Commit</td>
              <td style="padding:8px 0;color:${urgencyColor};font-weight:600">${alert.daysSinceCommit} days ago</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888">Alert Type</td>
              <td style="padding:8px 0">${(alert.type || 'inactive').replace(/_/g, ' ')}</td>
            </tr>
          </table>
        </div>
        <div style="padding:16px 28px;background:#151525;font-size:12px;color:#666;text-align:center">
          Sent by DevPulse · ${new Date().toLocaleString()}
        </div>
      </div>
    `;
    return this._send(subject, html);
  }

  /* ── Blocker Alert ─────────────────────────────────── */
  async sendBlockerAlert(blocker, repoName = 'Project') {
    const colorMap = { critical: '#ef4444', high: '#f59e0b', medium: '#eab308', low: '#3b82f6' };
    const color = colorMap[blocker.severity] || '#888';
    const subject = `🚨 ${blocker.severity.toUpperCase()} Blocker: ${blocker.title.slice(0, 60)} — ${repoName}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#1a1a2e;color:#e5e5e5;border-radius:12px;overflow:hidden">
        <div style="padding:24px 28px;border-bottom:1px solid #333">
          <h2 style="margin:0;color:${color};font-size:18px">🚨 ${blocker.severity.toUpperCase()} Blocker</h2>
          <p style="margin:4px 0 0;color:#888;font-size:13px">${repoName}</p>
        </div>
        <div style="padding:24px 28px">
          <p style="margin:0 0 8px;font-size:15px;font-weight:600">${blocker.title}</p>
          <p style="margin:0 0 16px;color:#aaa;font-size:14px">${blocker.description}</p>
          <div style="font-size:13px;color:#888">
            Affected: <span style="color:#e5e5e5">${blocker.affectedModules?.join(', ') || '—'}</span>
          </div>
        </div>
        <div style="padding:16px 28px;background:#151525;font-size:12px;color:#666;text-align:center">
          Sent by DevPulse · ${new Date().toLocaleString()}
        </div>
      </div>
    `;
    return this._send(subject, html);
  }

  /* ── Health Summary ────────────────────────────────── */
  async sendHealthSummary(health, team) {
    const emoji = health.overall >= 70 ? '🟢' : health.overall >= 40 ? '🟡' : '🔴';
    const color = health.overall >= 70 ? '#10b981' : health.overall >= 40 ? '#f59e0b' : '#ef4444';
    const subject = `${emoji} Health Report: ${health.overall}/100 — ${team?.repo || 'Project'}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#1a1a2e;color:#e5e5e5;border-radius:12px;overflow:hidden">
        <div style="padding:24px 28px;border-bottom:1px solid #333">
          <h2 style="margin:0;color:${color};font-size:20px">${emoji} Score: ${health.overall}/100</h2>
          <p style="margin:4px 0 0;color:#888;font-size:13px">${team?.repo || 'Project'}</p>
        </div>
        <div style="padding:24px 28px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr>
              <td style="padding:8px 0;color:#888">Delivery Risk</td>
              <td style="padding:8px 0;font-weight:600">${health.breakdown?.deliveryRisk ?? '—'}%</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888">Integration Risk</td>
              <td style="padding:8px 0;font-weight:600">${health.breakdown?.integrationRisk ?? '—'}%</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888">Stability Risk</td>
              <td style="padding:8px 0;font-weight:600">${health.breakdown?.stabilityRisk ?? '—'}%</td>
            </tr>
          </table>
        </div>
        <div style="padding:16px 28px;background:#151525;font-size:12px;color:#666;text-align:center">
          Sent by DevPulse · ${new Date().toLocaleString()}
        </div>
      </div>
    `;
    return this._send(subject, html);
  }
}

export const gmail = new GmailService();
export default gmail;
