// ============================================================
// DevPulse Server â€” Seeded Data Store
// In production this would be sourced from GitHub API + DB.
// For now, identical data to what frontend had, served via API.
// ============================================================

export let TEAM = {
  name: 'StudyBuddy',
  repo: 'team-alpha/studybuddy',
  description: 'A collaborative study platform for university students',
  createdAt: '2026-02-06T10:00:00Z',
  deadline: '2026-02-22T18:00:00Z',
  members: [
    { id: 'u1', name: 'Manit', avatar: 'M', role: 'Full Stack Lead', color: '#3b82f6', email: 'kaushik.phaniharam@gmail.com' },
    { id: 'u2', name: 'Ravi', avatar: 'R', role: 'Backend Developer', color: '#10b981', email: 'kaushik.phaniharam@gmail.com' },
    { id: 'u3', name: 'Priya', avatar: 'P', role: 'Frontend Developer', color: '#8b5cf6', email: 'kaushik.phaniharam@gmail.com' },
    { id: 'u4', name: 'Akshith', avatar: 'A', role: 'DevOps / AI', color: '#f59e0b', email: 'kaushik.phaniharam@gmail.com' },
  ],
};

export let COMMITS = [
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
  { id: 'c21', author: 'u1', message: 'Profile page with edit functionality', date: '2026-02-18T10:30:00Z', files: ['src/pages/Profile.jsx', 'server/routes/users.js'], additions: 220, deletions: 18, module: 'frontend' },
  { id: 'c22', author: 'u3', message: 'Mobile responsive layout fixes', date: '2026-02-18T15:00:00Z', files: ['src/index.css', 'src/components/Sidebar.jsx', 'src/components/Navbar.jsx'], additions: 85, deletions: 40, module: 'frontend' },
  { id: 'c23', author: 'u1', message: 'Final API integration for groups', date: '2026-02-19T11:00:00Z', files: ['src/pages/Groups.jsx', 'src/utils/api.js', 'src/hooks/useGroups.js'], additions: 167, deletions: 55, module: 'frontend' },
];

export let BRANCHES = [
  { name: 'main', lastCommit: '2026-02-19T11:00:00Z', author: 'u1', status: 'active', ahead: 0, behind: 0 },
  { name: 'feature/auth', lastCommit: '2026-02-12T09:00:00Z', author: 'u1', status: 'merged', ahead: 0, behind: 0 },
  { name: 'feature/chat', lastCommit: '2026-02-10T10:00:00Z', author: 'u1', status: 'merged', ahead: 0, behind: 0 },
  { name: 'feature/groups-api', lastCommit: '2026-02-11T02:00:00Z', author: 'u2', status: 'stale', ahead: 5, behind: 12, staleDays: 9 },
  { name: 'feature/dashboard-ui', lastCommit: '2026-02-18T15:00:00Z', author: 'u3', status: 'active', ahead: 3, behind: 2 },
  { name: 'feature/notifications', lastCommit: '2026-02-14T10:00:00Z', author: 'u1', status: 'active', ahead: 4, behind: 6 },
  { name: 'feature/db-migration', lastCommit: '2026-02-13T11:00:00Z', author: 'u2', status: 'abandoned', ahead: 2, behind: 15, staleDays: 7 },
  { name: 'devops/ci-cd', lastCommit: '2026-02-17T09:00:00Z', author: 'u4', status: 'active', ahead: 1, behind: 4 },
];

