import { SIMULATION_SCENARIOS, HEALTH_SCORE, TEAM, ACTIVE_WORK, BLOCKERS, PULL_REQUESTS } from '../data/store.js';

export const getScenarios = (_req, res) => {
  res.json(SIMULATION_SCENARIOS);
};

export const runSimulation = (req, res) => {
  const { scenarioId } = req.params;
  const scenario = SIMULATION_SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) return res.status(404).json({ error: 'Scenario not found' });

  const impact = scenario.impact;
  const projected = Math.max(0, Math.min(100, HEALTH_SCORE.overall + impact.healthDrop));
  const members = TEAM?.members || [];
  const activeWork = ACTIVE_WORK || [];
  const blockers = BLOCKERS || [];
  const prs = PULL_REQUESTS || [];

  // Build detailed analysis
  const analysis = [];
  const recommendations = [];

  if (impact.healthDrop < 0) {
    // Negative scenario
    if (scenario.memberId) {
      const member = members.find(m => m.id === scenario.memberId);
      const work = activeWork.find(w => w.memberId === scenario.memberId);
      analysis.push(`${member?.name || 'This member'} is currently ${work?.status || 'unknown'} and working on "${work?.currentTask || 'unknown task'}".`);
      analysis.push(`Continued inactivity would increase delivery risk by ${Math.abs(impact.riskChange.deliveryRisk)}% and integration risk by ${Math.abs(impact.riskChange.integrationRisk)}%.`);
      analysis.push(`${impact.newBlockers} additional blocker(s) would likely emerge from dependency stalls.`);
      recommendations.push(`Pair ${member?.name || 'this member'} with an active contributor immediately.`);
      recommendations.push('Redistribute critical tasks to reduce single-person dependency.');
      recommendations.push('Set up a daily standup check-in to monitor progress.');
    } else if (scenario.prId) {
      const pr = prs.find(p => p.id === scenario.prId);
      analysis.push(`PR "${pr?.title || scenario.name}" has been open for ${pr?.ageDays || '?'} days${pr?.stagnant ? ' and is stagnant with no recent activity' : ''}.`);
      analysis.push(`Delaying this PR by ${scenario.delayHours}h would drop health to ${projected} and add ${impact.newBlockers} blocker(s).`);
      analysis.push(`Delivery risk would spike by ${Math.abs(impact.riskChange.deliveryRisk)}%, potentially missing the deadline.`);
      recommendations.push('Assign a reviewer and prioritize this PR today.');
      recommendations.push('Break the PR into smaller, mergeable chunks if possible.');
      recommendations.push('Schedule a code review session within the next few hours.');
    } else {
      analysis.push(`This scenario would decrease project health from ${HEALTH_SCORE.overall} to ${projected}.`);
      analysis.push(`${impact.newBlockers} new blocker(s) would emerge, compounding existing issues.`);
      recommendations.push('Take preventive action before this scenario materializes.');
    }
  } else {
    // Positive scenario
    if (scenario.prId) {
      const pr = prs.find(p => p.id === scenario.prId);
      analysis.push(`Merging "${pr?.title || 'this PR'}" would boost health score to ${projected} (+${impact.healthDrop}).`);
      analysis.push(`This would resolve ${Math.abs(impact.newBlockers)} existing blocker(s) and unblock dependent work.`);
      analysis.push(`Delivery risk would decrease by ${Math.abs(impact.riskChange.deliveryRisk)}% and integration risk by ${Math.abs(impact.riskChange.integrationRisk)}%.`);
      recommendations.push('Merge this PR as soon as possible for maximum impact.');
      recommendations.push('Run integration tests immediately after merge.');
      recommendations.push('Notify the team so dependent work can proceed.');
    } else {
      analysis.push(`This positive scenario would increase health from ${HEALTH_SCORE.overall} to ${projected}.`);
      analysis.push(`It would remove ${Math.abs(impact.newBlockers)} blocker(s) and reduce overall risk.`);
      recommendations.push('Execute this plan to improve project trajectory.');
    }
  }

  // Return the impact fields at the top level (matching frontend expectations)
  // plus enriched analysis data
  res.json({
    ...impact,
    scenarioName: scenario.name,
    scenarioDescription: scenario.description,
    currentHealth: HEALTH_SCORE.overall,
    projectedHealth: projected,
    analysis,
    recommendations,
    breakdown: {
      deliveryRisk: Math.max(0, Math.min(100, HEALTH_SCORE.breakdown.deliveryRisk + (impact.riskChange.deliveryRisk || 0))),
      integrationRisk: Math.max(0, Math.min(100, HEALTH_SCORE.breakdown.integrationRisk + (impact.riskChange.integrationRisk || 0))),
      stabilityRisk: HEALTH_SCORE.breakdown.stabilityRisk,
    },
    activeMembers: activeWork.filter(w => w.status === 'active').length,
    totalMembers: members.length,
    currentBlockers: blockers.length,
    openPRs: prs.filter(p => p.status === 'open').length,
  });
};

/** Combined payload for Simulation panel */
export const getSimulationDashboard = (_req, res) => {
  res.json({
    scenarios: SIMULATION_SCENARIOS,
    currentHealth: HEALTH_SCORE.overall,
  });
};
