import { Bell, Github, Clock } from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

export default function Navbar() {
  const { data: teamData } = useApi(api.getTeam, { repo: '', description: '', members: [], deadline: null });
  const { data: healthData } = useApi(api.getHealthScore, { overall: 0 });
  const healthOverall = healthData.overall ?? 0;
  const hoursLeft = teamData.deadline
    ? Math.max(0, Math.round((new Date(teamData.deadline) - new Date()) / (1000 * 60 * 60)))
    : null;

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left — Repo info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Github size={16} />
          <span className="text-sm font-mono font-medium">{teamData.repo}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-xs text-muted-foreground hidden md:inline">{teamData.description}</span>
      </div>

      {/* Right — Status bar */}
      <div className="flex items-center gap-3">
        {/* Deadline countdown */}
        {hoursLeft !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-border">
            <Clock size={14} className={hoursLeft <= 24 ? 'text-red-400' : 'text-amber-400'} />
            <span className={`text-xs font-mono font-bold ${hoursLeft <= 24 ? 'text-red-400' : 'text-amber-400'}`}>
              {hoursLeft}h left
            </span>
          </div>
        )}

        {/* Health badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
          healthOverall >= 70
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : healthOverall >= 50
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            healthOverall >= 70 ? 'bg-green-400' : healthOverall >= 50 ? 'bg-amber-400' : 'bg-red-400'
          } animate-pulse`} />
          <span className="text-xs font-bold">{healthOverall}%</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background" />
        </button>

        {/* Team avatars */}
        <div className="flex -space-x-2">
          {teamData.members.map((member) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background"
              style={{ backgroundColor: member.color + '20', color: member.color }}
              title={member.name}
            >
              {member.avatar}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
