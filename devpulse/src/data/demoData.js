// ============================================================
// DevPulse — Pre-Seeded Demo Data
// Simulates a 2-week student project "StudyBuddy" with 4 devs
// ============================================================

export const TEAM = {
  name: 'StudyBuddy',
  repo: 'team-alpha/studybuddy',
  description: 'A collaborative study platform for university students',
  createdAt: '2026-02-06T10:00:00Z',
  deadline: '2026-02-22T18:00:00Z',
  members: [
    { id: 'u1', name: 'Manit', avatar: 'M', role: 'Full Stack Lead', color: '#3b82f6' },
    { id: 'u2', name: 'Ravi', avatar: 'R', role: 'Backend Developer', color: '#10b981' },
    { id: 'u3', name: 'Priya', avatar: 'P', role: 'Frontend Developer', color: '#8b5cf6' },
    { id: 'u4', name: 'Akshith', avatar: 'A', role: 'DevOps / AI', color: '#f59e0b' },
  ],
};

// --- Commit History (2 weeks, realistic patterns) ---
export const COMMITS = [
  // Week 1 — good momentum
  { id: 'c1', author: 'u1', message: 'Initial project setup with Vite + React', date: '2026-02-06T11:30:00Z', files: ['package.json', 'vite.config.js', 'src/App.jsx'], additions: 145, deletions: 0, module: 'setup' },
  { id: 'c2', author: 'u2', message: 'Set up Express server with MongoDB connection', date: '2026-02-06T14:20:00Z', files: ['server/index.js', 'server/db.js', 'package.json'], additions: 210, deletions: 0, module: 'backend' },
  { id: 'c3', author: 'u3', message: 'Added Tailwind CSS and base layout components', date: '2026-02-06T16:00:00Z', files: ['src/index.css', 'src/components/Layout.jsx'], additions: 98, deletions: 5, module: 'frontend' },
  { id: 'c4', author: 'u4', message: 'Docker setup and CI/CD pipeline', date: '2026-02-06T18:45:00Z', files: ['Dockerfile', '.github/workflows/ci.yml', 'docker-compose.yml'], additions: 180, deletions: 0, module: 'devops' },
  { id: 'c5', author: 'u1', message: 'User authentication with JWT tokens', date: '2026-02-07T10:00:00Z', files: ['server/auth/jwt.js', 'server/routes/auth.js', 'server/middleware/auth.js'], additions: 320, deletions: 12, module: 'auth' },
  { id: 'c6', author: 'u2', message: 'Database schema for users and study groups', date: '2026-02-07T12:30:00Z', files: ['server/models/User.js', 'server/models/StudyGroup.js'], additions: 156, deletions: 0, module: 'database' },
  { id: 'c7', author: 'u3', message: 'Login and signup UI pages', date: '2026-02-07T15:00:00Z', files: ['src/pages/Login.jsx', 'src/pages/Signup.jsx', 'src/components/AuthForm.jsx'], additions: 280, deletions: 8, module: 'frontend' },
  { id: 'c8', author: 'u1', message: 'Study group CRUD API endpoints', date: '2026-02-08T09:30:00Z', files: ['server/routes/groups.js', 'server/controllers/groupController.js'], additions: 245, deletions: 15, module: 'backend' },
  { id: 'c9', author: 'u2', message: 'fixed stuff', date: '2026-02-08T23:50:00Z', files: ['server/routes/auth.js'], additions: 3, deletions: 2, module: 'auth', flagged: true, honestySuggestion: 'Fixed typo in auth route error message' },
  { id: 'c10', author: 'u3', message: 'Dashboard layout with sidebar navigation', date: '2026-02-09T11:00:00Z', files: ['src/pages/Dashboard.jsx', 'src/components/Sidebar.jsx', 'src/components/Navbar.jsx'], additions: 310, deletions: 25, module: 'frontend' },

  // Week 2 — velocity drops, problems emerge
  { id: 'c11', author: 'u1', message: 'Real-time messaging with Socket.IO', date: '2026-02-10T10:00:00Z', files: ['server/socket/chat.js', 'src/components/Chat.jsx', 'server/index.js'], additions: 420, deletions: 30, module: 'messaging' },
  { id: 'c12', author: 'u4', message: 'Deployment to Railway', date: '2026-02-10T14:00:00Z', files: ['railway.toml', 'server/index.js'], additions: 45, deletions: 8, module: 'devops' },
  { id: 'c13', author: 'u2', message: 'done', date: '2026-02-11T02:00:00Z', files: ['server/models/StudyGroup.js', 'server/routes/groups.js', 'server/controllers/groupController.js'], additions: 89, deletions: 45, module: 'backend', flagged: true, honestySuggestion: 'Refactored study group model with validation and updated controller error handling' },
  { id: 'c14', author: 'u3', message: 'Study group cards and list view', date: '2026-02-11T16:00:00Z', files: ['src/components/GroupCard.jsx', 'src/pages/Groups.jsx'], additions: 195, deletions: 10, module: 'frontend' },
  { id: 'c15', author: 'u1', message: 'Fixed authentication bug in token refresh', date: '2026-02-12T09:00:00Z', files: ['server/auth/jwt.js', 'server/middleware/auth.js', 'src/utils/api.js'], additions: 67, deletions: 34, module: 'auth' },
  { id: 'c16', author: 'u2', message: 'Updated database schema', date: '2026-02-13T11:00:00Z', files: ['server/models/User.js', 'server/models/StudyGroup.js', 'server/models/Session.js'], additions: 130, deletions: 78, module: 'database' },
  { id: 'c17', author: 'u1', message: 'Notification system backend', date: '2026-02-14T10:00:00Z', files: ['server/routes/notifications.js', 'server/models/Notification.js', 'server/socket/notifications.js'], additions: 275, deletions: 5, module: 'backend' },
  { id: 'c18', author: 'u3', message: 'Fixed authentication UI', date: '2026-02-15T14:00:00Z', files: ['src/pages/Login.jsx', 'src/components/Button.jsx', 'src/index.css'], additions: 15, deletions: 8, module: 'frontend', flagged: true, honestySuggestion: 'Updated button styles and fixed CSS alignment on login page (no auth logic changed)' },
  { id: 'c19', author: 'u1', message: 'Search functionality for study groups', date: '2026-02-16T12:00:00Z', files: ['server/routes/search.js', 'src/components/SearchBar.jsx', 'src/pages/Search.jsx'], additions: 198, deletions: 12, module: 'search' },
  { id: 'c20', author: 'u4', message: 'Environment variables and secrets setup', date: '2026-02-17T09:00:00Z', files: ['.env.example', 'server/config.js'], additions: 35, deletions: 12, module: 'devops' },
  // Ravi goes silent after Feb 13...
  { id: 'c21', author: 'u1', message: 'Profile page with edit functionality', date: '2026-02-18T10:30:00Z', files: ['src/pages/Profile.jsx', 'server/routes/users.js'], additions: 220, deletions: 18, module: 'frontend' },
  { id: 'c22', author: 'u3', message: 'Mobile responsive layout fixes', date: '2026-02-18T15:00:00Z', files: ['src/index.css', 'src/components/Sidebar.jsx', 'src/components/Navbar.jsx'], additions: 85, deletions: 40, module: 'frontend' },
  { id: 'c23', author: 'u1', message: 'Final API integration for groups', date: '2026-02-19T11:00:00Z', files: ['src/pages/Groups.jsx', 'src/utils/api.js', 'src/hooks/useGroups.js'], additions: 167, deletions: 55, module: 'frontend' },
];

