import { BUS_FACTOR } from '../data/store.js';

export const getBusFactor = (_req, res) => {
  res.json(BUS_FACTOR);
};

/** Get modules where a single contributor owns ≥ threshold */
export const getCriticalModules = (req, res) => {
  const threshold = parseInt(req.query.threshold) || 85;
  const critical = [];

  BUS_FACTOR.modules.forEach((mod, i) => {
    const row = BUS_FACTOR.data[i];
    row.forEach((pct, j) => {
      if (pct >= threshold) {
        critical.push({
          module: mod,
          contributor: BUS_FACTOR.contributors[j],
          ownership: pct,
        });
      }
    });
  });

  res.json(critical);
};
