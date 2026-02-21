// ────────────────────────────────────────────────────────
// Discord Bot Service — OpenRouter AI–Powered Q&A Bot
// + Hourly commit polling & inactivity alerts
// + Follow-up re-ping if no reply within 10 minutes
// ────────────────────────────────────────────────────────
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import * as store from '../data/store.js';
import github from '../services/github.service.js';
import { syncFromGitHub } from '../services/analytics.service.js';

// ── Config constants ────────────────────────────────────
const POLL_INTERVAL_MS      = 2 * 60 * 1000;     // 2 minutes (testing)
const INACTIVITY_THRESHOLD  = 5 * 60 * 1000;     // 5 minutes (testing)
const FOLLOWUP_WAIT_MS      = 10 * 60 * 1000;    // 10 minutes
const MAX_FOLLOWUPS         = 3;                  // max re-pings

// ── OpenRouter API helper ────────────────────────────────
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-12b-it:free';

async function callOpenRouter(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'PASTE_YOUR_OPENROUTER_API_KEY_HERE') return null;

  // Merge system + user into a single user message
  // (Google models via AI Studio don't support the system role)
  const combinedMessage = `${systemPrompt}\n\nUSER QUESTION: ${userMessage}`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://devpulse.app',
      'X-Title': 'DevPulse',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'user', content: combinedMessage },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`OpenRouter ${res.status}: ${body.error?.message || JSON.stringify(body)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

class DiscordBotService {
  constructor() {
    this.client   = null;
    this.token    = process.env.DISCORD_BOT_TOKEN || null;
    this.ready    = false;
    this.aiReady  = false;

    // ── Deduplication — prevents replying twice to the same message ──
    this._processedMessages = new Set();

    // ── Inactivity tracking ──────────────────────────
    this._pollTimer       = null;    // setInterval handle
    this._followUpTimers  = new Map(); // memberId → timer
    this._pendingPings    = new Map(); // memberId → { channelId, count, msgId }
    this._alertChannelId  = process.env.DISCORD_ALERT_CHANNEL_ID || null;
    // Map GitHub usernames to Discord user IDs (set via !dp link @user github-login)
    this._discordMap      = new Map(); // github login → discord userId

    // Check OpenRouter key
    const orKey = process.env.OPENROUTER_API_KEY;
    if (orKey && orKey !== 'PASTE_YOUR_OPENROUTER_API_KEY_HERE') {
      this.aiReady = true;
      console.log(`🧠 OpenRouter AI initialized (${OPENROUTER_MODEL}) for Discord bot`);
    } else {
      console.log('⚠️  OPENROUTER_API_KEY not set — AI responses disabled, keyword fallback only');
    }
  }

  /* ── Start the bot ─────────────────────────────────── */
  async start() {
    if (!this.token || this.token === 'PASTE_YOUR_BOT_TOKEN_HERE') {
      console.log('⚠️  DISCORD_BOT_TOKEN not set — bot disabled');
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
    });

    this.client.on('clientReady', () => {
      console.log(`🤖 Discord bot online as ${this.client.user.tag}`);
      this.ready = true;

      // Auto-detect alert channel (first text channel bot can write in)
      if (!this._alertChannelId) {
        const ch = this.client.channels.cache.find(
          c => c.type === 0 && c.permissionsFor?.(this.client.user)?.has('SendMessages'),
        );
        if (ch) {
          this._alertChannelId = ch.id;
          console.log(`📢 Auto-detected alert channel: #${ch.name} (${ch.id})`);
        }
      }

      // Start hourly commit polling & inactivity checks
      this._startPolling();
    });

    this.client.on('messageCreate', (msg) => this._handleMessage(msg));

    this.client.on('error', (err) => {
      console.error('Discord bot error:', err.message);
    });

    // ── Graceful shutdown — destroy client so nodemon restarts don't duplicate ──
    const shutdown = () => {
      console.log('🔌 Shutting down Discord bot…');
      this.stop().catch(() => {});
    };
    process.removeAllListeners('SIGINT');   // avoid stacking listeners on hot-reload
    process.removeAllListeners('SIGTERM');
    process.on('SIGINT',  shutdown);
    process.on('SIGTERM', shutdown);

    try {
      await this.client.login(this.token);
    } catch (err) {
      console.error('❌ Discord bot login failed:', err.message);
    }
  }

  /* ══════════════════════════════════════════════════════
     REPO CONNECTION NOTIFICATIONS (called by github controller)
     ══════════════════════════════════════════════════════ */

  /**
   * Called when the website connects to a GitHub repo.
   * Announces in the alert channel and triggers an immediate poll.
   */
  async notifyRepoConnected({ owner, repo, user, permission } = {}) {
    console.log(`🔗 [Bot] Repo connected: ${owner}/${repo} (by ${user?.login || 'unknown'}, perm: ${permission})`);

    // Announce in the alert channel
    if (this.ready && this._alertChannelId) {
      try {
        const channel = await this.client.channels.fetch(this._alertChannelId).catch(() => null);
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle('🔗 Repository Connected')
            .setDescription(
              `**${owner}/${repo}** is now being tracked.\n\n` +
              `Connected by: **${user?.login || 'unknown'}** (${permission || 'unknown'})\n` +
              `Commit polling and inactivity monitoring are now **active**.\n\n` +
              `Ask me anything about the project with \`!dp\` or @mention me!`
            )
            .setFooter({ text: 'DevPulse' })
            .setTimestamp();
          await channel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.warn('📢 Could not announce repo connection:', err.message);
      }
    }

    // Trigger an immediate poll so the bot has fresh data
    setTimeout(() => this._pollAndCheck(), 5_000);
  }

  /**
   * Called when the website disconnects from the GitHub repo.
   * Announces and stops active pings.
   */
  async notifyRepoDisconnected() {
    console.log('🔗 [Bot] Repo disconnected');

    // Clear follow-up timers — repo data is gone
    for (const t of this._followUpTimers.values()) clearTimeout(t);
    this._followUpTimers.clear();
    this._pendingPings.clear();

    if (this.ready && this._alertChannelId) {
      try {
        const channel = await this.client.channels.fetch(this._alertChannelId).catch(() => null);
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(0xef4444)
            .setTitle('🔌 Repository Disconnected')
            .setDescription(
              'The GitHub repository has been disconnected.\n' +
              'Commit polling and inactivity monitoring are **paused** until a new repo is connected.\n\n' +
              'Connect a repo on the DevPulse website to resume.'
            )
            .setFooter({ text: 'DevPulse' })
            .setTimestamp();
          await channel.send({ embeds: [embed] });
        }
      } catch (err) {
        console.warn('📢 Could not announce repo disconnection:', err.message);
      }
    }
  }

  /* ── Stop the bot ──────────────────────────────────── */
  async stop() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    for (const t of this._followUpTimers.values()) clearTimeout(t);
    this._followUpTimers.clear();
    this._pendingPings.clear();
    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.ready  = false;
    }
  }

  get status() {
    return {
      ready:  this.ready,
      user:   this.client?.user?.tag || null,
      ai:     this.aiReady,
    };
  }

  /* ══════════════════════════════════════════════════════
     HOURLY COMMIT POLLING & INACTIVITY ALERTS
     ══════════════════════════════════════════════════════ */

  _startPolling() {
    // Run first check 30 seconds after boot (let GitHub sync finish first)
    setTimeout(() => this._pollAndCheck(), 30_000);
    // Then repeat every POLL_INTERVAL_MS (1 hour)
    this._pollTimer = setInterval(() => this._pollAndCheck(), POLL_INTERVAL_MS);
    console.log(`⏰ Commit polling started — every ${POLL_INTERVAL_MS / 60000} min, inactivity threshold ${INACTIVITY_THRESHOLD / 60000} min`);
  }

  /** Sync from GitHub + check each member's last commit time */
  async _pollAndCheck() {
    if (!github.isConfigured) {
      console.log('🔄 [Poll] Skipped — no GitHub repo connected. Connect a repo on the website first.');
      return;
    }
    console.log(`🔄 [Poll] Syncing from ${github.owner}/${github.repo}…`);
    try {
      await syncFromGitHub();
      console.log('🔄 [Poll] Sync complete — checking inactivity…');
    } catch (err) {
      console.warn('🔄 [Poll] GitHub sync failed:', err.message);
    }
    await this._checkInactivity();
  }

  /** Check every member's last commit against INACTIVITY_THRESHOLD */
  async _checkInactivity() {
    const members = store.TEAM?.members || [];
    const commits = store.COMMITS || [];
    const now = Date.now();

    for (const member of members) {
      const memberCommits = commits.filter(c => c.author === member.id);
      const lastCommit = memberCommits.length > 0
        ? new Date(memberCommits.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date)
        : null;

      const gap = lastCommit ? now - lastCommit.getTime() : Infinity;
      const gapHours = Math.round(gap / 3600000 * 10) / 10;

      if (gap >= INACTIVITY_THRESHOLD && !this._pendingPings.has(member.id)) {
        console.log(`⚠️  [Inactivity] ${member.name} — no commits in ${gapHours}h`);
        await this._sendInactivityAlert(member, gapHours, lastCommit);
      }
    }
  }

  /** Send an inactivity alert to the channel, tagging the user if linked */
  async _sendInactivityAlert(member, gapHours, lastCommitDate) {
    const channel = this._alertChannelId
      ? await this.client.channels.fetch(this._alertChannelId).catch(() => null)
      : null;
    if (!channel) {
      console.warn('📢 No alert channel available — cannot send inactivity ping');
      return;
    }

    // Build the mention string
    const discordId = this._discordMap.get(member.name?.toLowerCase())
                   || this._discordMap.get(member._login?.toLowerCase());
    const mention = discordId ? `<@${discordId}>` : `**${member.name}**`;

    const lastStr = lastCommitDate
      ? `<t:${Math.floor(lastCommitDate.getTime() / 1000)}:R>`
      : 'never';

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('⚠️ Inactivity Alert')
      .setDescription(
        `${mention} — No commits detected in the last **${gapHours} hours**.\n` +
        `Last commit: ${lastStr}\n\n` +
        `What's blocking you? Please reply within **10 minutes** with a status update.\n` +
        `Use: \`!dp status <your update>\``
      )
      .setFooter({ text: 'DevPulse Inactivity Monitor' })
      .setTimestamp();

    try {
      const sent = await channel.send({ content: mention !== `**${member.name}**` ? mention : undefined, embeds: [embed] });
      // Track this ping for follow-up
      this._pendingPings.set(member.id, { channelId: channel.id, count: 1, msgId: sent.id, memberName: member.name });
      // Schedule follow-up if no reply
      this._scheduleFollowUp(member);
      console.log(`📢 Inactivity alert sent for ${member.name} in #${channel.name}`);
    } catch (err) {
      console.error(`📢 Failed to send alert for ${member.name}:`, err.message);
    }
  }

  /** Schedule a follow-up re-ping if no reply within FOLLOWUP_WAIT_MS */
  _scheduleFollowUp(member) {
    // Clear any existing timer
    if (this._followUpTimers.has(member.id)) {
      clearTimeout(this._followUpTimers.get(member.id));
    }

    const timer = setTimeout(async () => {
      this._followUpTimers.delete(member.id);
      const pending = this._pendingPings.get(member.id);
      if (!pending) return; // They replied, ping was cleared

      if (pending.count >= MAX_FOLLOWUPS) {
        // Max follow-ups reached — escalate
        const channel = await this.client.channels.fetch(pending.channelId).catch(() => null);
        if (channel) {
          const discordId = this._discordMap.get(member.name?.toLowerCase())
                         || this._discordMap.get(member._login?.toLowerCase());
          const mention = discordId ? `<@${discordId}>` : `**${member.name}**`;
          await channel.send({
            content: `🚨 ${mention} has not responded after **${MAX_FOLLOWUPS} pings**. Team leads, please check in manually.`,
          }).catch(() => {});
        }
        this._pendingPings.delete(member.id);
        console.log(`🚨 Max follow-ups reached for ${member.name} — escalated`);
        return;
      }

      // Send follow-up
      const channel = await this.client.channels.fetch(pending.channelId).catch(() => null);
      if (channel) {
        const discordId = this._discordMap.get(member.name?.toLowerCase())
                       || this._discordMap.get(member._login?.toLowerCase());
        const mention = discordId ? `<@${discordId}>` : `**${member.name}**`;
        const count = pending.count + 1;

        await channel.send({
          content: `⏰ **Follow-up #${count}** — ${mention}, you haven't replied yet. What's your current status? Reply with \`!dp status <update>\``,
        }).catch(() => {});

        pending.count = count;
        console.log(`⏰ Follow-up #${count} sent for ${member.name}`);
        // Schedule next follow-up
        this._scheduleFollowUp(member);
      }
    }, FOLLOWUP_WAIT_MS);

    this._followUpTimers.set(member.id, timer);
  }

  /** Called when a member replies — clears their pending ping */
  _clearPendingPing(memberName) {
    const members = store.TEAM?.members || [];
    const member = members.find(m =>
      m.name.toLowerCase() === memberName.toLowerCase() ||
      m._login?.toLowerCase() === memberName.toLowerCase()
    );
    if (member && this._pendingPings.has(member.id)) {
      this._pendingPings.delete(member.id);
      if (this._followUpTimers.has(member.id)) {
        clearTimeout(this._followUpTimers.get(member.id));
        this._followUpTimers.delete(member.id);
      }
      console.log(`✅ Pending ping cleared for ${member.name}`);
      return true;
    }
    return false;
  }

  /* ── Build project context for Gemini ──────────────── */
  _buildProjectContext() {
    const h  = store.HEALTH_SCORE || {};
    const tm = store.TEAM?.members || [];
    const bl = store.BLOCKERS || [];
    const gh = store.GHOSTING_ALERTS || [];
    const bf = store.BUS_FACTOR || {};
    const pr = store.PULL_REQUESTS || [];
    const aw = store.ACTIVE_WORK || [];
    const vd = store.VELOCITY_DATA || [];
    const ir = store.INTEGRATION_RISKS || [];
    const cs = store.CONTRIBUTION_STATS || [];
    const ch = store.COMMIT_HONESTY || [];
    const cp = store.CHECKPOINTS || [];
    const commits = store.COMMITS || [];

    // Compute per-member last commit time
    const now = Date.now();
    const memberActivity = tm.map(m => {
      const mc = commits.filter(c => c.author === m.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const last = mc[0] ? new Date(mc[0].date) : null;
      const hoursAgo = last ? Math.round((now - last.getTime()) / 3600000 * 10) / 10 : null;
      return { name: m.name, role: m.role, lastCommit: last?.toISOString() || 'never', hoursAgo, totalCommits: mc.length };
    });

    return `
=== DEVPULSE PROJECT DATA (live) ===

HEALTH SCORE: ${h.overall ?? '?'}/100
  - Code Quality: ${h.codeQuality ?? '?'}/100
  - Collaboration: ${h.collaboration ?? '?'}/100  
  - Velocity: ${h.velocity ?? '?'}/100
  - Delivery Risk: ${h.deliveryRisk ?? '?'}/100
  - Trend: ${h.trend || '?'}
  - Status: ${h.status || '?'}

TEAM (${tm.length} members) — ACTIVITY:
${memberActivity.map(m => {
  const s = cs.find(c => (c.name || c.author || '') === m.name);
  return `  - ${m.name} (${m.role || 'member'}) — ${s?.commits ?? m.totalCommits ?? '?'} commits, last commit: ${m.hoursAgo != null ? m.hoursAgo + 'h ago' : 'never'}, +${s?.additions ?? s?.linesAdded ?? '?'}/-${s?.deletions ?? s?.linesRemoved ?? '?'} lines`;
}).join('\n')}

CHECKPOINTS / TASKS (${cp.length}):
${cp.map(c => `  - [${c.status}] "${c.title}" assigned to ${c.assigneeName || c.assignee} — priority: ${c.priority}, deadline: ${c.deadline}, progress: ${c.progress ?? 0}%`).join('\n') || '  None'}

RECENT COMMITS (last 10):
${commits.slice(0, 10).map(c => {
  const author = tm.find(m => m.id === c.author);
  return `  - ${author?.name || c.author}: "${c.message}" (${c.date}) +${c.additions}/-${c.deletions}`;
}).join('\n') || '  None'}

BLOCKERS (${bl.length}):
${bl.map(b => `  - [${b.severity}] ${b.title}: ${b.description || '—'} (assigned: ${b.assignee || 'unassigned'})`).join('\n') || '  None'}

GHOSTING ALERTS (${gh.length}):
${gh.map(g => `  - ${g.name}: ${g.daysSinceCommit} days inactive — ${g.alert}`).join('\n') || '  None — everyone active'}

BUS FACTOR: ${bf.score ?? '?'}
  Key people: ${bf.keyPeople?.map(p => `${p.name || p} (${p.ownership ?? '?'}%)`).join(', ') || '—'}
  Risk: ${bf.risk || '—'}

PULL REQUESTS (${pr.length}):
${pr.slice(0, 10).map(p => `  - #${p.number || '?'} ${p.title} (${p.state || 'open'}) by ${p.author || p.user?.login || '?'}`).join('\n') || '  None'}

ACTIVE WORK (${aw.length} branches):
${aw.slice(0, 10).map(w => `  - ${w.branch} by ${w.author || '?'} (${w.status || '—'})`).join('\n') || '  None'}

RECENT VELOCITY (last ${vd.length} periods):
${vd.slice(-7).map(v => `  - ${v.date || v.day || '?'}: ${v.commits || 0} commits`).join('\n') || '  No data'}

INTEGRATION RISKS (${ir.length}):
${ir.slice(0, 5).map(r => `  - ${r.branch || r.title}: ${r.risk || r.description || '—'}`).join('\n') || '  None'}

COMMIT HONESTY:
${ch.slice(0, 10).map(c => `  - ${c.author || c.name}: "${c.message || ''}" => ${c.verdict || (c.honest ? 'honest' : 'suspicious')}`).join('\n') || '  No data'}
`.trim();
  }

  /* ── Message handler ───────────────────────────────── */
  async _handleMessage(msg) {
    if (msg.author.bot) return;

    // ── Dedup guard: skip if we already processed this message ──
    if (this._processedMessages.has(msg.id)) return;
    this._processedMessages.add(msg.id);
    // Auto-clean after 60s to prevent memory leak
    setTimeout(() => this._processedMessages.delete(msg.id), 60_000);

    const content = msg.content.toLowerCase().trim();

    // Check if bot is mentioned OR message starts with !devpulse / !dp
    const mentioned = this.client?.user && msg.mentions.has(this.client.user);
    const prefixed  = content.startsWith('!devpulse') || content.startsWith('!dp');

    if (!mentioned && !prefixed) return;

    // Strip prefix / mention to get the query
    let query = msg.content;
    if (prefixed) {
      query = msg.content.replace(/^!devpulse\s*/i, '').replace(/^!dp\s*/i, '');
    } else {
      query = msg.content.replace(/<@!?\d+>/g, '').trim();
    }

    if (!query) query = 'Give me a project summary';
    const queryLower = query.toLowerCase().trim();

    // ── !dp link @user github-login — map Discord user ↔ GitHub
    const linkMatch = queryLower.match(/^link\s+<@!?(\d+)>\s+(\S+)/);
    if (linkMatch) {
      const discordId = linkMatch[1];
      const ghLogin = linkMatch[2].toLowerCase();
      this._discordMap.set(ghLogin, discordId);
      // Also map by member name from store
      const member = (store.TEAM?.members || []).find(m =>
        m.name?.toLowerCase() === ghLogin || m._login?.toLowerCase() === ghLogin
      );
      if (member) this._discordMap.set(member.name.toLowerCase(), discordId);
      return msg.reply(`✅ Linked <@${discordId}> ↔ GitHub \`${ghLogin}\`. They'll be tagged in inactivity alerts.`);
    }

    // ── !dp status <update> — developer responds to inactivity ping
    if (queryLower.startsWith('status ') || queryLower === 'status') {
      const update = query.replace(/^status\s*/i, '').trim() || 'No details provided';
      // Try to find which member this Discord user is
      let memberName = null;
      for (const [name, discordId] of this._discordMap.entries()) {
        if (discordId === msg.author.id) { memberName = name; break; }
      }
      // Also try matching by Discord display name
      if (!memberName) {
        const displayName = msg.member?.displayName?.toLowerCase() || msg.author.username?.toLowerCase();
        const member = (store.TEAM?.members || []).find(m =>
          m.name.toLowerCase() === displayName
        );
        if (member) memberName = member.name;
      }

      if (memberName) {
        const cleared = this._clearPendingPing(memberName);
        const embed = new EmbedBuilder()
          .setColor(0x22c55e)
          .setTitle('✅ Status Update Received')
          .setDescription(`**${memberName}**: ${update}`)
          .setFooter({ text: cleared ? 'Follow-up reminders cancelled' : 'DevPulse' })
          .setTimestamp();
        return msg.reply({ embeds: [embed] });
      }
      // If we can't identify them, still acknowledge
      return msg.reply(`📝 Status noted: "${update}"\n*Tip: Use \`!dp link @you github-username\` so I can track your pings.*`);
    }

    // ── !dp setchannel — set current channel as alert channel
    if (queryLower === 'setchannel' || queryLower === 'set channel') {
      this._alertChannelId = msg.channel.id;
      return msg.reply(`📢 Alert channel set to <#${msg.channel.id}>. Inactivity alerts will be posted here.`);
    }

    // ── !dp repo — show current connected repo info
    if (queryLower === 'repo' || queryLower === 'repository' || queryLower === 'connected') {
      if (!github.isConfigured) {
        return msg.reply('⚠️ No GitHub repository connected. Go to the DevPulse website → Settings → Connect a repo first.');
      }
      const repoEmbed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle('🔗 Connected Repository')
        .addFields(
          { name: 'Repo', value: `[${github.owner}/${github.repo}](https://github.com/${github.owner}/${github.repo})`, inline: true },
          { name: 'Connected As', value: github.user?.login || 'Unknown', inline: true },
          { name: 'Permission', value: github.permission || 'Unknown', inline: true },
          { name: 'Last Synced', value: github.syncedAt ? `<t:${Math.floor(new Date(github.syncedAt).getTime() / 1000)}:R>` : 'Never', inline: true },
          { name: 'Team Size', value: `${store.TEAM?.members?.length || 0} members`, inline: true },
          { name: 'Total Commits', value: `${store.COMMITS?.length || 0}`, inline: true },
        )
        .setFooter({ text: 'DevPulse' })
        .setTimestamp();
      return msg.reply({ embeds: [repoEmbed] });
    }

    // ── No repo connected — refuse to serve demo/seed data ──
    if (!github.isConfigured) {
      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('⚠️ No Repository Connected')
        .setDescription('I can only provide **real-time project data** when a GitHub repo is connected.\n\nThe data you\'d see right now is just placeholder/demo data — not your actual project.')
        .addFields(
          { name: '👉 How to connect', value: '1. Open the **DevPulse website**\n2. Go to **Settings**\n3. Enter your repo and connect', inline: false },
          { name: '🔍 Check status', value: 'Use `!dp repo` to check connection', inline: true },
        )
        .setFooter({ text: 'DevPulse Bot' })
        .setTimestamp();
      return msg.reply({ embeds: [embed] });
    }

    // Show typing indicator
    try { await msg.channel.sendTyping(); } catch {}

    // If OpenRouter AI is available, use AI response
    if (this.aiReady) {
      return await this._aiReply(msg, query);
    }

    // Fallback: keyword-based responses
    return await this._keywordReply(msg, query.toLowerCase());
  }

  /* ── OpenRouter AI Reply ───────────────────────────── */
  async _aiReply(msg, userQuery) {
    try {
      const projectContext = this._buildProjectContext();

      const systemPrompt = `You are DevPulse Bot — an intelligent AI assistant embedded in a software team's Discord server. You have access to REAL-TIME project data below. Your job is to answer questions about the project accurately using ONLY this data.

CRITICAL RULES:
- ONLY use data provided below — never make up stats, names, or numbers
- Answer concisely (under 1800 characters for Discord limits)
- Use Discord markdown: **bold**, *italic*, \`code\`, etc.
- Use emojis to make responses engaging but professional
- If asked about a specific team member, find their exact stats from the data and report them accurately
- If asked "who has the most commits" or similar, compute the answer from the TEAM and COMMITS data
- If asked about checkpoints/tasks, use the CHECKPOINTS data
- If data shows "?" or is missing, say "not available yet" — do NOT invent numbers
- Do NOT use any headers with # markdown (Discord embeds don't support it)
- When reporting blockers or risks, be direct and give actionable advice
- For yes/no questions, answer directly then give context
- Always mention specific numbers, dates, and names from the data
- If the question is unrelated to the project data, you can answer generally but keep it brief

IMPORTANT — DATA READING GUIDE:
- "TEAM ACTIVITY" shows each member's role, commit count, and how many hours since their last commit
- "CHECKPOINTS" shows assigned tasks with their status (completed/in-progress/overdue/not-started)
- "RECENT COMMITS" shows the latest commits with author, message, and line changes
- "BLOCKERS" shows critical issues blocking the project
- "GHOSTING ALERTS" shows members who have gone silent

LIVE PROJECT DATA:
${projectContext}`;

      const text = await callOpenRouter(systemPrompt, userQuery);

      if (!text) {
        // AI returned nothing — fall back
        return await this._keywordReply(msg, userQuery.toLowerCase());
      }

      // Discord has 2000 char limit — split if needed
      if (text.length <= 2000) {
        await msg.reply(text);
      } else {
        const chunks = text.match(/[\s\S]{1,1900}/g) || [text.slice(0, 1900)];
        for (const chunk of chunks) {
          await msg.reply(chunk);
        }
      }
    } catch (err) {
      console.error('OpenRouter error:', err.message);
      // Fallback to keyword-based if AI fails
      await this._keywordReply(msg, userQuery.toLowerCase());
    }
  }

  /* ── Keyword-based fallback reply ──────────────────── */
  async _keywordReply(msg, query) {
    try {
      if (!query || query === 'help') return await this._sendHelp(msg);
      if (/health|score|overall|status/.test(query))       return await this._sendHealth(msg);
      if (/block|blocker|stuck|issue/.test(query))         return await this._sendBlockers(msg);
      if (/ghost|inactive|missing|absent|mia/.test(query)) return await this._sendGhosting(msg);
      if (/team|member|who|people|contributor/.test(query)) return await this._sendTeam(msg);
      if (/bus\s*factor|risk|single.*point/.test(query))   return await this._sendBusFactor(msg);
      if (/work|active|branch|pr|pull/.test(query))        return await this._sendActiveWork(msg);
      if (/velocity|speed|commit|progress/.test(query))    return await this._sendVelocity(msg);
      if (/integration|conflict|merge/.test(query))        return await this._sendIntegration(msg);
      if (/summary|report|overview|everything/.test(query)) return await this._sendFullSummary(msg);

      const memberMatch = this._findMember(query);
      if (memberMatch) return await this._sendMemberInfo(msg, memberMatch);

      return await this._sendHelp(msg, `I didn't understand that. Here's what I can help with:`);
    } catch (err) {
      console.error('Bot reply error:', err);
      msg.reply('⚠️ Something went wrong.').catch(() => {});
    }
  }

  /* ── Embed-based responses (fallback when no Gemini) ── */

  async _sendHelp(msg, intro = '👋 **Hey! I\'m DevPulse Bot.** Ask me anything about the project!') {
    const aiNote = this.aiReady ? '\n\n🧠 *Powered by AI — ask me anything in natural language!*' : '';
    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('DevPulse Bot — Help')
      .setDescription(intro + aiNote)
      .addFields(
        { name: '🏥 health',        value: 'Project health score',  inline: true },
        { name: '🚨 blockers',      value: 'Current blockers',      inline: true },
        { name: '👻 ghosting',      value: 'Inactive members',      inline: true },
        { name: '👥 team',          value: 'Team roster',           inline: true },
        { name: '🚌 bus factor',    value: 'Key-person risks',     inline: true },
        { name: '📈 velocity',      value: 'Commit velocity',      inline: true },
        { name: '📊 summary',       value: 'Full overview',        inline: true },
        { name: '👤 <name>',        value: 'Member info',          inline: true },
        { name: '📝 status <msg>',  value: 'Reply to ping',        inline: true },
        { name: '🔗 link @user gh', value: 'Link Discord↔GitHub',  inline: true },
        { name: '📢 setchannel',    value: 'Set alert channel',    inline: true },
        { name: '💬 anything',      value: 'AI answers all!',      inline: true },
      )
      .setFooter({ text: 'Prefix: !devpulse or !dp  •  Or @mention me' })
      .setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendHealth(msg) {
    const h = store.HEALTH_SCORE;
    const emoji = h.overall >= 70 ? '🟢' : h.overall >= 40 ? '🟡' : '🔴';
    const embed = new EmbedBuilder()
      .setColor(h.overall >= 70 ? 0x22c55e : h.overall >= 40 ? 0xeab308 : 0xef4444)
      .setTitle(`${emoji} Project Health — ${h.overall}/100`)
      .setDescription(this._progressBar(h.overall))
      .addFields(
        { name: '💻 Code Quality',  value: `${h.codeQuality ?? '—'}/100`,   inline: true },
        { name: '👥 Collaboration',  value: `${h.collaboration ?? '—'}/100`, inline: true },
        { name: '📈 Velocity',       value: `${h.velocity ?? '—'}/100`,      inline: true },
        { name: '⚡ Delivery Risk',  value: `${h.deliveryRisk ?? '—'}/100`,  inline: true },
        { name: '📝 Trend',          value: h.trend || '—',                  inline: true },
        { name: '🔥 Status',         value: h.status || '—',                 inline: true },
      )
      .setFooter({ text: 'DevPulse Health Monitor' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendBlockers(msg) {
    const bl = store.BLOCKERS;
    if (!bl?.length) return msg.reply('✅ No blockers!');
    const se = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' };
    const embed = new EmbedBuilder().setColor(0xef4444).setTitle(`🚨 Blockers (${bl.length})`)
      .setDescription(bl.slice(0, 10).map(b =>
        `${se[b.severity] || '⚪'} **${b.title}**\n${b.description || '—'}\n*${b.severity} • ${b.assignee || 'unassigned'}*`
      ).join('\n\n')).setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendGhosting(msg) {
    const gh = store.GHOSTING_ALERTS;
    if (!gh?.length) return msg.reply('✅ Everyone active!');
    const embed = new EmbedBuilder().setColor(0xf59e0b).setTitle(`👻 Ghosting (${gh.length})`)
      .setDescription(gh.slice(0, 10).map(g => `**${g.name}** — ${g.daysSinceCommit}d inactive\n*${g.alert}*`).join('\n\n'))
      .setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendTeam(msg) {
    const m = store.TEAM?.members || [];
    const cs = store.CONTRIBUTION_STATS || [];
    if (!m.length) return msg.reply('No team data yet.');
    const embed = new EmbedBuilder().setColor(0x6366f1).setTitle(`👥 Team (${m.length})`)
      .setDescription(m.slice(0, 15).map(x => {
        const s = cs.find(c => c.name === x.name || c.author === x.name);
        return `**${x.name}** — ${x.role || 'member'} • ${s?.commits ?? s?.totalCommits ?? '?'} commits`;
      }).join('\n')).setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendBusFactor(msg) {
    const bf = store.BUS_FACTOR;
    if (!bf) return msg.reply('No bus factor data yet.');
    const emoji = bf.score >= 3 ? '🟢' : bf.score >= 2 ? '🟡' : '🔴';
    const kp = bf.keyPeople?.map(p => `• **${p.name || p}** ${p.ownership ? `(${p.ownership}%)` : ''}`).join('\n') || 'None';
    const embed = new EmbedBuilder()
      .setColor(bf.score >= 3 ? 0x22c55e : bf.score >= 2 ? 0xeab308 : 0xef4444)
      .setTitle(`${emoji} Bus Factor: ${bf.score}`)
      .setDescription(bf.risk || '—')
      .addFields({ name: '🔑 Key People', value: kp })
      .setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendActiveWork(msg) {
    const w = store.ACTIVE_WORK || [], pr = store.PULL_REQUESTS || [];
    const l = [];
    if (w.length) { l.push('**Branches:**'); w.slice(0, 8).forEach(x => l.push(`• \`${x.branch}\` — ${x.author || '?'}`)); }
    if (pr.length) { l.push(`\n**PRs (${pr.length}):**`); pr.slice(0, 5).forEach(p => l.push(`• #${p.number || '?'} **${p.title}**`)); }
    if (!l.length) return msg.reply('No active work yet.');
    const embed = new EmbedBuilder().setColor(0x8b5cf6).setTitle('🔀 Active Work')
      .setDescription(l.join('\n')).setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendVelocity(msg) {
    const v = store.VELOCITY_DATA || [];
    if (!v.length) return msg.reply('No velocity data yet.');
    const r = v.slice(-7), t = r.reduce((s, x) => s + (x.commits || 0), 0);
    const chart = r.map(x => `${x.date || x.day || '?'}: ${'█'.repeat(Math.min(x.commits || 0, 20))} ${x.commits}`).join('\n');
    const embed = new EmbedBuilder().setColor(0x06b6d4).setTitle('📈 Velocity')
      .setDescription(`\`\`\`\n${chart}\n\`\`\``)
      .addFields({ name: 'Total', value: `${t}`, inline: true }, { name: 'Avg', value: `${Math.round(t / r.length)}`, inline: true })
      .setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendIntegration(msg) {
    const ri = store.INTEGRATION_RISKS || [];
    if (!ri.length) return msg.reply('✅ No integration risks!');
    const embed = new EmbedBuilder().setColor(0xf97316).setTitle(`⚡ Integration Risks (${ri.length})`)
      .setDescription(ri.slice(0, 8).map(r => `**${r.branch || r.title}** — ${r.risk || r.description || '—'}`).join('\n\n'))
      .setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendFullSummary(msg) {
    const h = store.HEALTH_SCORE, e = h.overall >= 70 ? '🟢' : h.overall >= 40 ? '🟡' : '🔴';
    const embed = new EmbedBuilder().setColor(0x3b82f6).setTitle('📊 Project Summary')
      .setDescription(`${e} **Health: ${h.overall}/100** (${h.status || '—'})`)
      .addFields(
        { name: '👥 Team',       value: `${store.TEAM?.members?.length || 0}`,   inline: true },
        { name: '🚨 Blockers',   value: `${store.BLOCKERS?.length || 0}`,        inline: true },
        { name: '👻 Ghosting',   value: `${store.GHOSTING_ALERTS?.length || 0}`, inline: true },
        { name: '🚌 Bus Factor', value: `${store.BUS_FACTOR?.score ?? '?'}`,     inline: true },
        { name: '🔀 PRs',        value: `${store.PULL_REQUESTS?.length || 0}`,   inline: true },
        { name: '📈 Trend',      value: h.trend || '—',                          inline: true },
      ).setFooter({ text: 'DevPulse' }).setTimestamp();
    await msg.reply({ embeds: [embed] });
  }

  async _sendMemberInfo(msg, member) {
    const s = (store.CONTRIBUTION_STATS || []).find(c => (c.name || c.author || '').toLowerCase() === member.name.toLowerCase());
    const g = (store.GHOSTING_ALERTS || []).find(x => x.name.toLowerCase() === member.name.toLowerCase());
    const embed = new EmbedBuilder().setColor(g ? 0xf59e0b : 0x22c55e).setTitle(`👤 ${member.name}`)
      .addFields(
        { name: 'Role',    value: member.role || 'Member',                                            inline: true },
        { name: 'Commits', value: `${s?.commits ?? s?.totalCommits ?? '?'}`,                          inline: true },
        { name: 'Lines',   value: `+${s?.additions ?? '?'} / -${s?.deletions ?? '?'}`,                inline: true },
        { name: 'Status',  value: g ? `⚠️ Inactive (${g.daysSinceCommit}d)` : '✅ Active',           inline: true },
      ).setTimestamp();
    if (g) embed.setDescription(`⚠️ *${g.alert}*`);
    await msg.reply({ embeds: [embed] });
  }

  /* ── Helpers ───────────────────────────────────────── */
  _findMember(query) {
    return (store.TEAM?.members || []).find(m =>
      m.name.toLowerCase().includes(query) || query.includes(m.name.toLowerCase())
    );
  }

  _progressBar(val, max = 100, len = 15) {
    const f = Math.round((val / max) * len);
    return '`' + '█'.repeat(f) + '░'.repeat(len - f) + '`' + ` ${val}/${max}`;
  }
}

export default new DiscordBotService();