// --- Branches ---
export const BRANCHES = [
  { name: 'main', lastCommit: '2026-02-19T11:00:00Z', author: 'u1', status: 'active', ahead: 0, behind: 0 },
  { name: 'feature/auth', lastCommit: '2026-02-12T09:00:00Z', author: 'u1', status: 'merged', ahead: 0, behind: 0 },
  { name: 'feature/chat', lastCommit: '2026-02-10T10:00:00Z', author: 'u1', status: 'merged', ahead: 0, behind: 0 },
  { name: 'feature/groups-api', lastCommit: '2026-02-11T02:00:00Z', author: 'u2', status: 'stale', ahead: 5, behind: 12, staleDays: 9 },
  { name: 'feature/dashboard-ui', lastCommit: '2026-02-18T15:00:00Z', author: 'u3', status: 'active', ahead: 3, behind: 2 },
  { name: 'feature/notifications', lastCommit: '2026-02-14T10:00:00Z', author: 'u1', status: 'active', ahead: 4, behind: 6 },
  { name: 'feature/db-migration', lastCommit: '2026-02-13T11:00:00Z', author: 'u2', status: 'abandoned', ahead: 2, behind: 15, staleDays: 7 },
  { name: 'devops/ci-cd', lastCommit: '2026-02-17T09:00:00Z', author: 'u4', status: 'active', ahead: 1, behind: 4 },
];

