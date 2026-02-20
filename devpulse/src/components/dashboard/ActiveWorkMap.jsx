import { GitBranch, Clock, AlertCircle } from 'lucide-react';
import { ACTIVE_WORK, TEAM, COMMITS } from '../../data/demoData';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

const statusConfig = {
  active: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dot: 'bg-green-400', label: 'Active' },
  inactive: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-400', label: 'Inactive' },
  idle: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-400', label: 'Idle' },
};

export default function ActiveWorkMap() {
  const { data: apiData } = useApi(api.getWorkMap, { activeWork: ACTIVE_WORK, recentCommits: COMMITS.slice(-10) });
  const activeWork = apiData.activeWork || ACTIVE_WORK;
  const { data: teamData } = useApi(api.getTeam, TEAM);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Who's Doing What</h3>
        <div className="flex items-center gap-4">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-sm text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeWork.map((work) => {
          const member = teamData.members.find((m) => m.id === work.memberId);
          const cfg = statusConfig[work.status];
          const recentCommits = (apiData.recentCommits || COMMITS).filter((c) => c.author === work.memberId).slice(-3);

          return (
            <div
              key={work.memberId}
              className={`rounded-2xl bg-card border ${cfg.border} p-5 transition-all duration-300 hover:border-opacity-60`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: member?.color + '15', color: member?.color }}
                    >
                      {member?.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${cfg.dot} ${work.status === 'active' ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{work.name}</p>
                    <p className="text-sm text-muted-foreground">{member?.role}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>

              {/* Current Task */}
              <div className="mb-3 p-3 rounded-xl bg-secondary border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Task</p>
                <p className="text-sm text-foreground">{work.currentTask}</p>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <GitBranch size={12} />
                  <span className="font-mono">{work.branch}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} />
                  <span>{work.lastCommit}</span>
                </div>
              </div>

              {/* Warning */}
              {work.warning && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/15">
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400">{work.warning}</span>
                </div>
              )}

              {/* Recent commits mini list */}
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Recent Commits</p>
                <div className="space-y-1.5">
                  {recentCommits.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-sm">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{c.message}</span>
                      {c.flagged && (
                        <AlertCircle size={10} className="text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
