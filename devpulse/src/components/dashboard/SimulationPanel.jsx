import { useState } from 'react';
import { SlidersHorizontal, Play, ArrowDown, ArrowUp, AlertTriangle, TrendingDown, TrendingUp, RotateCcw } from 'lucide-react';
import { SIMULATION_SCENARIOS, HEALTH_SCORE } from '../../data/demoData';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

export default function SimulationPanel() {
  const { data: simData } = useApi(api.getSimulationDashboard, { scenarios: SIMULATION_SCENARIOS, currentHealth: HEALTH_SCORE.overall });
  const scenarios = simData.scenarios || SIMULATION_SCENARIOS;
  const currentHealth = simData.currentHealth ?? HEALTH_SCORE.overall;
  const [activeScenario, setActiveScenario] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState(null);

  const runSimulation = (scenario) => {
    setActiveScenario(scenario.id);
    setIsSimulating(true);
    setResult(null);

    setTimeout(() => {
      setResult(scenario.impact);
      setIsSimulating(false);
    }, 1500);
  };

  const reset = () => {
    setActiveScenario(null);
    setResult(null);
    setIsSimulating(false);
  };

  const newHealth = result ? Math.max(0, Math.min(100, currentHealth + result.healthDrop)) : null;
  const isPositive = result?.healthDrop > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <SlidersHorizontal size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">What-If Simulator</p>
            <p className="text-sm text-muted-foreground">Simulate scenarios to predict delivery impact</p>
          </div>
        </div>
        {result && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground bg-secondary border border-border transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((scenario) => {
          const isActive = activeScenario === scenario.id;
          const isNegative = scenario.impact.healthDrop < 0;

          return (
            <div
              key={scenario.id}
              className={`rounded-2xl bg-card border p-5 transition-all cursor-pointer hover:border-violet-500/30 ${
                isActive ? 'border-violet-500/40 ring-1 ring-violet-500/20' : 'border-border'
              }`}
              onClick={() => !isSimulating && runSimulation(scenario)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isNegative
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-green-500/10 text-green-400'
                }`}>
                  {isNegative ? 'Risk Scenario' : 'Positive Scenario'}
                </span>
                {isActive && isSimulating && (
                  <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                )}
              </div>

              <h4 className="text-base font-semibold text-foreground mb-1.5">{scenario.name}</h4>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{scenario.description}</p>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {isNegative ? <ArrowDown size={12} className="text-red-400" /> : <ArrowUp size={12} className="text-green-400" />}
                  <span className={isNegative ? 'text-red-400' : 'text-green-400'}>
                    {scenario.impact.healthDrop > 0 ? '+' : ''}{scenario.impact.healthDrop} health
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle size={12} />
                  <span>{scenario.impact.newBlockers > 0 ? '+' : ''}{scenario.impact.newBlockers} blocker{Math.abs(scenario.impact.newBlockers) !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <button
                className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                    : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                }`}
                onClick={(e) => { e.stopPropagation(); !isSimulating && runSimulation(scenario); }}
              >
                <Play size={12} />
                {isActive && isSimulating ? 'Simulating...' : isActive ? 'Re-Run' : 'Run Simulation'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl bg-card border p-6 animate-slide-up ${
          isPositive ? 'border-green-500/20 glow-green' : 'border-red-500/20 glow-red'
        }`}>
          <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2">
            {isPositive ? <TrendingUp size={16} className="text-green-400" /> : <TrendingDown size={16} className="text-red-400" />}
            Simulation Result
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Health Score */}
            <div className="rounded-xl bg-secondary border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Health Score</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-muted-foreground/50">{currentHealth}</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{newHealth}</span>
              </div>
              <span className={`text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                ({result.healthDrop > 0 ? '+' : ''}{result.healthDrop})
              </span>
            </div>

            {/* New Blockers */}
            <div className="rounded-xl bg-secondary border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Blockers Change</p>
              <p className={`text-2xl font-bold ${result.newBlockers > 0 ? 'text-red-400' : result.newBlockers < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                {result.newBlockers > 0 ? '+' : ''}{result.newBlockers}
              </p>
              <span className="text-sm text-muted-foreground">new blockers</span>
            </div>

            {/* Delivery Risk */}
            <div className="rounded-xl bg-secondary border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Delivery Risk</p>
              <p className={`text-2xl font-bold ${result.riskChange.deliveryRisk > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {result.riskChange.deliveryRisk > 0 ? '+' : ''}{result.riskChange.deliveryRisk}%
              </p>
              <span className="text-sm text-muted-foreground">change</span>
            </div>

            {/* Integration Risk */}
            <div className="rounded-xl bg-secondary border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Integration Risk</p>
              <p className={`text-2xl font-bold ${result.riskChange.integrationRisk > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {result.riskChange.integrationRisk > 0 ? '+' : ''}{result.riskChange.integrationRisk}%
              </p>
              <span className="text-sm text-muted-foreground">change</span>
            </div>
          </div>

          {/* Affected modules */}
          <div className="rounded-xl bg-secondary/50 border border-border p-4">
            <p className="text-sm text-muted-foreground mb-3 font-medium">Affected Modules</p>
            <div className="flex flex-wrap gap-2">
              {result.affectedModules.map((m) => (
                <span
                  key={m}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                    isPositive
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No simulation yet */}
      {!result && !isSimulating && (
        <div className="rounded-2xl bg-card border border-border border-dashed p-12 text-center">
          <SlidersHorizontal size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a scenario above to simulate its impact</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Results show projected changes to health score, blockers, and risk levels</p>
        </div>
      )}
    </div>
  );
}