// --- Pull Requests ---
export const PULL_REQUESTS = [
  { id: 'pr1', title: 'Add user authentication', author: 'u1', branch: 'feature/auth', status: 'merged', createdAt: '2026-02-08T10:00:00Z', mergedAt: '2026-02-12T10:00:00Z', reviewers: ['u2'], comments: 5 },
  { id: 'pr2', title: 'Study group CRUD endpoints', author: 'u2', branch: 'feature/groups-api', status: 'open', createdAt: '2026-02-11T03:00:00Z', mergedAt: null, reviewers: [], comments: 0, ageDays: 9, stagnant: true },
  { id: 'pr3', title: 'Real-time chat implementation', author: 'u1', branch: 'feature/chat', status: 'merged', createdAt: '2026-02-10T11:00:00Z', mergedAt: '2026-02-11T09:00:00Z', reviewers: ['u3'], comments: 3 },
  { id: 'pr4', title: 'Dashboard UI components', author: 'u3', branch: 'feature/dashboard-ui', status: 'open', createdAt: '2026-02-16T10:00:00Z', mergedAt: null, reviewers: ['u1'], comments: 2, ageDays: 4 },
  { id: 'pr5', title: 'Database schema migration', author: 'u2', branch: 'feature/db-migration', status: 'open', createdAt: '2026-02-13T12:00:00Z', mergedAt: null, reviewers: [], comments: 0, ageDays: 7, stagnant: true },
  { id: 'pr6', title: 'Notification system', author: 'u1', branch: 'feature/notifications', status: 'open', createdAt: '2026-02-14T11:00:00Z', mergedAt: null, reviewers: [], comments: 1, ageDays: 6 },
];

// --- Health & Delivery Metrics (computed from demo COMMITS) ---
// These are fallback values. When the API is available, live metrics are used instead.
function computeDemoHealth() {
  const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, Math.round(v)));
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const daysBetween = (a, b) => Math.abs(new Date(a) - new Date(b)) / 864e5;
  const now = new Date();
  const members = TEAM.members;
  const openPRs = PULL_REQUESTS.filter(p => p.status === 'open' && !p.mergedAt);
  const stagnantPRs = openPRs.filter(p => p.stagnant);
  const unreviewedPRs = openPRs.filter(p => (p.reviewers || []).length === 0).length;
  const inactiveCount = members.filter(m => {
    const mc = COMMITS.filter(c => c.author === m.id);
    if (!mc.length) return true;
    const latest = mc.reduce((a, b) => new Date(a.date) > new Date(b.date) ? a : b);
    return daysBetween(latest.date, now) > 5;
  }).length;

  const deliveryRisk = clamp(0, 100, stagnantPRs.length * 15 + inactiveCount * 18 + unreviewedPRs * 8);
  const divergedBranches = BRANCHES.filter(b => b.name !== 'main' && b.status !== 'merged' && ((b.behind || 0) > 5 || b.status === 'abandoned' || b.status === 'stale')).length;
  const integrationRisk = clamp(0, 100, divergedBranches * 12 + 20);
  const vagueCount = COMMITS.filter(c => c.flagged).length;
  const stabilityRisk = clamp(0, 100, (vagueCount / Math.max(COMMITS.length, 1)) * 50);

  const overall = clamp(0, 100, 100 - (deliveryRisk * 0.45 + integrationRisk * 0.30 + stabilityRisk * 0.25));

  // Trend: group commits by date, compute per-day health
  const sortedDates = COMMITS.map(c => new Date(c.date)).sort((a, b) => a - b);
  const firstDate = new Date(sortedDates[0]);
  firstDate.setHours(0, 0, 0, 0);
  const endDate = new Date(sortedDates[sortedDates.length - 1]);
  endDate.setHours(23, 59, 59, 999);
  const trend = [];
  const dayMs = 864e5;
  for (let d = new Date(firstDate); d <= endDate; d = new Date(d.getTime() + dayMs)) {
    const endOfDay = new Date(d); endOfDay.setHours(23, 59, 59, 999);
    const cumCommits = COMMITS.filter(c => new Date(c.date) <= endOfDay);
    const vague = cumCommits.filter(c => c.flagged).length;
    const st = clamp(0, 100, (vague / Math.max(cumCommits.length, 1)) * 50);
    const dayScore = clamp(0, 100, 100 - (deliveryRisk * 0.45 + integrationRisk * 0.30 + st * 0.25));
    trend.push({ date: fmtDate(d), score: dayScore });
  }

  return { overall, trend, breakdown: { deliveryRisk, integrationRisk, stabilityRisk } };
}

