import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar
} from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, Shield, Zap } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

const EMPTY_HEALTH = { overall: 0, trend: [], breakdown: { deliveryRisk: 0, integrationRisk: 0, stabilityRisk: 0 } };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-popover border border-border px-4 py-3 text-xs shadow-xl">
      <p className="text-foreground font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function ScoreGauge({ score, label, color }) {
  const data = [{ name: label, value: score, fill: color }];
  return (
    <div className="flex flex-col items-center">
      <div className="w-28 h-28 relative">
        <RadialBarChart
          width={112} height={112}
          cx={56} cy={56}
          innerRadius={38} outerRadius={52}
          data={data} startAngle={90} endAngle={-270}
          barSize={8}
        >
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(255,255,255,0.03)' }} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export default function HealthRadar() {
  const { data: apiData } = useApi(api.getHealthRadar, { healthScore: EMPTY_HEALTH, velocity: [], contributions: [] });
  const healthScore = apiData.healthScore || EMPTY_HEALTH;
  const velocityData = apiData.velocity || [];
  const { data: teamData } = useApi(api.getTeam, { members: [] });
  const contributions = apiData.contributions || [];
  const { data: blockerData } = useApi(api.getBlockerDashboard, { blockers: [], ghostingAlerts: [] });
  const { overall, trend, breakdown } = healthScore;
  const lastTwo = trend.slice(-2);
  const trendDirection = lastTwo.length >= 2 && lastTwo[1]?.score >= lastTwo[0]?.score ? 'up' : 'down';

  // Compute dynamic stats from API data
  const blockerCount = (blockerData.blockers || []).length;
  const stalePrCount = (blockerData.blockers || []).filter(b => b.type === 'stale_pr' || b.type === 'unreviewed_pr').length;
  const behindLabel = breakdown.deliveryRisk > 0 ? `${Math.round(breakdown.deliveryRisk / 10)}d behind` : '0d behind';

  return (
    <div className="space-y-6">
      {/* Top Row — Score + Risk Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Main Health Score */}
        <div className={`rounded-2xl bg-card border border-border p-6 col-span-1 flex flex-col items-center justify-center ${
          overall >= 70 ? 'glow-green' : overall >= 50 ? 'glow-amber' : 'glow-red'
        }`}>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={overall >= 70 ? '#10b981' : overall >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(overall / 100) * 264} 264`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-black ${
                overall >= 70 ? 'text-green-400' : overall >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>{overall}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Health</span>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 mt-4 text-sm font-medium ${
            trendDirection === 'up' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trendDirection === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trendDirection === 'up' ? 'Improving' : 'Declining'} trend</span>
          </div>
        </div>

        {/* Risk Breakdown Gauges */}
        <div className="rounded-2xl bg-card border border-border p-6 col-span-1 lg:col-span-3 flex items-center justify-around">
          <ScoreGauge score={breakdown.deliveryRisk} label="Delivery Risk" color="#ef4444" />
          <div className="h-16 w-px bg-border" />
          <ScoreGauge score={breakdown.integrationRisk} label="Integration Risk" color="#f59e0b" />
          <div className="h-16 w-px bg-border" />
          <ScoreGauge score={breakdown.stabilityRisk} label="Stability Risk" color="#8b5cf6" />
          <div className="h-16 w-px bg-border" />
          <div className="flex flex-col items-center gap-2.5">
            {[
              { icon: AlertTriangle, label: `${blockerCount} Blocker${blockerCount !== 1 ? 's' : ''}`, color: 'text-red-400' },
              { icon: Shield, label: `${stalePrCount} Stale PR${stalePrCount !== 1 ? 's' : ''}`, color: 'text-amber-400' },
              { icon: Zap, label: behindLabel, color: 'text-violet-400' },
            ].map(({ icon: Icon, label, color }, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm font-medium ${color}`}>
                <Icon size={13} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Trend Chart */}
      <div className="rounded-2xl bg-card border border-border p-6">
        <h3 className="text-base font-semibold text-foreground mb-5">Health Score Trend</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#708090' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#708090' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="score" name="Health"
                stroke="#3b82f6" strokeWidth={2}
                fill="url(#healthGradient)"
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#1e3a5f', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity + Contribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Velocity Chart */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-5">Commit Velocity by Member</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#708090' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#708090' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {teamData.members.map((m) => (
                  <Area
                    key={m.id} type="monotone" dataKey={m.name} name={m.name}
                    stroke={m.color} fill={m.color} fillOpacity={0.1}
                    strokeWidth={2} dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contribution Breakdown */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-base font-semibold text-foreground mb-5">Contribution Distribution</h3>
          <div className="space-y-4">
            {contributions.map((stat) => {
              const member = teamData.members.find((m) => m.name === stat.name);
              return (
                <div key={stat.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: member?.color + '20', color: member?.color }}
                      >
                        {stat.name[0]}
                      </div>
                      <span className="text-sm text-foreground font-medium">{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{stat.commits} commits</span>
                      <span className="text-green-400/80">+{stat.additions}</span>
                      <span className="text-red-400/80">-{stat.deletions}</span>
                      <span className="font-bold text-foreground">{stat.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${stat.percentage}%`,
                        backgroundColor: member?.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
