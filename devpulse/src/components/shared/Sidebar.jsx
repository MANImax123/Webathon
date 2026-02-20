import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity, AlertTriangle, GitBranch, BarChart3, Shield,
  Users, Cpu, ChevronLeft, ChevronRight,
  Home, GitCommit, Bot, SlidersHorizontal, Github, Target
} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: Home, path: '/dashboard' },
  { id: 'commits', label: 'Commit Honesty', icon: GitCommit, path: '/commits' },
  { id: 'settings', label: 'GitHub Connect', icon: Github, path: '/settings' },
];

const DASHBOARD_SECTIONS = [
  { id: 'health', label: 'Health Radar', icon: Activity, color: 'blue' },
  { id: 'workmap', label: 'Active Work Map', icon: Users, color: 'emerald' },
  { id: 'blockers', label: 'Blocker Alerts', icon: AlertTriangle, color: 'red' },
  { id: 'integration', label: 'Integration Risk', icon: GitBranch, color: 'amber' },
  { id: 'busfactor', label: 'Bus Factor', icon: Shield, color: 'violet' },
  { id: 'simulation', label: 'Simulation', icon: SlidersHorizontal, color: 'cyan' },
  { id: 'advisor', label: 'AI Advisor', icon: Bot, color: 'blue' },
  { id: 'checkpoints', label: 'Checkpoints', icon: Target, color: 'emerald' },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-64'
      } bg-sidebar border-r border-sidebar-border`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <AnimatedLogo size="md" />
          {!collapsed && (
            <span className="text-lg font-extrabold tracking-tight">
              Dev<span className="gradient-text">Pulse</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-blue-500/20'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-blue-400' : 'text-muted-foreground group-hover:text-sidebar-foreground'} />
              {!collapsed && <span className="text-lg font-medium">{item.label}</span>}
            </Link>
          );
        })}

        {location.pathname === '/dashboard' && (
          <>
            {!collapsed && (
              <p className="px-3 mt-6 mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Dashboard Panels
              </p>
            )}
            {collapsed && <div className="my-3 mx-2 h-px bg-sidebar-border" />}
            {DASHBOARD_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/30'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-blue-400' : 'text-muted-foreground group-hover:text-sidebar-foreground/70'} />
                  {!collapsed && <span className="text-base font-medium">{section.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
