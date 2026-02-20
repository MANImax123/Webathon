// ────────────────────────────────────────────────────────
// Discord Webhook Service
// Sends rich embed notifications to a Discord channel
// ────────────────────────────────────────────────────────

class DiscordService {
  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || null;
    this.enabled    = Boolean(this.webhookUrl);
    this.sentLog    = [];           // last 50 sent notifications
  }

  get status() {
    return {
      enabled:    this.enabled,
      configured: Boolean(this.webhookUrl),
      webhookUrl: this.webhookUrl ? '••••' + this.webhookUrl.slice(-20) : null,
      sent:       this.sentLog.length,
    };
  }

  configure(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.enabled    = true;
  }

  disconnect() {
    this.webhookUrl = null;
    this.enabled    = false;
  }

  /* ── Send a raw Discord webhook message ────────────── */
  async _send(payload) {
    if (!this.webhookUrl || !this.enabled) return null;

    const res = await fetch(this.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Discord webhook ${res.status}: ${text}`);
    }

    const entry = { type: payload._type || 'message', sentAt: new Date().toISOString() };
    this.sentLog.unshift(entry);
    if (this.sentLog.length > 50) this.sentLog.length = 50;
    return entry;
  }

  /* ── Ghosting Alert ────────────────────────────────── */
  async sendGhostingAlert(alert, repoName = 'unknown') {
    const color = alert.daysSinceCommit >= 5 ? 0xef4444 : 0xf59e0b;  // red : amber
    return this._send({
      _type: 'ghosting',
      username:   'DevPulse',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
      embeds: [{
        title:       `👻 Ghosting Alert — ${alert.name}`,
        description: alert.alert,
        color,
        fields: [
          { name: 'Last Commit',      value: `${alert.daysSinceCommit} days ago`, inline: true },
          { name: 'Type',             value: alert.type?.replace(/_/g, ' ') || 'inactive', inline: true },
          { name: 'Repository',       value: repoName, inline: true },
        ],
        footer:    { text: 'DevPulse Ghosting Detector' },
        timestamp: new Date().toISOString(),
      }],
    });
  }

  /* ── Blocker Alert ─────────────────────────────────── */
  async sendBlockerAlert(blocker, repoName = 'unknown') {
    const colorMap = { critical: 0xef4444, high: 0xf59e0b, medium: 0xeab308, low: 0x3b82f6 };
    return this._send({
      _type: 'blocker',
      username:   'DevPulse',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
      embeds: [{
        title:       `🚨 ${blocker.severity.toUpperCase()} Blocker`,
        description: `**${blocker.title}**\n${blocker.description}`,
        color:       colorMap[blocker.severity] || 0x6b7280,
        fields: [
          { name: 'Severity',          value: blocker.severity, inline: true },
          { name: 'Type',              value: blocker.type?.replace(/_/g, ' '), inline: true },
          { name: 'Affected Modules',  value: blocker.affectedModules?.join(', ') || '—', inline: false },
          { name: 'Repository',        value: repoName, inline: true },
        ],
        footer:    { text: 'DevPulse Risk Engine' },
        timestamp: new Date().toISOString(),
      }],
    });
  }

  /* ── Custom message ────────────────────────────────── */
  async sendMessage(text) {
    return this._send({
      _type:      'custom',
      username:   'DevPulse',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
      content:    text,
    });
  }

  /* ── Health summary ────────────────────────────────── */
  async sendHealthSummary(health, team) {
    const emoji = health.overall >= 70 ? '🟢' : health.overall >= 40 ? '🟡' : '🔴';
    return this._send({
      _type: 'health',
      username:   'DevPulse',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
      embeds: [{
        title:       `${emoji} Health Report — ${team?.repo || 'Project'}`,
        description: `**Overall Score: ${health.overall}/100**`,
        color:       health.overall >= 70 ? 0x10b981 : health.overall >= 40 ? 0xf59e0b : 0xef4444,
        fields: [
          { name: 'Delivery Risk',    value: `${health.breakdown?.deliveryRisk ?? '—'}%`, inline: true },
          { name: 'Integration Risk', value: `${health.breakdown?.integrationRisk ?? '—'}%`, inline: true },
          { name: 'Stability Risk',   value: `${health.breakdown?.stabilityRisk ?? '—'}%`, inline: true },
        ],
        footer:    { text: 'DevPulse Health Monitor' },
        timestamp: new Date().toISOString(),
      }],
    });
  }
}

export const discord = new DiscordService();
export default discord;
