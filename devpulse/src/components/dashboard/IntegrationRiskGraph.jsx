import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { AlertTriangle, CheckCircle, Link2Off, Link2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

const riskColors = {
  'integrated': '#10b981',
  'partial': '#f59e0b',
  'at-risk': '#ef4444',
  'isolated': '#8b5cf6',
};

const statusBadge = {
  'integrated': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  'partial': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'at-risk': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  'isolated': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl bg-popover border border-border px-4 py-3 text-xs shadow-xl max-w-xs">
      <p className="font-semibold text-foreground mb-1">{d.module}</p>
      <p className="text-muted-foreground mb-2">Integration Risk: <span className="font-bold" style={{ color: riskColors[d.status] }}>{d.risk}%</span></p>
      <p className="text-muted-foreground">Dependencies: {d.dependencies.join(', ')}</p>
    </div>
  );
};

export default function IntegrationRiskGraph() {
  const { data: risks } = useApi(api.getIntegrationRisks, []);
  const sortedRisks = [...risks].sort((a, b) => b.risk - a.risk);
  const highRisk = risks.filter((r) => r.risk >= 50);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Link2 size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Module Integration Status</p>
            <p className="text-sm text-muted-foreground">{highRisk.length} modules at risk of integration failure</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(statusBadge).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${cfg.bg} border ${cfg.border}`}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: riskColors[key] }} />
              <span className={`text-xs ${cfg.text} capitalize font-medium`}>{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Bar Chart */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <h3 className="text-base font-semibold text-foreground mb-5">Integration Risk by Module</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedRisks} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#708090' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="module" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="risk" radius={[0, 6, 6, 0]} barSize={20}>
                {sortedRisks.map((entry, index) => (
                  <Cell key={index} fill={riskColors[entry.status]} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dependency Map Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {risks.map((module) => {
          const badge = statusBadge[module.status];
          return (
            <div key={module.module} className={`rounded-2xl bg-card border ${badge.border} p-5 transition-all hover:border-opacity-60`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {module.risk >= 50 ? (
                    <AlertTriangle size={14} className="text-red-400" />
                  ) : module.risk >= 30 ? (
                    <Link2Off size={14} className="text-amber-400" />
                  ) : (
                    <CheckCircle size={14} className="text-green-400" />
                  )}
                  <span className="text-sm font-medium text-foreground">{module.module}</span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text} border ${badge.border} capitalize font-medium`}>
                  {module.status}
                </span>
              </div>

              {/* Risk bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-muted-foreground mb-1.5">
                  <span>Risk Level</span>
                  <span className="font-bold" style={{ color: riskColors[module.status] }}>{module.risk}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${module.risk}%`, backgroundColor: riskColors[module.status] }}
                  />
                </div>
              </div>

              {/* Dependencies */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm text-muted-foreground">Depends on:</span>
                {module.dependencies.map((dep, i) => (
                  <span key={dep} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted">•</span>}
                    <span className="text-sm text-muted-foreground font-medium">{dep}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
