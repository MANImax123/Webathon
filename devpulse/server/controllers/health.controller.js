import {
  computeHealthScore,
  computeVelocity,
  computeContributions,
  computeFullHealthRadar,
} from '../services/metrics.service.js';

export const getHealthScore = (_req, res) => {
  res.json(computeHealthScore());
};

export const getVelocity = (_req, res) => {
  res.json(computeVelocity());
};

export const getContributions = (_req, res) => {
  res.json(computeContributions());
};

/** Combined payload for Health Radar panel — all computed live */
export const getHealthRadar = (_req, res) => {
  res.json(computeFullHealthRadar());
};