function computeDemoVelocity() {
  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const members = TEAM.members;
  const sortedDates = COMMITS.map(c => new Date(c.date)).sort((a, b) => a - b);
  const firstDate = new Date(sortedDates[0]); firstDate.setHours(0, 0, 0, 0);
  const lastDate = new Date(sortedDates[sortedDates.length - 1]); lastDate.setHours(0, 0, 0, 0);

  const velocityMap = {};
  COMMITS.forEach(c => {
    const key = fmtDate(c.date);
    if (!velocityMap[key]) velocityMap[key] = {};
    const name = members.find(m => m.id === c.author)?.name || c.author;
    velocityMap[key][name] = (velocityMap[key][name] || 0) + 1;
  });

  const velocity = [];
  const dayMs = 864e5;
  for (let d = new Date(firstDate); d <= lastDate; d = new Date(d.getTime() + dayMs)) {
    const key = fmtDate(d);
    const entry = { date: key };
    members.forEach(m => { entry[m.name] = velocityMap[key]?.[m.name] || 0; });
    velocity.push(entry);
  }
  return velocity;
}

function computeDemoContributions() {
  const members = TEAM.members;
  const total = Math.max(COMMITS.length, 1);
  return members.map(m => {
    const mc = COMMITS.filter(c => c.author === m.id);
    return {
      name: m.name,
      commits: mc.length,
      additions: mc.reduce((s, c) => s + (c.additions || 0), 0),
      deletions: mc.reduce((s, c) => s + (c.deletions || 0), 0),
      percentage: Math.round((mc.length / total) * 100),
    };
  });
}

export const HEALTH_SCORE = computeDemoHealth();
export const VELOCITY_DATA = computeDemoVelocity();
export const CONTRIBUTION_STATS = computeDemoContributions();

// --- Active Work Map ---
export const ACTIVE_WORK = [
  { memberId: 'u1', name: 'Manit', status: 'active', currentTask: 'API integration for groups', module: 'frontend', lastCommit: '4 hours ago', branch: 'main' },
  { memberId: 'u2', name: 'Ravi', status: 'inactive', currentTask: 'Database migration (stalled)', module: 'database', lastCommit: '7 days ago', branch: 'feature/db-migration', warning: 'No activity in 7 days' },
  { memberId: 'u3', name: 'Priya', status: 'active', currentTask: 'Mobile responsive fixes', module: 'frontend', lastCommit: '2 days ago', branch: 'feature/dashboard-ui' },
  { memberId: 'u4', name: 'Akshith', status: 'idle', currentTask: 'CI/CD pipeline updates', module: 'devops', lastCommit: '3 days ago', branch: 'devops/ci-cd' },
];

// --- Blocker Alerts ---
export const BLOCKERS = [
  {
    id: 'b1',
    severity: 'critical',
    type: 'stale_pr',
    title: 'PR #2 "Study group CRUD" open for 9 days with no review',
    description: 'This PR contains backend API endpoints that the frontend needs. Blocking frontend integration.',
    affectedModules: ['backend', 'frontend'],
    owner: 'u2',
    detectedAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 'b2',
    severity: 'critical',
    type: 'inactive_member',
    title: 'Ravi has no commits in 7 days',
    description: 'Last activity: Feb 13. Database migration branch is abandoned. Team cannot proceed with DB-dependent features.',
    affectedModules: ['database', 'backend'],
    owner: 'u2',
    detectedAt: '2026-02-20T08:00:00Z',
  },
  {
    id: 'b3',
    severity: 'high',
    type: 'branch_divergence',
    title: 'feature/db-migration is 15 commits behind main',
    description: 'This branch has diverged significantly. Merge will likely produce conflicts in 3+ files.',
    affectedModules: ['database'],
    owner: 'u2',
    detectedAt: '2026-02-19T14:00:00Z',
  },
  {
    id: 'b4',
    severity: 'medium',
    type: 'unreviewed_pr',
    title: 'PR #6 "Notification system" has no reviewer assigned',
    description: 'Open for 6 days. Notification module is complete but not integrated.',
    affectedModules: ['backend'],
    owner: 'u1',
    detectedAt: '2026-02-20T08:00:00Z',
  },
  {
    id: 'b5',
    severity: 'low',
    type: 'integration_mismatch',
    title: 'Frontend calls /api/groups but backend route is /api/study-groups',
    description: 'Route mismatch detected between frontend fetch calls and backend Express routes.',
    affectedModules: ['frontend', 'backend'],
    owner: null,
    detectedAt: '2026-02-20T09:00:00Z',
  },
];

