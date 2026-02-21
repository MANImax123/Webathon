// ── DevPulse Frontend API Service ────────────────────────
// Centralised fetch helpers for the Express backend.
// In development, the Vite proxy (or CORS) forwards to :4000.
// ─────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}`);
  }
  return res.json();
}

async function postJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API ${res.status}`);
  }
  return res.json();
}

async function putJson(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API ${res.status}`);
  }
  return res.json();
}

async function deleteJson(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API ${res.status}`);
  }
  return res.json();
}

// ── Team ────────────────────────────────────────────────
export const api = {
  // Team
  getTeam: () => fetchJson('/team'),
  getMember: (id) => fetchJson(`/team/members/${id}`),

  // Health Radar (combined)
  getHealthRadar: () => fetchJson('/health'),
  getHealthScore: () => fetchJson('/health/score'),
  getVelocity: () => fetchJson('/health/velocity'),
  getContributions: () => fetchJson('/health/contributions'),

  // Active Work Map (combined)
  getWorkMap: () => fetchJson('/work'),
  getActiveWork: () => fetchJson('/work/active'),
  getCommitsByAuthor: (authorId) => fetchJson(`/work/commits/${authorId}`),

  // Blockers (combined)
  getBlockerDashboard: () => fetchJson('/blockers'),
  getBlockers: (severity) => fetchJson(`/blockers/list${severity ? `?severity=${severity}` : ''}`),
  getGhostingAlerts: () => fetchJson('/blockers/ghosting'),

  // Integration Risk
  getIntegrationRisks: () => fetchJson('/integration'),
  getModuleRisk: (mod) => fetchJson(`/integration/${encodeURIComponent(mod)}`),

  // Bus Factor
  getBusFactor: () => fetchJson('/busfactor'),
  getCriticalModules: (threshold) => fetchJson(`/busfactor/critical${threshold ? `?threshold=${threshold}` : ''}`),

  // Simulation
  getSimulationDashboard: () => fetchJson('/simulation'),
  getScenarios: () => fetchJson('/simulation/scenarios'),
  runSimulation: (scenarioId) => fetchJson(`/simulation/run/${scenarioId}`),

  // AI Advisor
  askAdvisor: (question) => postJson('/advisor/ask', { question }),
  getAdvisorSuggestions: () => fetchJson('/advisor/suggestions'),

  // Commits & Honesty
  getCommits: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchJson(`/commits${qs ? `?${qs}` : ''}`);
  },
  getCommitById: (id) => fetchJson(`/commits/${id}`),
  getHonestyAnalysis: () => fetchJson('/commits/honesty'),
  getCommitHonestyPage: () => fetchJson('/commits/honesty-page'),

  // GitHub Connection
  getGithubStatus: () => fetchJson('/github/status'),
  getCollaboratorEmails: () => fetchJson('/github/emails'),
  connectGithub: (token, owner, repo) => postJson('/github/connect', { token, owner, repo }),
  syncGithub: () => postJson('/github/sync', {}),
  disconnectGithub: () => postJson('/github/disconnect', {}),

  // Notifications
  getNotificationStatus: () => fetchJson('/notifications/status'),
  configureDiscord: (webhookUrl) => postJson('/notifications/discord/configure', { webhookUrl }),
  disconnectDiscord: () => postJson('/notifications/discord/disconnect', {}),
  testDiscord: () => postJson('/notifications/discord/test', {}),
  configureGmail: (email, password, to) => postJson('/notifications/gmail/configure', { email, password, to }),
  disconnectGmail: () => postJson('/notifications/gmail/disconnect', {}),
  testGmail: () => postJson('/notifications/gmail/test', {}),
  configureGoogleCalendar: (data) => postJson('/notifications/gcal/configure', data),
  disconnectGoogleCalendar: () => postJson('/notifications/gcal/disconnect', {}),
  testGoogleCalendar: () => postJson('/notifications/gcal/test', {}),
  sendGhostingAlerts: () => postJson('/notifications/send/ghosting', {}),
  sendBlockerAlerts: (severity) => postJson(`/notifications/send/blockers${severity ? `?severity=${severity}` : ''}`, {}),
  sendHealthSummary: () => postJson('/notifications/send/health', {}),

  // Checkpoints / Task Allocation
  getCheckpoints: () => fetchJson('/checkpoints'),
  getCheckpoint: (id) => fetchJson(`/checkpoints/${id}`),
  createCheckpoint: (data) => postJson('/checkpoints', data),
  updateCheckpoint: (id, data) => putJson(`/checkpoints/${id}`, data),
  deleteCheckpoint: (id) => deleteJson(`/checkpoints/${id}`),
  getMemberCheckpoints: (memberId) => fetchJson(`/checkpoints/member/${memberId}`),
  getProgressSummary: () => fetchJson('/checkpoints/progress'),

  // Agent — Inactivity Auto-Ping
  detectInactivity: () => postJson('/agent/detect', {}),
  getAgentAlerts: (status) => fetchJson(`/agent/alerts${status ? `?status=${status}` : ''}`),
  respondToAlert: (alertId, userMessage) => postJson('/agent/respond', { alertId, userMessage }),
  escalateAlert: (alertId) => postJson('/agent/escalate', { alertId }),

  // Agent — Work Visibility
  queryWork: (userQuery) => postJson('/agent/query', { userQuery }),

  // Google Calendar Integration
  getCalendarStatus: () => fetchJson('/calendar/status'),
  configureCalendar: (data) => postJson('/calendar/configure', data),
  getCalendarAuthUrl: () => fetchJson('/calendar/auth-url'),
  createCalendarEvent: (data) => postJson('/calendar/create-event', data),
  getCalendarEvents: () => fetchJson('/calendar/events'),
  disconnectCalendar: () => postJson('/calendar/disconnect', {}),
};

export default api;
