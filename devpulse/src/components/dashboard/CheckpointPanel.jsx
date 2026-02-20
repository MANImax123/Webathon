import { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, AlertTriangle, Plus, Trash2, Edit3,
  Target, User, Calendar, ChevronDown, ChevronUp, BarChart3,
  Flag, Loader2, Save, X,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import api from '../../services/api';

const PRIORITY_COLORS = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
  high:     { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  medium:   { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  low:      { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-400' },
};

const STATUS_CONFIG = {
  completed:    { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Completed' },
  'in-progress': { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress' },
  overdue:      { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Overdue' },
  'not-started': { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Not Started' },
};

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
      await api.createCheckpoint({
        ...form,
        assigneeName: member?.name || form.assignee,
        deadline: new Date(form.deadline).toISOString(),
      });
      onCreated();
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

export default function CheckpointPanel() {
  const { data: teamData } = useApi(api.getTeam, { members: [] });
  const [checkpoints, setCheckpoints] = useState([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0, notStarted: 0 });
  const [memberProgress, setMemberProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  const members = teamData?.members || [];

  // For demo, treat first user as lead. In production this comes from GitHub auth.
  const isLead = true;

  const loadData = async () => {
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
  };

  useEffect(() => { loadData(); }, []);

  const filtered = filter === 'all'
    ? checkpoints
    : checkpoints.filter((cp) => cp.status === filter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Total Tasks" value={summary.total} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={CheckCircle2} label="Completed" value={summary.completed} color="bg-green-500/10 text-green-400" />
        <StatCard icon={Loader2} label="In Progress" value={summary.inProgress} color="bg-amber-500/10 text-amber-400" />
        <StatCard icon={AlertTriangle} label="Overdue" value={summary.overdue} color="bg-red-500/10 text-red-400" />
      </div>

      {/* Create Form */}
      {showCreate && (
        <CreateCheckpointForm
          members={members}
          onCreated={() => { setShowCreate(false); loadData(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Team Progress */}
      <MemberProgressSection progress={memberProgress} />

      {/* Filter Tabs */}
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
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
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
    </div>
  );
}
