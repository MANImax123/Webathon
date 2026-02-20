import { SIMULATION_SCENARIOS, HEALTH_SCORE } from '../data/store.js';

export const getScenarios = (_req, res) => {
  res.json(SIMULATION_SCENARIOS);
};

export const runSimulation = (req, res) => {
  const { scenarioId } = req.params;
  const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

  const projected = HEALTH_SCORE.overall + scenario.impact.healthDrop;

  res.json({
    scenario,
    currentHealth: HEALTH_SCORE.overall,
    projectedHealth: Math.max(0, Math.min(100, projected)),
    breakdown: {
      deliveryRisk: HEALTH_SCORE.breakdown.deliveryRisk + (scenario.impact.riskChange.deliveryRisk || 0),
      integrationRisk: HEALTH_SCORE.breakdown.integrationRisk + (scenario.impact.riskChange.integrationRisk || 0),
      stabilityRisk: HEALTH_SCORE.breakdown.stabilityRisk,
    },
  });
};

/** Combined payload for Simulation panel */
export const getSimulationDashboard = (_req, res) => {
  res.json({
    scenarios: SIMULATION_SCENARIOS,
    currentHealth: HEALTH_SCORE.overall,
  });
};