export let PULL_REQUESTS = [
  { id: 'pr1', title: 'Add user authentication', author: 'u1', branch: 'feature/auth', status: 'merged', createdAt: '2026-02-08T10:00:00Z', mergedAt: '2026-02-12T10:00:00Z', reviewers: ['u2'], comments: 5 },
  { id: 'pr2', title: 'Study group CRUD endpoints', author: 'u2', branch: 'feature/groups-api', status: 'open', createdAt: '2026-02-11T03:00:00Z', mergedAt: null, reviewers: [], comments: 0, ageDays: 9, stagnant: true },
  { id: 'pr3', title: 'Real-time chat implementation', author: 'u1', branch: 'feature/chat', status: 'merged', createdAt: '2026-02-10T11:00:00Z', mergedAt: '2026-02-11T09:00:00Z', reviewers: ['u3'], comments: 3 },
  { id: 'pr4', title: 'Dashboard UI components', author: 'u3', branch: 'feature/dashboard-ui', status: 'open', createdAt: '2026-02-16T10:00:00Z', mergedAt: null, reviewers: ['u1'], comments: 2, ageDays: 4 },
  { id: 'pr5', title: 'Database schema migration', author: 'u2', branch: 'feature/db-migration', status: 'open', createdAt: '2026-02-13T12:00:00Z', mergedAt: null, reviewers: [], comments: 0, ageDays: 7, stagnant: true },
  { id: 'pr6', title: 'Notification system', author: 'u1', branch: 'feature/notifications', status: 'open', createdAt: '2026-02-14T11:00:00Z', mergedAt: null, reviewers: [], comments: 1, ageDays: 6 },
];

// HEALTH_SCORE, VELOCITY_DATA, and CONTRIBUTION_STATS are now computed
// LIVE by server/services/metrics.service.js on every API request.
// No hardcoded values needed — they derive from COMMITS, BRANCHES,
// PULL_REQUESTS, TEAM, and BLOCKERS above.

export let ACTIVE_WORK = [
  { memberId: 'u1', name: 'Manit', status: 'active', currentTask: 'API integration for groups', module: 'frontend', lastCommit: '4 hours ago', branch: 'main' },
  { memberId: 'u2', name: 'Ravi', status: 'inactive', currentTask: 'Database migration (stalled)', module: 'database', lastCommit: '7 days ago', branch: 'feature/db-migration', warning: 'No activity in 7 days' },
  { memberId: 'u3', name: 'Priya', status: 'active', currentTask: 'Mobile responsive fixes', module: 'frontend', lastCommit: '2 days ago', branch: 'feature/dashboard-ui' },
  { memberId: 'u4', name: 'Akshith', status: 'idle', currentTask: 'CI/CD pipeline updates', module: 'devops', lastCommit: '3 days ago', branch: 'devops/ci-cd' },
];

export let BLOCKERS = [
  { id: 'b1', severity: 'critical', type: 'stale_pr', title: 'PR #2 "Study group CRUD" open for 9 days with no review', description: 'This PR contains backend API endpoints that the frontend needs. Blocking frontend integration.', affectedModules: ['backend', 'frontend'], owner: 'u2', detectedAt: '2026-02-18T10:00:00Z' },
  { id: 'b2', severity: 'critical', type: 'inactive_member', title: 'Ravi has no commits in 7 days', description: 'Last activity: Feb 13. Database migration branch is abandoned. Team cannot proceed with DB-dependent features.', affectedModules: ['database', 'backend'], owner: 'u2', detectedAt: '2026-02-20T08:00:00Z' },
  { id: 'b3', severity: 'high', type: 'branch_divergence', title: 'feature/db-migration is 15 commits behind main', description: 'This branch has diverged significantly. Merge will likely produce conflicts in 3+ files.', affectedModules: ['database'], owner: 'u2', detectedAt: '2026-02-19T14:00:00Z' },
  { id: 'b4', severity: 'medium', type: 'unreviewed_pr', title: 'PR #6 "Notification system" has no reviewer assigned', description: 'Open for 6 days. Notification module is complete but not integrated.', affectedModules: ['backend'], owner: 'u1', detectedAt: '2026-02-20T08:00:00Z' },
  { id: 'b5', severity: 'low', type: 'integration_mismatch', title: 'Frontend calls /api/groups but backend route is /api/study-groups', description: 'Route mismatch detected between frontend fetch calls and backend Express routes.', affectedModules: ['frontend', 'backend'], owner: null, detectedAt: '2026-02-20T09:00:00Z' },
];

export let GHOSTING_ALERTS = [
  { memberId: 'u2', name: 'Ravi', lastCommit: '2026-02-13T11:00:00Z', lastMessage: '2026-02-15T09:00:00Z', type: 'talking_not_coding', alert: 'Ravi sent messages 2 days after his last commit. Talking but not coding.', daysSinceCommit: 7 },
];

