import { HEALTH_SCORE, VELOCITY_DATA, CONTRIBUTION_STATS } from '../data/store.js';

export const getHealthScore = (_req, res) => {
  res.json(HEALTH_SCORE);
};

export const getVelocity = (_req, res) => {
  res.json(VELOCITY_DATA);
};

export const getContributions = (_req, res) => {
  res.json(CONTRIBUTION_STATS);
};

/** Combined payload for Health Radar panel */
export const getHealthRadar = (_req, res) => {
  res.json({
    healthScore: HEALTH_SCORE,
    velocity: VELOCITY_DATA,
    contributions: CONTRIBUTION_STATS,
  });
};