// --- Integration Risk Data ---
export const INTEGRATION_RISKS = [
  { module: 'Auth', risk: 15, status: 'integrated', dependencies: ['Backend', 'Frontend'] },
  { module: 'Database', risk: 72, status: 'at-risk', dependencies: ['Backend', 'Auth'] },
  { module: 'Backend API', risk: 55, status: 'at-risk', dependencies: ['Database', 'Frontend'] },
  { module: 'Frontend UI', risk: 30, status: 'partial', dependencies: ['Backend API', 'Auth'] },
  { module: 'Messaging', risk: 20, status: 'integrated', dependencies: ['Backend', 'Frontend'] },
  { module: 'Notifications', risk: 60, status: 'isolated', dependencies: ['Backend', 'Frontend'] },
  { module: 'DevOps/Deploy', risk: 35, status: 'partial', dependencies: ['Backend'] },
  { module: 'Search', risk: 40, status: 'partial', dependencies: ['Backend API', 'Frontend'] },
];

// --- Bus Factor Data (module × contributor ownership %) ---
export const BUS_FACTOR = {
  modules: ['Auth', 'Database', 'Backend API', 'Frontend UI', 'Messaging', 'Notifications', 'DevOps', 'Search'],
  contributors: ['Manit', 'Ravi', 'Priya', 'Akshith'],
  data: [
    // [Manit, Ravi, Priya, Akshith] — percentages per module
    [85, 10, 5, 0],    // Auth — Manit is bus factor
    [0, 95, 0, 5],     // Database — Ravi is bus factor ⚠️
    [40, 50, 5, 5],    // Backend API
    [25, 0, 70, 5],    // Frontend UI — Priya dominant
    [90, 0, 10, 0],    // Messaging — Manit is bus factor
    [95, 0, 0, 5],     // Notifications — Manit is bus factor ⚠️
    [5, 0, 0, 95],     // DevOps — Akshith is bus factor
    [80, 10, 10, 0],   // Search — Manit dominant
  ],
};

// --- Simulation Defaults ---
export const SIMULATION_SCENARIOS = [
  {
    id: 'sim1',
    name: 'PR #2 delayed 48 hours',
    description: 'What if the Study Group CRUD PR stays open 2 more days?',
    prId: 'pr2',
    delayHours: 48,
    impact: {
      healthDrop: -18,
      newBlockers: 2,
      affectedModules: ['Backend API', 'Frontend UI', 'Search'],
      riskChange: { deliveryRisk: +22, integrationRisk: +15 },
    },
  },
  {
    id: 'sim2',
    name: 'Ravi stays inactive',
    description: 'What if Ravi contributes nothing for 2 more days?',
    memberId: 'u2',
    delayHours: 48,
    impact: {
      healthDrop: -12,
      newBlockers: 1,
      affectedModules: ['Database', 'Backend API'],
      riskChange: { deliveryRisk: +15, integrationRisk: +20 },
    },
  },
  {
    id: 'sim3',
    name: 'Notification PR merged',
    description: 'What if the Notification system PR is merged today?',
    prId: 'pr6',
    delayHours: 0,
    impact: {
      healthDrop: +8,
      newBlockers: -1,
      affectedModules: ['Notifications'],
      riskChange: { deliveryRisk: -5, integrationRisk: -10 },
    },
  },
];

