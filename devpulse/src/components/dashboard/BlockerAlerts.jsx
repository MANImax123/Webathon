import { AlertTriangle, AlertCircle, Info, GitPullRequest, UserX, GitBranch, Link2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

const severityConfig = {
  critical: {
    color: 'text-red-400', bg: 'bg-red-500/[0.06]', border: 'border-red-500/20',
    icon: AlertTriangle, badge: 'bg-red-500/15 text-red-400',
  },
  high: {
    color: 'text-amber-400', bg: 'bg-amber-500/[0.06]', border: 'border-amber-500/20',
    icon: AlertCircle, badge: 'bg-amber-500/15 text-amber-400',
  },
  medium: {
    color: 'text-yellow-400', bg: 'bg-yellow-500/[0.06]', border: 'border-yellow-500/15',
    icon: AlertCircle, badge: 'bg-yellow-500/15 text-yellow-400',
  },
  low: {
    color: 'text-blue-400', bg: 'bg-blue-500/[0.06]', border: 'border-blue-500/15',
    icon: Info, badge: 'bg-blue-500/15 text-blue-400',
  },
};

const typeIcons = {
  stale_pr: GitPullRequest,
  inactive_member: UserX,
  branch_divergence: GitBranch,
  unreviewed_pr: GitPullRequest,
  integration_mismatch: Link2,
};

export default function BlockerAlerts() {
  const { data: apiData } = useApi(api.getBlockerDashboard, { blockers: [], ghostingAlerts: [] });
  const blockers = apiData.blockers || [];
  const ghostingAlerts = apiData.ghostingAlerts || [];
  const { data: teamData } = useApi(api.getTeam, { members: [] });
  const criticalCount = blockers.filter((b) => b.severity === 'critical').length;
  const highCount = blockers.filter((b) => b.severity === 'high').length;

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{blockers.length} Active Blockers</p>
            <p className="text-sm text-muted-foreground">Identified from GitHub activity analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-sm font-bold text-red-400">{criticalCount} Critical</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-sm font-bold text-amber-400">{highCount} High</span>
          </div>
        </div>
      </div>

      {/* Ghosting Alert */}
      {ghostingAlerts.map((ghost) => {
        const member = teamData.members.find((m) => m.id === ghost.memberId);
        return (
          <div key={ghost.memberId} className="rounded-2xl bg-card border border-violet-500/20 p-5 glow-purple">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserX size={18} className="text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-sm font-bold text-violet-300">Ghosting Detected</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium">
                    {ghost.type === 'talking_not_coding' ? 'Talking, Not Coding' : 'Coding, Not Talking'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{ghost.alert}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Last commit: <span className="text-red-400 font-medium">{ghost.daysSinceCommit} days ago</span></span>
                  <span>|</span>
                  <span>Member: <span className="font-medium" style={{ color: member?.color }}>{ghost.name}</span></span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Blocker Cards */}
      <div className="space-y-3">
        {blockers.map((blocker) => {
          const cfg = severityConfig[blocker.severity];
          const TypeIcon = typeIcons[blocker.type] || AlertCircle;
          const SevIcon = cfg.icon;
          const owner = teamData.members.find((m) => m.id === blocker.owner);

          return (
            <div
              key={blocker.id}
              className={`rounded-2xl bg-card border ${cfg.border} p-5 transition-all duration-300 hover:border-opacity-60`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <TypeIcon size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.badge} uppercase tracking-wide`}>
                      {blocker.severity}
                    </span>
                    <span className="text-sm text-muted-foreground capitalize">{blocker.type.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{blocker.title}</p>
                  <p className="text-sm text-muted-foreground mb-3">{blocker.description}</p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {blocker.affectedModules.map((mod) => (
                      <span key={mod} className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground border border-border font-medium">
                        {mod}
                      </span>
                    ))}
                    {owner && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">Owner:</span>
                        <span className="font-medium" style={{ color: owner.color }}>{owner.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <SevIcon size={16} className={`${cfg.color} flex-shrink-0 mt-1`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
