import { INTEGRATION_RISKS } from '../data/store.js';

export const getIntegrationRisks = (_req, res) => {
  res.json(INTEGRATION_RISKS);
};

export const getModuleRisk = (req, res) => {
  const mod = INTEGRATION_RISKS.find(
    (r) => r.module.toLowerCase() === req.params.module.toLowerCase()
  );
  if (!mod) return res.status(404).json({ error: 'Module not found' });
  res.json(mod);
};
