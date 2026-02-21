// ────────────────────────────────────────────────────────
// Gmail / SMTP Notification Service
// Uses Nodemailer with Gmail App Password
// ────────────────────────────────────────────────────────

import nodemailer from 'nodemailer';

class GmailService {
  constructor() {
    this.email = process.env.GMAIL_USER || null;
    this.password = process.env.GMAIL_APP_PASSWORD || null;
    this.to = process.env.GMAIL_TO || null;       // comma-separated recipients
    this.enabled = false;
    this.sentLog = [];
    this._transporter = null;
  }

  get status() {
    return {
      enabled: this.enabled,
      configured: Boolean(this.email && this.password),
      email: this.email || null,
      to: this.to || null,
      sent: this.sentLog.length,
    };
  }

  configure({ email, password, to }) {
    if (email) this.email = email;
    if (password) this.password = password;
    if (to) this.to = to;
    this.enabled = true;
    this._transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.email, pass: this.password },
    });
  }

  disconnect() {
    this.email = null;
    this.password = null;
    this.to = null;
    this.enabled = false;
    this._transporter = null;
  }

  /* ── Internal send helper ──────────────────────────── */
  async _send(subject, html) {
    if (!this.enabled || !this._transporter || !this.to) return null;

    const info = await this._transporter.sendMail({
      from: `"DevPulse" <${this.email}>`,
      to: this.to,
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

  /* ── Checkpoint Calendar Invite ─────────────────────── */
  async sendCheckpointInvite(checkpoint, recipientEmail, teamName = 'Project') {
    if (!this.enabled || !this._transporter || !recipientEmail) return null;

    const deadline = new Date(checkpoint.deadline);
    const now = new Date();

    // Generate ICS calendar file content
    const uid = `devpulse-${checkpoint.id}@devpulse.app`;
    const formatICSDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const dtStart = formatICSDate(deadline);
    // Event lasts 1 hour
    const dtEnd = formatICSDate(new Date(deadline.getTime() + 3600000));
    const dtStamp = formatICSDate(now);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DevPulse//Task Allocation//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:📋 ${checkpoint.title}`,
      `DESCRIPTION:${(checkpoint.description || 'No description').replace(/\n/g, '\\n')}\\n\\nPriority: ${checkpoint.priority}\\nAssigned by: ${checkpoint.createdBy || 'Lead'}`,
      `ORGANIZER;CN=DevPulse:mailto:${this.email}`,
      `ATTENDEE;CN=${checkpoint.assigneeName || 'Team Member'};RSVP=TRUE:mailto:${recipientEmail}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      `DESCRIPTION:⏰ Task "${checkpoint.title}" is due in 1 hour!`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT1440M',
      'ACTION:DISPLAY',
      `DESCRIPTION:📋 Task "${checkpoint.title}" is due tomorrow!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const priorityColors = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280' };
    const prioColor = priorityColors[checkpoint.priority] || '#3b82f6';
    const deadlineStr = deadline.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Generate Google Calendar URL for the email button
    const formatGCalDate = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const gcalParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: `📋 ${checkpoint.title}`,
      dates: `${formatGCalDate(deadline)}/${formatGCalDate(new Date(deadline.getTime() + 3600000))}`,
      details: `${checkpoint.description || 'No description'}\n\nPriority: ${checkpoint.priority}\nAssigned by: ${checkpoint.createdBy || 'Lead'}\n\n— Added via DevPulse`,
      sf: 'true',
    });
    const googleCalUrl = `https://calendar.google.com/calendar/render?${gcalParams.toString()}`;

    const subject = `📅 New Task Assigned: ${checkpoint.title} — ${teamName}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#1a1a2e;color:#e5e5e5;border-radius:12px;overflow:hidden">
        <div style="padding:24px 28px;border-bottom:1px solid #333">
          <h2 style="margin:0;color:#3b82f6;font-size:18px">📋 New Task Assigned</h2>
          <p style="margin:4px 0 0;color:#888;font-size:13px">${teamName}</p>
        </div>
        <div style="padding:24px 28px">
          <h3 style="margin:0 0 12px;font-size:17px;color:#e5e5e5">${checkpoint.title}</h3>
          ${checkpoint.description ? `<p style="margin:0 0 16px;color:#aaa;font-size:14px">${checkpoint.description}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr>
              <td style="padding:8px 0;color:#888">Priority</td>
              <td style="padding:8px 0"><span style="color:${prioColor};font-weight:600;text-transform:uppercase">${checkpoint.priority}</span></td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888">Deadline</td>
              <td style="padding:8px 0;font-weight:600;color:#f59e0b">${deadlineStr}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#888">Assigned To</td>
              <td style="padding:8px 0;font-weight:600">${checkpoint.assigneeName || 'You'}</td>
            </tr>
          </table>
          <div style="margin-top:20px;text-align:center">
            <a href="${googleCalUrl}" target="_blank" style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">📅 Add to Google Calendar</a>
          </div>
          <div style="margin-top:16px;padding:14px;background:#151525;border-radius:8px;text-align:center">
            <p style="margin:0;color:#888;font-size:12px">You can also open the attached .ics file to add this event to any calendar app.</p>
          </div>
        </div>
        <div style="padding:16px 28px;background:#151525;font-size:12px;color:#666;text-align:center">
          Sent by DevPulse · ${new Date().toLocaleString()}
        </div>
      </div>
    `;

    // Send with .ics attachment
    const info = await this._transporter.sendMail({
      from: `"DevPulse" <${this.email}>`,
      to: recipientEmail,
      subject,
      html,
      icalEvent: {
        filename: 'invite.ics',
        method: 'REQUEST',
        content: icsContent,
      },
      attachments: [{
        filename: `${checkpoint.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
        content: icsContent,
        contentType: 'text/calendar',
      }],
    });

    const entry = { messageId: info.messageId, subject, sentAt: new Date().toISOString(), type: 'checkpoint_invite' };
    this.sentLog.unshift(entry);
    if (this.sentLog.length > 50) this.sentLog.length = 50;
    return entry;
  }
}

export const gmail = new GmailService();
export default gmail;