export let INTEGRATION_RISKS = [
  { module: 'Auth', risk: 15, status: 'integrated', dependencies: ['Backend', 'Frontend'] },
  { module: 'Database', risk: 72, status: 'at-risk', dependencies: ['Backend', 'Auth'] },
  { module: 'Backend API', risk: 55, status: 'at-risk', dependencies: ['Database', 'Frontend'] },
  { module: 'Frontend UI', risk: 30, status: 'partial', dependencies: ['Backend API', 'Auth'] },
  { module: 'Messaging', risk: 20, status: 'integrated', dependencies: ['Backend', 'Frontend'] },
  { module: 'Notifications', risk: 60, status: 'isolated', dependencies: ['Backend', 'Frontend'] },
  { module: 'DevOps/Deploy', risk: 35, status: 'partial', dependencies: ['Backend'] },
  { module: 'Search', risk: 40, status: 'partial', dependencies: ['Backend API', 'Frontend'] },
];

export let BUS_FACTOR = {
  modules: ['Auth', 'Database', 'Backend API', 'Frontend UI', 'Messaging', 'Notifications', 'DevOps', 'Search'],
  contributors: ['Manit', 'Ravi', 'Priya', 'Akshith'],
  data: [
    [85, 10, 5, 0],
    [0, 95, 0, 5],
    [40, 50, 5, 5],
    [25, 0, 70, 5],
    [90, 0, 10, 0],
    [95, 0, 0, 5],
    [5, 0, 0, 95],
    [80, 10, 10, 0],
  ],
};

export let SIMULATION_SCENARIOS = [
  { id: 'sim1', name: 'PR #2 delayed 48 hours', description: 'What if the Study Group CRUD PR stays open 2 more days?', prId: 'pr2', delayHours: 48, impact: { healthDrop: -18, newBlockers: 2, affectedModules: ['Backend API', 'Frontend UI', 'Search'], riskChange: { deliveryRisk: +22, integrationRisk: +15 } } },
  { id: 'sim2', name: 'Ravi stays inactive', description: 'What if Ravi contributes nothing for 2 more days?', memberId: 'u2', delayHours: 48, impact: { healthDrop: -12, newBlockers: 1, affectedModules: ['Database', 'Backend API'], riskChange: { deliveryRisk: +15, integrationRisk: +20 } } },
  { id: 'sim3', name: 'Notification PR merged', description: 'What if the Notification system PR is merged today?', prId: 'pr6', delayHours: 0, impact: { healthDrop: +8, newBlockers: -1, affectedModules: ['Notifications'], riskChange: { deliveryRisk: -5, integrationRisk: -10 } } },
];

export let COMMIT_HONESTY = [
  { commitId: 'c9', message: 'fixed stuff', actualChanges: 'Changed error message string in auth route from "Unauthorized" to "Invalid credentials"', matchScore: 18, suggestion: 'Fixed typo in auth route error message', verdict: 'misleading' },
  { commitId: 'c13', message: 'done', actualChanges: 'Refactored StudyGroup model with mongoose validation, updated groupController error handling, modified 3 route handlers', matchScore: 8, suggestion: 'Refactored study group model with validation and updated controller error handling', verdict: 'misleading' },
  { commitId: 'c18', message: 'Fixed authentication UI', actualChanges: 'Changed button background color, adjusted padding on login form, fixed CSS flexbox alignment. No authentication logic was modified.', matchScore: 25, suggestion: 'Updated button styles and CSS alignment on login page', verdict: 'misleading' },
  { commitId: 'c15', message: 'Fixed authentication bug in token refresh', actualChanges: 'Fixed JWT token refresh logic, updated auth middleware to handle expired tokens, added retry logic in API utility', matchScore: 92, suggestion: null, verdict: 'honest' },
];

