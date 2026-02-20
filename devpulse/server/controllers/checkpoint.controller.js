// ────────────────────────────────────────────────────────
// Checkpoint / Task Allocation Controller
// Lead allocates work → collaborators update progress
// ────────────────────────────────────────────────────────

import * as store from '../data/store.js';
import github from '../services/github.service.js';

let nextId = 100; // auto-increment ID

/** GET /api/checkpoints — list all checkpoints */
export const getCheckpoints = (_req, res) => {
  const checkpoints = store.CHECKPOINTS || [];
  const members = store.TEAM?.members || [];
  const now = new Date();

  // Enrich with computed fields
  const enriched = checkpoints.map(cp => {
    const deadline = new Date(cp.deadline);
    const isOverdue = cp.status !== 'completed' && deadline < now;
    const daysLeft = Math.ceil((deadline - now) / 864e5);
    const member = members.find(m => m.id === cp.assignee);

    return {
      ...cp,
      assigneeName: cp.assigneeName || member?.name || cp.assignee,
      assigneeAvatar: member?.avatar || cp.assignee?.[0]?.toUpperCase(),
      assigneeColor: member?.color || '#6b7280',
      isOverdue,
      daysLeft,
      ...(isOverdue && cp.status !== 'completed' && { status: 'overdue' }),
    };
  });

  // Summary stats
  const summary = {
    total: enriched.length,
    completed: enriched.filter(c => c.status === 'completed').length,
    inProgress: enriched.filter(c => c.status === 'in-progress').length,
    overdue: enriched.filter(c => c.isOverdue).length,
    notStarted: enriched.filter(c => c.status === 'not-started').length,
    avgProgress: enriched.length
      ? Math.round(enriched.reduce((s, c) => s + (c.progress || 0), 0) / enriched.length)
      : 0,
  };

  res.json({ checkpoints: enriched, summary });
};

/** GET /api/checkpoints/:id — single checkpoint */
export const getCheckpoint = (req, res) => {
  const cp = (store.CHECKPOINTS || []).find(c => c.id === req.params.id);
  if (!cp) return res.status(404).json({ error: 'Checkpoint not found' });
  res.json(cp);
};

/** POST /api/checkpoints — create checkpoint (lead only) */
export const createCheckpoint = (req, res) => {
  // Check if user is lead
  if (github.token && !github.isLead) {
    return res.status(403).json({ error: 'Only the repository lead/admin can create checkpoints' });
  }

  const { title, description, assignee, priority, deadline } = req.body;
  if (!title || !assignee || !deadline) {
    return res.status(400).json({ error: 'title, assignee, and deadline are required' });
  }

  const members = store.TEAM?.members || [];
  const member = members.find(m => m.id === assignee || m.name.toLowerCase() === assignee.toLowerCase());

  const checkpoint = {
    id: `cp${nextId++}`,
    title,
    description: description || '',
    assignee: member?.id || assignee,
    assigneeName: member?.name || assignee,
    priority: priority || 'medium',
    status: 'not-started',
    deadline: new Date(deadline).toISOString(),
    createdAt: new Date().toISOString(),
    completedAt: null,
    createdBy: github.user?.login || 'lead',
    progress: 0,
  };

  store.CHECKPOINTS = [...(store.CHECKPOINTS || []), checkpoint];
  res.status(201).json(checkpoint);
};

