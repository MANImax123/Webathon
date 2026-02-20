// ────────────────────────────────────────────────────────
// GitHub Connection Controller
// connect → validate token → check permissions → sync
// disconnect → restore demo
// ────────────────────────────────────────────────────────

import github from '../services/github.service.js';
import { syncFromGitHub } from '../services/analytics.service.js';
import { restoreDefaults, TEAM } from '../data/store.js';

/** GET /api/github/status */
export const getStatus = (_req, res) => {
  res.json(github.status);
};

/** GET /api/github/emails — collaborator emails (lead only) */
export const getCollaboratorEmails = async (_req, res) => {
  try {
    // If connected to GitHub, fetch from API
    if (github.isConfigured && github.token) {
      // Only lead can see emails
      if (!github.isLead) {
        return res.status(403).json({ error: 'Only the lead can view collaborator emails' });
      }
      const emails = await github.getCollaboratorEmails();
      return res.json({ source: 'github', collaborators: emails });
    }

    // Demo mode: return team store emails
    const members = TEAM?.members || [];
    return res.json({
      source: 'demo',
      collaborators: members.map(m => ({
        login: m.id,
        name: m.name,
        avatar: m.avatar,
        email: m.email || null,
        role: m.role,
      })),
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/** POST /api/github/connect  body: { token?, owner, repo } */
export const connect = async (req, res) => {
  try {
    const { token, owner, repo } = req.body;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'owner and repo are required' });
    }

    github.configure({ token, owner, repo });

    // Validate by fetching repo info
    await github.getRepo();

    // Always validate contributor access — token is required
    const authInfo = await github.validateContributorAccess();

    // Sync all data
    const result = await syncFromGitHub();
    res.json({
      status: 'connected',
      synced: true,
      ...result,
      user: authInfo.user,
      permission: authInfo.permission,
      isLead: authInfo.isLead,
    });
  } catch (err) {
    github.disconnect();
    res.status(err.status || 500).json({ error: err.message });
  }
};

/** POST /api/github/sync — re-sync from GitHub */
export const sync = async (_req, res) => {
  try {
    if (!github.isConfigured) {
      return res.status(400).json({ error: 'Not connected to GitHub' });
    }
    const result = await syncFromGitHub();
    res.json({ status: 'synced', ...result });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/** POST /api/github/disconnect */
export const disconnect = (_req, res) => {
  github.disconnect();
  restoreDefaults();
  res.json({ status: 'disconnected' });
};