// --- Commit Honesty Checks ---
export const COMMIT_HONESTY = [
  {
    commitId: 'c9',
    message: 'fixed stuff',
    actualChanges: 'Changed error message string in auth route from "Unauthorized" to "Invalid credentials"',
    matchScore: 18,
    suggestion: 'Fixed typo in auth route error message',
    verdict: 'misleading',
  },
  {
    commitId: 'c13',
    message: 'done',
    actualChanges: 'Refactored StudyGroup model with mongoose validation, updated groupController error handling, modified 3 route handlers',
    matchScore: 8,
    suggestion: 'Refactored study group model with validation and updated controller error handling',
    verdict: 'misleading',
  },
  {
    commitId: 'c18',
    message: 'Fixed authentication UI',
    actualChanges: 'Changed button background color, adjusted padding on login form, fixed CSS flexbox alignment. No authentication logic was modified.',
    matchScore: 25,
    suggestion: 'Updated button styles and CSS alignment on login page',
    verdict: 'misleading',
  },
  {
    commitId: 'c15',
    message: 'Fixed authentication bug in token refresh',
    actualChanges: 'Fixed JWT token refresh logic, updated auth middleware to handle expired tokens, added retry logic in API utility',
    matchScore: 92,
    suggestion: null,
    verdict: 'honest',
  },
];

// --- AI Advisor Sample Responses ---
export const AI_ADVISOR_RESPONSES = {
  'biggest risk': {
    response: `**Critical Risk: Ravi's inactivity is cascading through the project.**\n\nRavi owns 95% of the Database module and hasn't committed in 7 days. His PR #2 (Study Group CRUD) has been open for 9 days with zero reviews. The database migration branch is now 15 commits behind main.\n\n**Impact chain:** Database stalled → Backend API can't integrate → Frontend blocked on group features → Search feature partially broken.\n\n**Recommended action:** Have Manit or Akshith take over the database migration immediately. Merge PR #2 with a code review today.`,
    confidence: 94,
  },
  'who needs help': {
    response: `**Ravi needs immediate intervention.**\n\n- Last commit: 7 days ago\n- 2 open PRs with no reviews\n- Owns 95% of Database module (bus factor = 1)\n- Branch is 15 commits behind main\n\nThis isn't just "needs help" — the team needs to decide: Is Ravi still active? If yes, pair him with Manit on the database migration. If no, redistribute his work immediately.\n\n**Priya** could also use support — she's been working alone on frontend with some backend API calls returning 404 due to route mismatches.`,
    confidence: 88,
  },
  'demo readiness': {
    response: `**Demo Readiness: 45% — NOT ready.**\n\n✅ **Working:** Auth system, real-time chat, basic UI layout\n⚠️ **Partial:** Study groups (API exists but frontend can't connect — route mismatch), Dashboard UI (PR open)\n❌ **Not integrated:** Notifications (PR #6 unmerged), Database migration (abandoned), Search (depends on group API)\n\n**To reach demo-ready in 48 hours:**\n1. Merge PR #2 and #4 immediately\n2. Fix /api/groups vs /api/study-groups route mismatch\n3. Skip notification integration — demo without it\n4. Deploy current main to Railway\n\n**Realistic demo scope:** Auth + Chat + Study Groups (if PRs merge today)`,
    confidence: 91,
  },
  'default': {
    response: `**DevPulse Analysis — Feb 20, 2026**\n\n**Health Score: 62/100** (declining from 85 two weeks ago)\n\n**Key Issues:**\n1. 🔴 Ravi inactive for 7 days — Database module at risk\n2. 🔴 2 stale PRs blocking integration\n3. 🟡 Route mismatch between frontend/backend\n4. 🟡 Manit handling 60% of all commits — overloaded\n\n**Delivery Risk:** 38% | **Integration Risk:** 45% | **Stability Risk:** 28%\n\n**48-hour forecast:** If no PRs are merged, health drops to ~44. If PR #2 and #5 merge, health recovers to ~74.\n\nAsk me about specific risks, team members, or modules.`,
    confidence: 85,
  },
};

// --- Ghosting Detection ---
export const GHOSTING_ALERTS = [
  {
    memberId: 'u2',
    name: 'Ravi',
    lastCommit: '2026-02-13T11:00:00Z',
    lastMessage: '2026-02-15T09:00:00Z',
    type: 'talking_not_coding',
    alert: 'Ravi sent messages 2 days after his last commit. Talking but not coding.',
    daysSinceCommit: 7,
  },
];

// CONTRIBUTION_STATS is now computed above by computeDemoContributions()
