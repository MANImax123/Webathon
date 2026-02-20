import { AlertTriangle, Shield } from 'lucide-react';
import { BUS_FACTOR, TEAM } from '../../data/demoData';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

function getColor(value) {
  if (value >= 90) return { bg: 'bg-red-500', text: '#ef4444', intensity: 'ring-red-500/30' };
  if (value >= 70) return { bg: 'bg-amber-500', text: '#f59e0b', intensity: 'ring-amber-500/20' };
  if (value >= 40) return { bg: 'bg-blue-500', text: '#3b82f6', intensity: '' };
  if (value >= 10) return { bg: 'bg-blue-500/40', text: '#3b82f680', intensity: '' };
  return { bg: 'bg-secondary', text: '#334155', intensity: '' };
}

function getOpacity(value) {
  if (value === 0) return 0.05;
  return Math.min(0.15 + (value / 100) * 0.85, 1);
}

export default function BusFactorHeatmap() {
  const { data: busFactor } = useApi(api.getBusFactor, BUS_FACTOR);
  const { data: teamData } = useApi(api.getTeam, TEAM);
  const warnings = [];
  busFactor.data.forEach((row, moduleIdx) => {
    const max = Math.max(...row);
    if (max >= 85) {
      const ownerIdx = row.indexOf(max);
      warnings.push({
        module: busFactor.modules[moduleIdx],
        owner: busFactor.contributors[ownerIdx],
        percentage: max,
        member: teamData.members[ownerIdx],
      });
    }
  });

  return (
    <div className="space-y-5">
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-2xl bg-card border border-red-500/20 p-5 glow-red">
          <div className="flex items-center gap-2.5 mb-4">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-sm font-bold text-red-300">
              Bus Factor Warning — {warnings.length} module{warnings.length > 1 ? 's' : ''} at risk
            </span>
          </div>
          <div className="space-y-2.5">
            {warnings.map((w) => (
              <div key={w.module} className="flex items-center gap-2.5 text-sm">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: w.member?.color + '20', color: w.member?.color }}
                >
                  {w.owner[0]}
                </div>
                <span className="text-muted-foreground">
                  <span className="font-bold" style={{ color: w.member?.color }}>{w.owner}</span>
                  {' '}owns <span className="text-red-400 font-bold">{w.percentage}%</span> of{' '}
                  <span className="text-foreground font-medium">{w.module}</span>
                  {' '}— if unavailable, no one can safely modify this module.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Shield size={16} className="text-blue-400" />
            <h3 className="text-base font-bold text-foreground">Module Ownership Heatmap</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[10, 30, 50, 70, 90].map((v) => (
                <div
                  key={v}
                  className="w-5 h-3.5 rounded-sm"
                  style={{ backgroundColor: getColor(v).text, opacity: getOpacity(v) }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-sm text-muted-foreground font-medium pb-4 pr-4 w-32">Module</th>
                {busFactor.contributors.map((name, idx) => {
                  const member = teamData.members[idx];
                  return (
                    <th key={name} className="text-center pb-4 px-2">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: member?.color + '15', color: member?.color }}
                        >
                          {name[0]}
                        </div>
                        <span className="text-sm text-muted-foreground">{name}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="text-center text-sm text-muted-foreground font-medium pb-4 pl-4">Risk</th>
              </tr>
            </thead>
            <tbody>
              {busFactor.modules.map((module, moduleIdx) => {
                const row = busFactor.data[moduleIdx];
                const max = Math.max(...row);
                const isBusFactor = max >= 85;

                return (
                  <tr key={module} className="group">
                    <td className="text-sm text-foreground py-2.5 pr-4 font-medium">
                      <div className="flex items-center gap-2">
                        {isBusFactor && <AlertTriangle size={12} className="text-red-400" />}
                        {module}
                      </div>
                    </td>
                    {row.map((value, colIdx) => {
                      const color = getColor(value);
                      return (
                        <td key={colIdx} className="text-center py-2.5 px-2">
                          <div
                            className={`w-full h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 cursor-default
                              ${value >= 85 ? 'ring-2 ' + color.intensity : ''}
                              group-hover:scale-105`}
                            style={{
                              backgroundColor: value === 0 ? 'rgba(255,255,255,0.02)' : color.text,
                              opacity: value === 0 ? 1 : getOpacity(value),
                              color: value >= 40 ? '#fff' : 'rgba(255,255,255,0.4)',
                            }}
                            title={`${busFactor.contributors[colIdx]}: ${value}% of ${module}`}
                          >
                            {value > 0 ? `${value}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center py-2.5 pl-4">
                      {isBusFactor ? (
                        <span className="text-xs font-bold text-red-400 px-2.5 py-1 rounded-full bg-red-500/10">
                          High
                        </span>
                      ) : max >= 60 ? (
                        <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/10">
                          Medium
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-green-400 px-2.5 py-1 rounded-full bg-green-500/10">
                          Safe
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