/** PUT /api/checkpoints/:id — update checkpoint (lead can edit all, member can update own progress) */
export const updateCheckpoint = (req, res) => {
  const checkpoints = store.CHECKPOINTS || [];
  const idx = checkpoints.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Checkpoint not found' });

  const cp = checkpoints[idx];
  const { title, description, assignee, priority, deadline, status, progress } = req.body;

  // If lead: can update anything
  // If collaborator: can only update status and progress on their own tasks
  const isLeadUser = !github.token || github.isLead;

  if (!isLeadUser) {
    // Collaborator: can only update status/progress
    const updated = { ...cp };
    if (status) updated.status = status;
    if (progress != null) updated.progress = Math.min(100, Math.max(0, Number(progress)));
    if (updated.status === 'completed') {
      updated.progress = 100;
      updated.completedAt = new Date().toISOString();
    }
    const newList = [...checkpoints];
    newList[idx] = updated;
    store.CHECKPOINTS = newList;
    return res.json(updated);
  }

  // Lead: full update
  const members = store.TEAM?.members || [];
  const member = assignee
    ? members.find(m => m.id === assignee || m.name.toLowerCase() === assignee.toLowerCase())
    : null;

  const updated = {
    ...cp,
    ...(title       && { title }),
    ...(description != null && { description }),
    ...(assignee    && { assignee: member?.id || assignee, assigneeName: member?.name || assignee }),
    ...(priority    && { priority }),
    ...(deadline    && { deadline: new Date(deadline).toISOString() }),
    ...(status      && { status }),
    ...(progress != null && { progress: Math.min(100, Math.max(0, Number(progress))) }),
  };

  if (updated.status === 'completed') {
    updated.progress = 100;
    updated.completedAt = updated.completedAt || new Date().toISOString();
  }

  const newList = [...checkpoints];
  newList[idx] = updated;
  store.CHECKPOINTS = newList;
  res.json(updated);
};

/** DELETE /api/checkpoints/:id — delete checkpoint (lead only) */
export const deleteCheckpoint = (req, res) => {
  if (github.token && !github.isLead) {
    return res.status(403).json({ error: 'Only the repository lead/admin can delete checkpoints' });
  }

  const checkpoints = store.CHECKPOINTS || [];
  const idx = checkpoints.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Checkpoint not found' });

  store.CHECKPOINTS = checkpoints.filter(c => c.id !== req.params.id);
  res.json({ deleted: true });
};

/** GET /api/checkpoints/member/:memberId — get checkpoints for specific member */
export const getMemberCheckpoints = (req, res) => {
  const { memberId } = req.params;
  const checkpoints = (store.CHECKPOINTS || []).filter(c => c.assignee === memberId);
  const now = new Date();

  const enriched = checkpoints.map(cp => {
    const deadline = new Date(cp.deadline);
    const isOverdue = cp.status !== 'completed' && deadline < now;
    const daysLeft = Math.ceil((deadline - now) / 864e5);
    return { ...cp, isOverdue, daysLeft, ...(isOverdue && cp.status !== 'completed' && { status: 'overdue' }) };
  });

  res.json(enriched);
};

/** GET /api/checkpoints/progress — progress summary per member */
export const getProgressSummary = (_req, res) => {
  const checkpoints = store.CHECKPOINTS || [];
  const members = store.TEAM?.members || [];
  const now = new Date();

  const memberProgress = members.map(m => {
    const tasks = checkpoints.filter(c => c.assignee === m.id);
    const completed = tasks.filter(c => c.status === 'completed').length;
    const overdue = tasks.filter(c => {
      return c.status !== 'completed' && new Date(c.deadline) < now;
    }).length;
    const avgProgress = tasks.length
      ? Math.round(tasks.reduce((s, c) => s + (c.progress || 0), 0) / tasks.length)
      : 0;
    const onTrack = tasks.filter(c => {
      return c.status !== 'completed' && new Date(c.deadline) >= now;
    }).length;

    return {
      memberId: m.id,
      name: m.name,
      avatar: m.avatar,
      color: m.color,
      role: m.role,
      totalTasks: tasks.length,
      completed,
      inProgress: tasks.filter(c => c.status === 'in-progress').length,
      overdue,
      onTrack,
      avgProgress,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  });

  res.json({
    members: memberProgress,
    overall: {
      total: checkpoints.length,
      completed: checkpoints.filter(c => c.status === 'completed').length,
      overdue: checkpoints.filter(c => c.status !== 'completed' && new Date(c.deadline) < now).length,
      avgProgress: checkpoints.length
        ? Math.round(checkpoints.reduce((s, c) => s + (c.progress || 0), 0) / checkpoints.length)
        : 0,
    },
  });
};
