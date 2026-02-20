import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Plus, Trash2, Edit3,
  Target, User, Calendar, ChevronDown, ChevronUp, BarChart3,
  Flag, Loader2, Save, X, Mail, Copy, Check, Bell, CalendarDays,
  List, ChevronLeft, ChevronRight, BellRing,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

const PRIORITY_COLORS = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  low: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-400' },
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Completed' },
  'in-progress': { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress' },
  overdue: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Overdue' },
  'not-started': { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Not Started' },
};

/* ── Helper Components ──────────────────────────────────── */

function ProgressBar({ value, className = '' }) {
  const color = value >= 100 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value >= 30 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={`h-2 rounded-full bg-secondary overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ── Create Checkpoint Form ─────────────────────────────── */

function CreateCheckpointForm({ members, onCreated, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '', assignee: '', priority: 'medium', deadline: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.assignee || !form.deadline) {
      setError('Title, assignee, and deadline are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const member = members.find((m) => m.id === form.assignee);
      const result = await api.createCheckpoint({
        ...form,
        assigneeName: member?.name || form.assignee,
        deadline: new Date(form.deadline).toISOString(),
      });
      onCreated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-card border border-blue-500/20 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Plus size={18} className="text-blue-400" /> New Checkpoint
        </h3>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
            placeholder="e.g. Implement payment integration"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none"
            placeholder="Optional details about the task…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Assignee</label>
          <select
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-blue-500/50"
          >
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-blue-500/50"
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">Deadline</label>
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-2.5">
        <CalendarDays size={14} className="text-blue-400 flex-shrink-0" />
        <span>Task will be added to the assignee's <strong className="text-foreground">Google Calendar</strong> with reminders (1 hr &amp; 1 day before). If Gmail is configured, a calendar invite email is also sent.</span>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground bg-secondary border border-border">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Create Checkpoint
        </button>
      </div>
    </form>
  );
}

/* ── Checkpoint Card ────────────────────────────────────── */

function CheckpointCard({ cp, isLead, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(cp.progress);
  const [status, setStatus] = useState(cp.status);
  const [saving, setSaving] = useState(false);
  const statusCfg = STATUS_CONFIG[cp.status] || STATUS_CONFIG['not-started'];
  const StatusIcon = statusCfg.icon;
  const priorityCfg = PRIORITY_COLORS[cp.priority] || PRIORITY_COLORS.medium;

  const daysLeft = cp.daysLeft ?? cp.daysRemaining;
  const deadlineStr = new Date(cp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateCheckpoint(cp.id, { progress, status });
      onUpdate();
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this checkpoint?')) return;
    try {
      await api.deleteCheckpoint(cp.id);
      onDelete();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`rounded-2xl bg-card border ${cp.isOverdue ? 'border-red-500/30' : 'border-border'} p-5 transition-all hover:border-blue-500/20`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${statusCfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <StatusIcon size={16} className={statusCfg.color} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground truncate">{cp.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityCfg.bg} ${priorityCfg.text}`}>
                {cp.priority}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User size={12} /> {cp.assigneeName}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar size={12} /> {deadlineStr}
              </span>
              {daysLeft !== undefined && cp.status !== 'completed' && (
                <span className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-400' : daysLeft <= 2 ? 'text-amber-400' : 'text-green-400'}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isLead && (
            <button onClick={handleDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={cp.progress} className="flex-1" />
        <span className="text-xs font-bold text-muted-foreground w-10 text-right">{cp.progress}%</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {cp.description && (
            <p className="text-sm text-muted-foreground">{cp.description}</p>
          )}

          {/* Inline edit for progress / status */}
          {editing ? (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Progress ({progress}%)</label>
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-32 accent-blue-500"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
              <button onClick={() => { setEditing(false); setProgress(cp.progress); setStatus(cp.status); }} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground bg-secondary border border-border">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Edit3 size={12} /> Update Progress
            </button>
          )}

          <div className="text-xs text-muted-foreground">
            Created {new Date(cp.createdAt).toLocaleDateString()}
            {cp.completedAt && ` · Completed ${new Date(cp.completedAt).toLocaleDateString()}`}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Team Progress Section ──────────────────────────────── */

function MemberProgressSection({ progress }) {
  if (!progress || progress.length === 0) return null;
  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 size={18} className="text-violet-400" /> Team Progress Overview
      </h3>
      <div className="space-y-4">
        {progress.map((mp) => (
          <div key={mp.memberId} className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
              {(mp.name || mp.memberName)?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground truncate">{mp.name || mp.memberName}</span>
                <span className="text-xs text-muted-foreground">
                  {mp.completed}/{mp.totalTasks || mp.total} done · {mp.completionRate}%
                </span>
              </div>
              <ProgressBar value={mp.completionRate} />
            </div>
            {mp.overdue > 0 && (
              <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                {mp.overdue} overdue
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Team Emails Panel (Lead Only) ──────────────────────── */

function TeamEmailsPanel() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.getCollaboratorEmails()
      .then((res) => setEmails(res.collaborators || []))
      .catch(() => setEmails([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (email, login) => {
    navigator.clipboard.writeText(email);
    setCopied(login);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Mail size={18} className="text-cyan-400" /> Team Emails
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {emails.map((c) => (
          <div key={c.login} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/50 border border-border">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
              {(c.name || c.login)?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{c.name || c.login}</p>
              {c.role && <p className="text-xs text-muted-foreground">{c.role}</p>}
              {c.email ? (
                <p className="text-xs text-blue-400 truncate">{c.email}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No public email</p>
              )}
            </div>
            {c.email && (
              <button
                onClick={() => handleCopy(c.email, c.login)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
                title="Copy email"
              >
                {copied === c.login ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Calendar View ──────────────────────────────────────── */

function CalendarView({ checkpoints }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Map checkpoints to date strings
  const cpByDate = {};
  (checkpoints || []).forEach((cp) => {
    const d = new Date(cp.deadline);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!cpByDate[key]) cpByDate[key] = [];
      cpByDate[key].push(cp);
    }
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const statusDot = (status) => {
    if (status === 'completed') return 'bg-green-400';
    if (status === 'overdue') return 'bg-red-400';
    if (status === 'in-progress') return 'bg-blue-400';
    return 'bg-gray-400';
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CalendarDays size={18} className="text-amber-400" /> Calendar View
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">{monthName}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="h-20 rounded-lg" />;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const dayCps = cpByDate[day] || [];

          return (
            <div
              key={day}
              className={`h-20 rounded-lg border p-1.5 transition-colors ${isToday
                ? 'border-blue-500/50 bg-blue-500/5'
                : dayCps.length > 0
                  ? 'border-border bg-secondary/30'
                  : 'border-transparent'
                }`}
            >
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-400' : 'text-muted-foreground'}`}>
                {day}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayCps.slice(0, 2).map((cp) => (
                  <div key={cp.id} className="flex items-center gap-1" title={`${cp.title} — ${cp.assigneeName}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(cp.status)}`} />
                    <span className="text-[10px] text-foreground truncate leading-tight">{cp.title}</span>
                  </div>
                ))}
                {dayCps.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{dayCps.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        {[
          { label: 'Completed', color: 'bg-green-400' },
          { label: 'In Progress', color: 'bg-blue-400' },
          { label: 'Overdue', color: 'bg-red-400' },
          { label: 'Not Started', color: 'bg-gray-400' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${l.color}`} /> {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Browser Notification Reminders ─────────────────────── */

function useCheckpointReminders(checkpoints) {
  const notifiedRef = useRef(new Set());

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!checkpoints || checkpoints.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      checkpoints.forEach((cp) => {
        if (cp.status === 'completed') return;
        const deadline = new Date(cp.deadline);
        const hoursLeft = (deadline - now) / 3600000;
        const key = `${cp.id}-${hoursLeft < 0 ? 'overdue' : hoursLeft <= 1 ? '1h' : '24h'}`;

        if (notifiedRef.current.has(key)) return;

        // Trigger notifications for overdue, due within 1 hour, or due within 24 hours
        if (hoursLeft < 0 && !notifiedRef.current.has(`${cp.id}-overdue`)) {
          new Notification(`⚠️ Task Overdue: ${cp.title}`, {
            body: `Assigned to ${cp.assigneeName}. This task is ${Math.abs(Math.round(hoursLeft))} hours overdue!`,
            icon: '📋',
            tag: `devpulse-${cp.id}-overdue`,
          });
          notifiedRef.current.add(`${cp.id}-overdue`);
        } else if (hoursLeft > 0 && hoursLeft <= 1 && !notifiedRef.current.has(`${cp.id}-1h`)) {
          new Notification(`⏰ Due in 1 hour: ${cp.title}`, {
            body: `Assigned to ${cp.assigneeName}. Deadline: ${deadline.toLocaleTimeString()}`,
            icon: '⏰',
            tag: `devpulse-${cp.id}-1h`,
          });
          notifiedRef.current.add(`${cp.id}-1h`);
        } else if (hoursLeft > 1 && hoursLeft <= 24 && !notifiedRef.current.has(`${cp.id}-24h`)) {
          new Notification(`📋 Due tomorrow: ${cp.title}`, {
            body: `Assigned to ${cp.assigneeName}. Deadline: ${deadline.toLocaleString()}`,
            icon: '📅',
            tag: `devpulse-${cp.id}-24h`,
          });
          notifiedRef.current.add(`${cp.id}-24h`);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, [checkpoints]);
}

/* ── Main Checkpoint Panel ──────────────────────────────── */

export default function CheckpointPanel() {
  const { data: teamData } = useApi(api.getTeam, { members: [] });
  const [checkpoints, setCheckpoints] = useState([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0, notStarted: 0 });
  const [memberProgress, setMemberProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const members = teamData?.members || [];

  // Fetch isLead from GitHub status (real value instead of hardcoded true)
  const [isLead, setIsLead] = useState(true); // default true for demo mode
  useEffect(() => {
    api.getGithubStatus()
      .then((status) => {
        // In demo mode (not connected), default to lead
        if (status.connected && status.permission) {
          setIsLead(status.isLead === true);
        } else {
          setIsLead(true); // demo mode = lead
        }
      })
      .catch(() => setIsLead(true)); // fallback: demo mode
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cpRes, progressRes] = await Promise.all([
        api.getCheckpoints(),
        api.getProgressSummary(),
      ]);
      setCheckpoints(cpRes.checkpoints || []);
      setSummary(cpRes.summary || {});
      setMemberProgress(progressRes.members || progressRes.progress || []);
    } catch (err) {
      console.warn('Checkpoint load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Enable browser notification reminders
  useCheckpointReminders(checkpoints);

  const filtered = filter === 'all'
    ? checkpoints
    : checkpoints.filter((cp) => cp.status === filter);

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-card border border-border p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Target size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">Checkpoints & Task Allocation</p>
            <p className="text-sm text-muted-foreground">
              {isLead ? 'Assign work, set deadlines, and monitor team progress' : 'View your assigned tasks and update progress'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Notification permission button */}
          {notifPermission !== 'granted' && (
            <button
              onClick={requestNotifPermission}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/20 transition-colors"
              title="Enable browser reminders for task deadlines"
            >
              <BellRing size={14} />
              Enable Reminders
            </button>
          )}
          {notifPermission === 'granted' && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2.5 py-1.5 rounded-xl">
              <Bell size={12} /> Reminders On
            </span>
          )}

          {/* View mode toggle */}
          <div className="flex items-center bg-secondary rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Calendar View"
            >
              <CalendarDays size={14} />
            </button>
          </div>

          {/* New Checkpoint - Lead only */}
          {isLead && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Plus size={14} />
              New Checkpoint
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Total Tasks" value={summary.total} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={CheckCircle2} label="Completed" value={summary.completed} color="bg-green-500/10 text-green-400" />
        <StatCard icon={Loader2} label="In Progress" value={summary.inProgress} color="bg-amber-500/10 text-amber-400" />
        <StatCard icon={AlertTriangle} label="Overdue" value={summary.overdue} color="bg-red-500/10 text-red-400" />
      </div>

      {/* Create Form — Lead only */}
      {showCreate && isLead && (
        <CreateCheckpointForm
          members={members}
          onCreated={(result) => {
            setShowCreate(false);
            loadData();
            // Show confirmation if email was sent
            if (result?.emailSent) {
              alert(`✅ Checkpoint created! Calendar invite sent to ${result.assigneeEmail}`);
            }
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Team Emails — Lead only */}
      {isLead && <TeamEmailsPanel />}

      {/* Team Progress */}
      <MemberProgressSection progress={memberProgress} />

      {/* Calendar View */}
      {viewMode === 'calendar' && <CalendarView checkpoints={checkpoints} />}

      {/* Filter Tabs */}
      {viewMode === 'list' && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'in-progress', label: 'In Progress' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'completed', label: 'Completed' },
              { key: 'not-started', label: 'Not Started' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Checkpoint Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={24} className="animate-spin mr-2" /> Loading checkpoints…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No checkpoints {filter !== 'all' ? `with status "${filter}"` : 'yet'}.</p>
              {isLead && <p className="text-xs mt-1">Click "New Checkpoint" to allocate work to your team.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((cp) => (
                <CheckpointCard
                  key={cp.id}
                  cp={cp}
                  isLead={isLead}
                  onUpdate={loadData}
                  onDelete={loadData}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
