import { SIMULATION_SCENARIOS } from '../data/store.js';
import { computeHealthScore } from '../services/metrics.service.js';

export const getScenarios = (_req, res) => {
  res.json(SIMULATION_SCENARIOS);
};

export const runSimulation = (req, res) => {
  const { scenarioId } = req.params;
  const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

  const health = computeHealthScore();
  const projected = health.overall + scenario.impact.healthDrop;

  res.json({
    scenario,
    currentHealth: health.overall,
    projectedHealth: Math.max(0, Math.min(100, projected)),
    breakdown: {
      deliveryRisk: health.breakdown.deliveryRisk + (scenario.impact.riskChange.deliveryRisk || 0),
      integrationRisk: health.breakdown.integrationRisk + (scenario.impact.riskChange.integrationRisk || 0),
      stabilityRisk: health.breakdown.stabilityRisk,
    },
  });
};

/** Combined payload for Simulation panel */
export const getSimulationDashboard = (_req, res) => {
  const health = computeHealthScore();
  res.json({
    scenarios: SIMULATION_SCENARIOS,
    currentHealth: health.overall,
  });
};