export let AI_ADVISOR_RESPONSES = {
  'biggest risk': { response: `**Critical Risk: Ravi's inactivity is cascading through the project.**\n\nRavi owns 95% of the Database module and hasn't committed in 7 days. His PR #2 (Study Group CRUD) has been open for 9 days with zero reviews. The database migration branch is now 15 commits behind main.\n\n**Impact chain:** Database stalled â†’ Backend API can't integrate â†’ Frontend blocked on group features â†’ Search feature partially broken.\n\n**Recommended action:** Have Manit or Akshith take over the database migration immediately. Merge PR #2 with a code review today.`, confidence: 94 },
  'who needs help': { response: `**Ravi needs immediate intervention.**\n\n- Last commit: 7 days ago\n- 2 open PRs with no reviews\n- Owns 95% of Database module (bus factor = 1)\n- Branch is 15 commits behind main\n\nThis isn't just "needs help" â€” the team needs to decide: Is Ravi still active? If yes, pair him with Manit on the database migration. If no, redistribute his work immediately.\n\n**Priya** could also use support â€” she's been working alone on frontend with some backend API calls returning 404 due to route mismatches.`, confidence: 88 },
  'demo readiness': { response: `**Demo Readiness: 45% â€” NOT ready.**\n\nâœ… **Working:** Auth system, real-time chat, basic UI layout\nâš ï¸ **Partial:** Study groups (API exists but frontend can't connect â€” route mismatch), Dashboard UI (PR open)\nâŒ **Not integrated:** Notifications (PR #6 unmerged), Database migration (abandoned), Search (depends on group API)\n\n**To reach demo-ready in 48 hours:**\n1. Merge PR #2 and #4 immediately\n2. Fix /api/groups vs /api/study-groups route mismatch\n3. Skip notification integration â€” demo without it\n4. Deploy current main to Railway\n\n**Realistic demo scope:** Auth + Chat + Study Groups (if PRs merge today)`, confidence: 91 },
  'default': { response: `**DevPulse Analysis â€” Feb 20, 2026**\n\n**Health Score: 62/100** (declining from 85 two weeks ago)\n\n**Key Issues:**\n1. ðŸ”´ Ravi inactive for 7 days â€” Database module at risk\n2. ðŸ”´ 2 stale PRs blocking integration\n3. ðŸŸ¡ Route mismatch between frontend/backend\n4. ðŸŸ¡ Manit handling 60% of all commits â€” overloaded\n\n**Delivery Risk:** 38% | **Integration Risk:** 45% | **Stability Risk:** 28%\n\n**48-hour forecast:** If no PRs are merged, health drops to ~44. If PR #2 and #5 merge, health recovers to ~74.\n\nAsk me about specific risks, team members, or modules.`, confidence: 85 },
};

// CONTRIBUTION_STATS removed — now computed live by metrics.service.js

// ── Checkpoints / Task Allocation ─────────────────────────
// The repo lead allocates tasks to collaborators with deadlines
export let CHECKPOINTS = [
  { id: 'cp1', title: 'Complete user auth flow', description: 'Implement login, signup, JWT refresh, and session management', assignee: 'u1', assigneeName: 'Manit', priority: 'high', status: 'completed', deadline: '2026-02-12T18:00:00Z', createdAt: '2026-02-06T10:00:00Z', completedAt: '2026-02-12T09:00:00Z', createdBy: 'lead', progress: 100 },
  { id: 'cp2', title: 'Database schema & migration', description: 'Design and implement MongoDB schemas for users, groups, sessions', assignee: 'u2', assigneeName: 'Ravi', priority: 'critical', status: 'overdue', deadline: '2026-02-15T18:00:00Z', createdAt: '2026-02-06T10:00:00Z', completedAt: null, createdBy: 'lead', progress: 40 },
  { id: 'cp3', title: 'Dashboard UI components', description: 'Build all dashboard panels including sidebar, navbar, and card components', assignee: 'u3', assigneeName: 'Priya', priority: 'high', status: 'in-progress', deadline: '2026-02-20T18:00:00Z', createdAt: '2026-02-08T10:00:00Z', completedAt: null, createdBy: 'lead', progress: 65 },
  { id: 'cp4', title: 'CI/CD pipeline & deployment', description: 'Set up Docker, GitHub Actions, and Railway deployment', assignee: 'u4', assigneeName: 'Akshith', priority: 'medium', status: 'in-progress', deadline: '2026-02-19T18:00:00Z', createdAt: '2026-02-06T10:00:00Z', completedAt: null, createdBy: 'lead', progress: 70 },
  { id: 'cp5', title: 'Real-time chat integration', description: 'Implement Socket.IO based messaging system', assignee: 'u1', assigneeName: 'Manit', priority: 'medium', status: 'completed', deadline: '2026-02-11T18:00:00Z', createdAt: '2026-02-08T10:00:00Z', completedAt: '2026-02-10T14:00:00Z', createdBy: 'lead', progress: 100 },
  { id: 'cp6', title: 'Study group CRUD API', description: 'Build REST endpoints for creating, reading, updating, and deleting study groups', assignee: 'u2', assigneeName: 'Ravi', priority: 'high', status: 'overdue', deadline: '2026-02-14T18:00:00Z', createdAt: '2026-02-08T10:00:00Z', completedAt: null, createdBy: 'lead', progress: 25 },
];

