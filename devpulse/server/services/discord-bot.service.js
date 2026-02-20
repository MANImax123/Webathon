// ────────────────────────────────────────────────────────
// Discord Bot Service — Gemini AI–Powered Q&A Bot
// Reads messages when mentioned / prefixed, sends project
// data context to Gemini, and replies with smart answers.
// ────────────────────────────────────────────────────────
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as store from '../data/store.js';

class DiscordBotService {
  constructor() {
    this.client   = null;
    this.token    = process.env.DISCORD_BOT_TOKEN || null;
    this.ready    = false;
    this.gemini   = null;
    this.model    = null;

    // Init Gemini if key is available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
      this.gemini = new GoogleGenerativeAI(geminiKey);
      this.model  = this.gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
      console.log('🧠 Gemini AI initialized for Discord bot');
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
      ],
    });

    this.client.on('ready', () => {
      console.log(`🤖 Discord bot online as ${this.client.user.tag}`);
      this.ready = true;
    });

    this.client.on('messageCreate', (msg) => this._handleMessage(msg));

    this.client.on('error', (err) => {
      console.error('Discord bot error:', err.message);
    });

    try {
      await this.client.login(this.token);
    } catch (err) {
      console.error('❌ Discord bot login failed:', err.message);
    }
  }

  /* ── Stop the bot ──────────────────────────────────── */
  async stop() {
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
      gemini: Boolean(this.model),
    };
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

    return `
=== DEVPULSE PROJECT DATA (live) ===

HEALTH SCORE: ${h.overall ?? '?'}/100
  - Code Quality: ${h.codeQuality ?? '?'}/100
  - Collaboration: ${h.collaboration ?? '?'}/100  
  - Velocity: ${h.velocity ?? '?'}/100
  - Delivery Risk: ${h.deliveryRisk ?? '?'}/100
  - Trend: ${h.trend || '?'}
  - Status: ${h.status || '?'}

TEAM (${tm.length} members):
${tm.map(m => {
  const s = cs.find(c => (c.name || c.author || '') === m.name);
  return `  - ${m.name} (${m.role || 'member'}) — ${s?.commits ?? s?.totalCommits ?? '?'} commits, +${s?.additions ?? s?.linesAdded ?? '?'}/-${s?.deletions ?? s?.linesRemoved ?? '?'} lines`;
}).join('\n')}

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

    // Show typing indicator
    try { await msg.channel.sendTyping(); } catch {}

    // If Gemini is available, use AI response
    if (this.model) {
      return await this._geminiReply(msg, query);
    }

    // Fallback: keyword-based responses
    return await this._keywordReply(msg, query.toLowerCase());
  }

  /* ── Gemini AI Reply ───────────────────────────────── */
  async _geminiReply(msg, userQuery) {
    try {
      const projectContext = this._buildProjectContext();
      
      const prompt = `You are DevPulse Bot — an AI assistant for a software project team. You live inside their Discord server and help with project management insights.

RULES:
- Answer concisely (under 1800 characters for Discord limits)
- Use Discord markdown: **bold**, *italic*, \`code\`, etc.
- Use emojis to make responses engaging
- If asked about specific team members, give their stats from the data
- If asked about project health, give scores and actionable advice
- If asked general questions unrelated to the project, still be helpful but brief
- Always be friendly, supportive, and professional
- When reporting risks/blockers, be direct and actionable
- Format lists with bullet points using •
- If data shows "?" or is missing, say it's not available yet
- Do NOT use any headers with # markdown (Discord embeds don't support it well)
- Keep response in a single message, no need for multiple paragraphs

LIVE PROJECT DATA:
${projectContext}

USER MESSAGE: ${userQuery}

Reply as DevPulse Bot:`;

      const result = await this.model.generateContent(prompt);
      const text   = result.response.text();

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
      console.error('Gemini error:', err.message);
      // Fallback to keyword-based if Gemini fails
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
    const aiNote = this.model ? '\n\n🧠 *Powered by Gemini AI — ask me anything in natural language!*' : '';
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
