import { Bell, Github } from 'lucide-react';
import { TEAM } from '../../data/demoData';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

export default function Navbar() {
  const { data: teamData } = useApi(api.getTeam, TEAM);

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