// ── Snapshot of original demo data (taken once at import time) ──
const _DEFAULTS = {
  TEAM, COMMITS, BRANCHES, PULL_REQUESTS,
  ACTIVE_WORK,
  BLOCKERS, GHOSTING_ALERTS, INTEGRATION_RISKS,
  BUS_FACTOR, SIMULATION_SCENARIOS, COMMIT_HONESTY,
  AI_ADVISOR_RESPONSES, CHECKPOINTS,
};

/**
 * Replace live store values.
 * Because these are `export let`, importers see updated values via live bindings.
 */
export function updateStore(data) {
  if (data.TEAM) TEAM = data.TEAM;
  if (data.COMMITS) COMMITS = data.COMMITS;
  if (data.BRANCHES) BRANCHES = data.BRANCHES;
  if (data.PULL_REQUESTS) PULL_REQUESTS = data.PULL_REQUESTS;
  if (data.ACTIVE_WORK) ACTIVE_WORK = data.ACTIVE_WORK;
  if (data.BLOCKERS) BLOCKERS = data.BLOCKERS;
  if (data.GHOSTING_ALERTS) GHOSTING_ALERTS = data.GHOSTING_ALERTS;
  if (data.INTEGRATION_RISKS) INTEGRATION_RISKS = data.INTEGRATION_RISKS;
  if (data.BUS_FACTOR) BUS_FACTOR = data.BUS_FACTOR;
  if (data.SIMULATION_SCENARIOS) SIMULATION_SCENARIOS = data.SIMULATION_SCENARIOS;
  if (data.COMMIT_HONESTY) COMMIT_HONESTY = data.COMMIT_HONESTY;
  if (data.AI_ADVISOR_RESPONSES) AI_ADVISOR_RESPONSES = data.AI_ADVISOR_RESPONSES;
  if (data.CHECKPOINTS) CHECKPOINTS = data.CHECKPOINTS;
}

/** Restore all values to the original demo data */
export function restoreDefaults() {
  TEAM = _DEFAULTS.TEAM;
  COMMITS = _DEFAULTS.COMMITS;
  BRANCHES = _DEFAULTS.BRANCHES;
  PULL_REQUESTS = _DEFAULTS.PULL_REQUESTS;
  ACTIVE_WORK = _DEFAULTS.ACTIVE_WORK;
  BLOCKERS = _DEFAULTS.BLOCKERS;
  GHOSTING_ALERTS = _DEFAULTS.GHOSTING_ALERTS;
  INTEGRATION_RISKS = _DEFAULTS.INTEGRATION_RISKS;
  BUS_FACTOR = _DEFAULTS.BUS_FACTOR;
  SIMULATION_SCENARIOS = _DEFAULTS.SIMULATION_SCENARIOS;
  COMMIT_HONESTY = _DEFAULTS.COMMIT_HONESTY;
  AI_ADVISOR_RESPONSES = _DEFAULTS.AI_ADVISOR_RESPONSES;
  CHECKPOINTS = _DEFAULTS.CHECKPOINTS;
}
