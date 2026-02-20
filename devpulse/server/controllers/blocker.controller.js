import { BLOCKERS, GHOSTING_ALERTS } from '../data/store.js';

export const getBlockers = (req, res) => {
  const severity = req.query.severity;
  if (severity) {
    return res.json(BLOCKERS.filter((b) => b.severity === severity));
  }
  res.json(BLOCKERS);
};

export const getGhostingAlerts = (_req, res) => {
  res.json(GHOSTING_ALERTS);
};

/** Combined payload for Blocker Alerts panel */
export const getBlockerDashboard = (_req, res) => {
  res.json({
    blockers: BLOCKERS,
    ghostingAlerts: GHOSTING_ALERTS,
  });
};
