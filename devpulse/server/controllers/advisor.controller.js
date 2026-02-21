import * as store from '../data/store.js';
import * as metricsService from '../services/metrics.service.js';
import github from '../services/github.service.js';

// Helper: returns metrics functions (avoids circular import issues)
const require_metrics = () => metricsService;

/* ── OpenRouter setup ─────────────────────────────────── */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-3-12b-it:free';
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const aiEnabled = Boolean(OPENROUTER_KEY && OPENROUTER_KEY !== 'PASTE_YOUR_OPENROUTER_API_KEY_HERE');
if (aiEnabled) {
  console.log(`🧠 OpenRouter AI initialized (${OPENROUTER_MODEL}) for AI Advisor`);
} else {
  console.log('⚠️  OPENROUTER_API_KEY not set — AI Advisor will use keyword fallback only');
}

async function callOpenRouter(systemPrompt, userMessage) {
  // Merge system + user into a single user message
  // (Google models via AI Studio don't support the system role)
  const combinedMessage = `${systemPrompt}\n\nUSER QUESTION: ${userMessage}`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
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

/* ── Build rich project context for Gemini ────────────── */
function buildProjectContext() {
  // Import live-computed metrics instead of stale store snapshots
  const { computeHealthScore, computeVelocity, computeContributions } = require_metrics();
  const h = computeHealthScore();
  const cs = computeContributions();
  const vd = computeVelocity();
  const tm = store.TEAM?.members || [];
  const bl = store.BLOCKERS || [];
  const gh = store.GHOSTING_ALERTS || [];
  const bf = store.BUS_FACTOR || {};
  const pr = store.PULL_REQUESTS || [];
  const aw = store.ACTIVE_WORK || [];
  const ir = store.INTEGRATION_RISKS || [];
  const ch = store.COMMIT_HONESTY || [];
  const cp = store.CHECKPOINTS || [];

  return `
=== DEVPULSE PROJECT DATA (live) ===

PROJECT: ${store.TEAM?.name || '?'} — ${store.TEAM?.description || ''}
REPO: ${github.isConfigured ? `${github.owner}/${github.repo}` : (store.TEAM?.repo || '?')}
DEADLINE: ${store.TEAM?.deadline || '?'}

HEALTH SCORE: ${h.overall ?? '?'}/100
  Delivery Risk: ${h.breakdown?.deliveryRisk ?? '?'}%
  Integration Risk: ${h.breakdown?.integrationRisk ?? '?'}%
  Stability Risk: ${h.breakdown?.stabilityRisk ?? '?'}%
  Trend: ${JSON.stringify((h.trend || []).slice(-5).map(t => t.score))}

TEAM (${tm.length} members):
${tm.map(m => {
    const s = cs.find(c => c.name === m.name);
    const w = aw.find(a => a.memberId === m.id);
    return `  - ${m.name} (${m.role}) — ${s?.commits ?? '?'} commits, +${s?.additions ?? '?'}/-${s?.deletions ?? '?'} lines, status: ${w?.status || '?'}, last: ${w?.lastCommit || '?'}, branch: ${w?.branch || '?'}`;
  }).join('\n')}

BLOCKERS (${bl.length}):
${bl.map(b => `  [${b.severity}] ${b.title} — ${b.description}`).join('\n') || '  None'}

GHOSTING ALERTS (${gh.length}):
${gh.map(g => `  ${g.name}: ${g.daysSinceCommit}d inactive — ${g.alert}`).join('\n') || '  None'}

BUS FACTOR:
  Modules: ${bf.modules?.join(', ') || '?'}
  Contributors: ${bf.contributors?.join(', ') || '?'}
  Data (ownership %): ${JSON.stringify(bf.data?.slice(0, 5))}

PULL REQUESTS (${pr.length} total, ${pr.filter(p => p.status === 'open').length} open):
${pr.filter(p => p.status === 'open').map(p => `  PR "${p.title}" by ${tm.find(m => m.id === p.author)?.name || p.author} — age ${p.ageDays || '?'}d, ${p.stagnant ? 'STAGNANT' : 'active'}, reviewers: ${p.reviewers?.length || 0}`).join('\n') || '  None open'}

INTEGRATION RISKS (${ir.length}):
${ir.map(r => `  ${r.module}: risk ${r.risk}%, status ${r.status}, deps: ${r.dependencies?.join(', ')}`).join('\n') || '  None'}

COMMIT HONESTY:
${ch.map(c => `  "${c.message}" => ${c.verdict} (${c.matchScore}% match)`).join('\n') || '  All honest'}

CHECKPOINTS / ALLOCATED TASKS (${cp.length}):
${cp.map(c => `  [${c.status}] "${c.title}" → assigned to ${c.assigneeName || c.assignee} — deadline: ${c.deadline}, priority: ${c.priority}`).join('\n') || '  None allocated'}

VELOCITY (last 7 days):
${vd.slice(-7).map(v => `  ${v.date}: ${tm.map(m => `${m.name}=${v[m.name] || 0}`).join(', ')}`).join('\n')}
`.trim();
}

/* ── Keyword fallback ─────────────────────────────────── */
function keywordFallback(question) {
  const responses = store.AI_ADVISOR_RESPONSES || {};
  const q = question.toLowerCase().trim();
  let matched = responses['default'] || { response: 'No data available yet.', confidence: 50 };
  for (const [key, value] of Object.entries(responses)) {
    if (key !== 'default' && q.includes(key)) { matched = value; break; }
  }
  return matched;
}

/* ── POST /api/advisor/ask ────────────────────────────── */
export const askAdvisor = async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'question is required' });

  // Try OpenRouter AI first
  if (aiEnabled) {
    try {
      const context = buildProjectContext();
      const systemPrompt = `You are DevPulse AI — an expert project delivery risk advisor for software teams.
You analyse live project data and give sharp, actionable insights.

RULES:
- Be concise but thorough (max ~400 words)
- Use markdown: **bold** for emphasis, bullet points with - or •
- Use emojis sparingly for visual cues (🔴 🟡 🟢 ⚠️ ✅ ❌)
- When mentioning team members, include their recent activity stats
- Give specific, actionable recommendations — not vague advice
- If asked about risks, quantify them with numbers from the data
- If asked about team members, provide their commit counts, status, and current work
- Reference actual project data (health score, blockers, PRs, etc.)
- Be direct and honest — flag real problems
- If checkpoint/task data exists, reference task completion progress
- End with a clear recommendation or next step

LIVE PROJECT DATA:
${context}`;

      const text = await callOpenRouter(systemPrompt, question);

      if (text) {
        return res.json({
          question,
          response: text,
          confidence: 95,
          source: 'openrouter',
          timestamp: new Date().toISOString(),
        });
      }
      // null response — fall through to keyword fallback
    } catch (err) {
      console.error('OpenRouter advisor error:', err.message);
      // Fall through to keyword fallback
    }
  }

  // Keyword fallback
  const matched = keywordFallback(question);
  res.json({
    question,
    response: matched.response,
    confidence: matched.confidence,
    source: 'keyword',
    timestamp: new Date().toISOString(),
  });
};

/* ── GET /api/advisor/suggestions ─────────────────────── */
export const getSuggestions = (_req, res) => {
  const suggestions = [
    "What's the biggest risk right now?",
    "Who needs help on the team?",
    "Are we ready for demo day?",
    "Summarize project status",
    "What should I prioritize today?",
    "Show checkpoint progress",
    "Who is falling behind on deadlines?",
    "What are the integration risks?",
  ];
  res.json(suggestions);
};
