// ────────────────────────────────────────────────────────
// DevPulse Analytics Engine
// Transforms raw GitHub API data into dashboard metrics
// ────────────────────────────────────────────────────────

import github from './github.service.js';
import { updateStore } from '../data/store.js';

/* ── Constants ───────────────────────────────────────── */
const COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
  '#84cc16', '#14b8a6', '#a855f7', '#f43f5e',
];

/* ── Utility helpers ─────────────────────────────────── */
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, Math.round(v)));
const daysBetween = (a, b) => Math.floor(Math.abs(new Date(a) - new Date(b)) / 864e5);
const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtAgo = days =>
  days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;

/* ── Module detection from file paths ────────────────── */
function detectModule(filepath) {
  const p = (filepath || '').toLowerCase().replace(/\\/g, '/');
  if (/auth|login|signup|jwt|token|session/i.test(p)) return 'auth';
  if (/docker|\.github|ci|cd|deploy|railway|vercel|netlify/i.test(p)) return 'devops';
  if (/models?\/|schema|migrat|db\.|database|prisma|mongoose/i.test(p)) return 'database';
  if (/socket|chat|messag|ws\b/i.test(p)) return 'messaging';
  if (/search/i.test(p)) return 'search';
  if (/notif/i.test(p)) return 'notifications';
  if (/test|spec|__test/i.test(p)) return 'testing';
  if (/^src\/|^client\/|^app\/|^pages\/|^components\//i.test(p)) return 'frontend';
  if (/^server\/|^api\/|^backend\/|^routes\/|^controllers\//i.test(p)) return 'backend';
  return 'setup';
}

/* ── Commit honesty analysis ─────────────────────────── */
const VAGUE = [
  /^fix(ed)?$/i, /^done$/i, /^wip$/i, /^update[ds]?$/i,
  /^change[ds]?$/i, /^stuff$/i, /^misc$/i, /^cleanup$/i, /^\.$/,
  /^initial commit$/i, /^first commit$/i, /^save$/i,
];

function analyzeHonesty(msg, files = []) {
  const trimmed = msg.trim();
  const isVague = VAGUE.some(r => r.test(trimmed)) || trimmed.length < 8;

  // Deterministic score: based on message length, word count, file coverage
  let matchScore;
  if (isVague) {
    // Shorter & vaguer = lower score
    const lenFactor = clamp(0, 15, trimmed.length); // 0-15 pts from message length
    const fileFactor = clamp(0, 10, files.length * 2); // 0-10 pts if files mentioned
    matchScore = clamp(5, 30, 5 + lenFactor + fileFactor);
  } else {
    // Score based on descriptiveness
    const words = trimmed.split(/\s+/).length;
    const wordFactor = clamp(0, 10, words - 3); // more words = better
    const fileMention = files.some(f => trimmed.toLowerCase().includes(f.split('/').pop()?.split('.')[0]?.toLowerCase() || '___')) ? 8 : 0;
    const hasScope = /^(feat|fix|chore|docs|style|refactor|test|ci)\b/i.test(trimmed) ? 5 : 0;
    matchScore = clamp(65, 98, 70 + wordFactor + fileMention + hasScope);
  }

  return {
    matchScore,
    verdict: isVague ? 'misleading' : 'honest',
    suggestion: isVague
      ? `Describe what changed in ${files.slice(0, 2).join(', ') || 'the modified files'}`
      : null,
  };
}

/* ── Role inference from per-module commit counts ────── */
function inferRole(moduleMap) {
  const sorted = Object.entries(moduleMap).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return 'Developer';
  const total = sorted.reduce((s, [, c]) => s + c, 0);
  if (sorted[0][1] / total < 0.4 && sorted.length >= 3) return 'Full Stack Developer';
  switch (sorted[0][0]) {
    case 'frontend': return 'Frontend Developer';
    case 'backend': return 'Backend Developer';
    case 'database': return 'Database Engineer';
    case 'devops': return 'DevOps Engineer';
    case 'auth': return 'Security Engineer';
    case 'testing': return 'QA Engineer';
    case 'messaging': return 'Realtime Developer';
    case 'notifications': return 'Backend Developer';
    default: return 'Developer';
  }
}

// ════════════════════════════════════════════════════════
//  MAIN SYNC FUNCTION
// ════════════════════════════════════════════════════════

export async function syncFromGitHub() {
  if (!github.isConfigured) throw new Error('GitHub not configured');
  github.syncing = true;

  try {
    // ── 1. Fetch in parallel ──────────────────────────
    console.log('⏳ Fetching data from GitHub…');
    const [repoInfo, rawCommits, branches, pulls, contributors] = await Promise.all([
      github.getRepo(),
      github.getAllCommits(3),
      github.getBranches(),
      github.getPulls('all'),
      github.getContributors(),
    ]);

    // ── 2. Commit detail for recent 30 ────────────────
    const recentShas = rawCommits.slice(0, 30).map(c => c.sha);
    console.log(`⏳ Fetching details for ${recentShas.length} recent commits…`);
    const details = await github.getCommitDetails(recentShas);
    const detailMap = new Map(details.map(d => [d.sha, d]));

    const defaultBranch = repoInfo.default_branch || 'main';
    const now = new Date();

    // ── 3. Members ────────────────────────────────────
    const loginToId = {};
    const members = (contributors || []).slice(0, 10).map((c, i) => {
      const id = `u${i + 1}`;
      loginToId[c.login.toLowerCase()] = id;
      return {
        id,
        name: c.login,
        avatar: c.login[0].toUpperCase(),
        role: 'Developer',                       // will be refined below
        color: COLORS[i % COLORS.length],
        _login: c.login,                          // internal, stripped later
      };
    });

    const resolveAuthor = (raw) => {
      const login = (raw.author?.login || raw.commit?.author?.name || '').toLowerCase();
      return loginToId[login] || members[0]?.id || 'u1';
    };

    // ── 4. Commits ────────────────────────────────────
    const commits = rawCommits.map((raw, i) => {
      const detail = detailMap.get(raw.sha);
      const files = detail?.files?.map(f => f.filename) || [];
      const msg = (raw.commit.message || '').split('\n')[0];
      const honesty = analyzeHonesty(msg, files);
      const module = files.length > 0 ? detectModule(files[0]) : 'setup';

      return {
        id: `c${i + 1}`,
        author: resolveAuthor(raw),
        message: msg,
        date: raw.commit.author.date,
        files,
        additions: detail?.stats?.additions || 0,
        deletions: detail?.stats?.deletions || 0,
        module,
        ...(honesty.verdict === 'misleading' && {
          flagged: true,
          honestySuggestion: honesty.suggestion,
        }),
      };
    });

    // ── 5. Refine member roles ────────────────────────
    const memberModules = {};
    commits.forEach(c => {
      if (!memberModules[c.author]) memberModules[c.author] = {};
      memberModules[c.author][c.module] = (memberModules[c.author][c.module] || 0) + 1;
    });
    members.forEach(m => { m.role = inferRole(memberModules[m.id] || {}); });

    // ── 6. Branches ───────────────────────────────────
    const shaDateMap = new Map(rawCommits.map(c => [c.sha, c.commit.author.date]));
    const shaAuthorMap = new Map(rawCommits.map(c => [c.sha, (c.author?.login || '').toLowerCase()]));
    const mergedBranches = new Set(pulls.filter(p => p.merged_at).map(p => p.head.ref));

    const transformedBranches = branches.map(b => {
      const commitDate = shaDateMap.get(b.commit.sha) || now.toISOString();
      const age = daysBetween(commitDate, now);
      const isMerged = mergedBranches.has(b.name);
      let status = 'active';
      if (isMerged) status = 'merged';
      else if (age > 14) status = 'abandoned';
      else if (age > 7) status = 'stale';

      return {
        name: b.name,
        lastCommit: commitDate,
        author: loginToId[shaAuthorMap.get(b.commit.sha)] || members[0]?.id || 'u1',
        status,
        ahead: 0,
        behind: 0,
        ...(age > 7 && !isMerged && { staleDays: age }),
      };
    });

    // ── 7. Pull requests ──────────────────────────────
    const transformedPRs = pulls.map((pr, i) => {
      const age = daysBetween(pr.created_at, now);
      const isOpen = pr.state === 'open' && !pr.merged_at;
      return {
        id: `pr${i + 1}`,
        title: pr.title,
        author: loginToId[pr.user?.login?.toLowerCase()] || members[0]?.id || 'u1',
        branch: pr.head.ref,
        status: pr.merged_at ? 'merged' : pr.state,
        createdAt: pr.created_at,
        mergedAt: pr.merged_at || null,
        reviewers: (pr.requested_reviewers || [])
          .map(r => loginToId[r.login?.toLowerCase()])
          .filter(Boolean),
        comments: (pr.comments || 0) + (pr.review_comments || 0),
        ...(isOpen && { ageDays: age }),
        ...(isOpen && age > 3 && (pr.comments || 0) === 0 && { stagnant: true }),
      };
    });

    // ── 8. Active work ────────────────────────────────
    const activeWork = members.map(m => {
      const mc = commits.filter(c => c.author === m.id);
      const latest = mc[0];
      const daysSince = latest ? daysBetween(latest.date, now) : 999;
      let status = 'active';
      if (daysSince > 5) status = 'inactive';
      else if (daysSince > 2) status = 'idle';

      const memberBranch = transformedBranches.find(b => b.author === m.id && b.status === 'active');
      return {
        memberId: m.id,
        name: m.name,
        status,
        currentTask: latest?.message || 'No recent activity',
        module: latest?.module || 'unknown',
        lastCommit: fmtAgo(daysSince),
        branch: memberBranch?.name || defaultBranch,
        ...(status === 'inactive' && { warning: `No activity in ${daysSince} days` }),
      };
    });

    // ── 9. Blockers ───────────────────────────────────
    const blockers = [];
    let bIdx = 1;

    transformedPRs.filter(p => p.stagnant).forEach(pr => {
      blockers.push({
        id: `b${bIdx++}`,
        severity: (pr.ageDays || 0) > 7 ? 'critical' : 'high',
        type: 'stale_pr',
        title: `PR "${pr.title}" open for ${pr.ageDays} days with no review`,
        description: `This PR has ${pr.comments} comments and needs attention.`,
        affectedModules: [commits.find(c => c.author === pr.author)?.module || 'unknown'].map(cap),
        owner: pr.author,
        detectedAt: now.toISOString(),
      });
    });

    activeWork.filter(w => w.status === 'inactive').forEach(w => {
      blockers.push({
        id: `b${bIdx++}`,
        severity: 'critical',
        type: 'inactive_member',
        title: `${w.name} has no commits in ${w.lastCommit}`,
        description: `Team may need to redistribute ${w.name}'s work.`,
        affectedModules: Object.keys(memberModules[w.memberId] || {}).map(cap),
        owner: w.memberId,
        detectedAt: now.toISOString(),
      });
    });

    transformedBranches.filter(b => b.status === 'abandoned').forEach(b => {
      blockers.push({
        id: `b${bIdx++}`,
        severity: 'medium',
        type: 'abandoned_branch',
        title: `Branch "${b.name}" abandoned for ${b.staleDays} days`,
        description: 'Consider merging or deleting this branch.',
        affectedModules: [],
        owner: b.author,
        detectedAt: now.toISOString(),
      });
    });

    transformedPRs
      .filter(p => p.status === 'open' && p.reviewers.length === 0 && !p.stagnant)
      .forEach(pr => {
        blockers.push({
          id: `b${bIdx++}`,
          severity: 'low',
          type: 'unreviewed_pr',
          title: `PR "${pr.title}" has no reviewer assigned`,
          description: `Open for ${pr.ageDays || '?'} days, assign a reviewer.`,
          affectedModules: [],
          owner: pr.author,
          detectedAt: now.toISOString(),
        });
      });

    // ── 10. Ghosting alerts ───────────────────────────
    const ghostingAlerts = activeWork
      .filter(w => w.status === 'inactive')
      .map(w => {
        const lastDate = commits.find(c => c.author === w.memberId)?.date || now.toISOString();
        const dsc = daysBetween(lastDate, now);
        return {
          memberId: w.memberId,
          name: w.name,
          lastCommit: lastDate,
          lastMessage: null,
          type: 'inactive',
          alert: `${w.name} has been inactive for ${dsc} days.`,
          daysSinceCommit: dsc,
        };
      });

    // ── 11. Module-level analytics ────────────────────
    const moduleSet = new Set(commits.map(c => c.module));
    const modules = [...moduleSet].filter(m => m !== 'setup' && m !== 'other');

    const moduleOwnership = {};
    commits.forEach(c => {
      if (!moduleOwnership[c.module]) moduleOwnership[c.module] = {};
      moduleOwnership[c.module][c.author] = (moduleOwnership[c.module][c.author] || 0) + 1;
    });

    // Integration Risks
    const integrationRisks = modules.map(mod => {
      const owners = moduleOwnership[mod] || {};
      const numC = Object.keys(owners).length;
      let risk = clamp(5, 95, 100 - (numC / Math.max(members.length, 1)) * 50 - (numC > 1 ? 20 : 0));

      let status = 'integrated';
      if (risk > 70) status = 'isolated';
      else if (risk > 50) status = 'at-risk';
      else if (risk > 20) status = 'partial';

      // Dependencies: modules that change in the same commits
      const deps = new Set();
      commits.filter(c => c.module === mod).forEach(c => {
        c.files.forEach(f => {
          const fm = detectModule(f);
          if (fm !== mod && fm !== 'setup' && fm !== 'other') deps.add(cap(fm));
        });
      });

      return { module: cap(mod), risk, status, dependencies: [...deps].slice(0, 4) };
    });

    // Bus Factor
    const busFactor = {
      modules: modules.map(cap),
      contributors: members.map(m => m.name),
      data: modules.map(mod => {
        const owners = moduleOwnership[mod] || {};
        const total = Object.values(owners).reduce((a, b) => a + b, 0) || 1;
        return members.map(m => Math.round(((owners[m.id] || 0) / total) * 100));
      }),
    };

    // ── 12. Contribution stats ────────────────────────
    const totalCommits = commits.length || 1;
    const contributionStats = members.map(m => {
      const mc = commits.filter(c => c.author === m.id);
      return {
        name: m.name,
        commits: mc.length,
        additions: mc.reduce((s, c) => s + c.additions, 0),
        deletions: mc.reduce((s, c) => s + c.deletions, 0),
        percentage: Math.round((mc.length / totalCommits) * 100),
      };
    });

    // ── 13-14. Health score & velocity are now computed LIVE
    // by server/services/metrics.service.js on every request.
    // No need to pre-compute or store them here.

    // ── 15. Commit honesty ────────────────────────────
    const commitHonesty = commits
      .filter(c => c.flagged)
      .map(c => {
        const h = analyzeHonesty(c.message, c.files);
        return {
          commitId: c.id,
          message: c.message,
          actualChanges: c.files.length > 0
            ? `Modified ${c.files.length} file(s): ${c.files.slice(0, 3).join(', ')}${c.files.length > 3 ? '…' : ''}`
            : 'File details not available for older commits',
          matchScore: h.matchScore,
          suggestion: h.suggestion,
          verdict: h.verdict,
        };
      });

    // ── 16. Simulation scenarios (proportional) ──────
    const scenarios = [];
    let sIdx = 1;
    const stalePRCount = transformedPRs.filter(p => p.stagnant).length;
    const inactiveWCount = activeWork.filter(w => w.status === 'inactive').length;
    const totalMembers = Math.max(members.length, 1);

    transformedPRs.filter(p => p.stagnant).slice(0, 2).forEach(pr => {
      const agePenalty = clamp(5, 25, (pr.ageDays || 3) * 2);
      scenarios.push({
        id: `sim${sIdx++}`,
        name: `"${pr.title}" delayed 48h`,
        description: `What if this stale PR stays open 2 more days?`,
        prId: pr.id,
        delayHours: 48,
        impact: {
          healthDrop: -agePenalty,
          newBlockers: 1,
          affectedModules: integrationRisks.filter(r => r.risk > 40).slice(0, 2).map(r => r.module),
          riskChange: { deliveryRisk: +clamp(5, 30, agePenalty), integrationRisk: +clamp(3, 15, Math.round(agePenalty / 2)) },
        },
      });
    });

    activeWork.filter(w => w.status === 'inactive').slice(0, 2).forEach(w => {
      const memberModCount = Object.keys(memberModules[w.memberId] || {}).length;
      const ownershipPenalty = clamp(5, 20, memberModCount * 5);
      scenarios.push({
        id: `sim${sIdx++}`,
        name: `${w.name} stays inactive`,
        description: `What if ${w.name} contributes nothing for 2 more days?`,
        memberId: w.memberId,
        delayHours: 48,
        impact: {
          healthDrop: -ownershipPenalty,
          newBlockers: memberModCount > 0 ? 1 : 0,
          affectedModules: Object.keys(memberModules[w.memberId] || {}).map(cap),
          riskChange: { deliveryRisk: +clamp(5, 25, ownershipPenalty), integrationRisk: +clamp(3, 20, memberModCount * 4) },
        },
      });
    });

    // Positive scenario
    const oldestOpen = transformedPRs
      .filter(p => p.status === 'open')
      .sort((a, b) => (b.ageDays || 0) - (a.ageDays || 0))[0];
    if (oldestOpen) {
      const mergeBoost = clamp(3, 15, (oldestOpen.ageDays || 1) * 2);
      scenarios.push({
        id: `sim${sIdx++}`,
        name: `Merge "${oldestOpen.title}"`,
        description: 'What if this PR is merged today?',
        prId: oldestOpen.id,
        delayHours: 0,
        impact: {
          healthDrop: +mergeBoost,
          newBlockers: -1,
          affectedModules: [],
          riskChange: { deliveryRisk: -clamp(5, 20, mergeBoost), integrationRisk: -clamp(2, 10, Math.round(mergeBoost / 2)) },
        },
      });
    }

    if (scenarios.length === 0) {
      const openCount = transformedPRs.filter(p => p.status === 'open').length;
      scenarios.push({
        id: 'sim1',
        name: 'All PRs merged today',
        description: 'What if every open PR is merged right now?',
        delayHours: 0,
        impact: { healthDrop: +clamp(5, 25, openCount * 5), newBlockers: -openCount, affectedModules: [], riskChange: { deliveryRisk: -clamp(5, 30, openCount * 8), integrationRisk: -clamp(3, 20, openCount * 4) } },
      });
    }

    // ── 17. AI Advisor ────────────────────────────────
    // Import live metrics for AI advisor responses
    const { computeHealthScore: liveHealth, computeDeliveryRisk, computeIntegrationRisk, computeStabilityRisk } = await import('./metrics.service.js');
    const liveScore = liveHealth();
    const hScore = liveScore.overall;
    const deliveryRisk = liveScore.breakdown.deliveryRisk;
    const integrationRisk = liveScore.breakdown.integrationRisk;
    const stabilityRisk = liveScore.breakdown.stabilityRisk;

    const inactiveNames = activeWork.filter(w => w.status === 'inactive').map(w => w.name);
    const critBF = busFactor.modules.filter((_, i) => Math.max(...busFactor.data[i]) >= 85);
    const topBlocker = blockers[0];

    const aiAdvisorResponses = {
      'biggest risk': {
        response: topBlocker
          ? `**Critical Risk: ${topBlocker.title}**\n\n${topBlocker.description}\n\n**Severity:** ${topBlocker.severity}\n**Affected:** ${topBlocker.affectedModules.join(', ')}\n\n**Action:** Address this immediately.`
          : '**No critical risks detected.** Keep up the momentum!',
        confidence: topBlocker ? 92 : 80,
      },
      'who needs help': {
        response: inactiveNames.length > 0
          ? `**Members needing attention:**\n\n${inactiveNames.map(n => `- **${n}** — inactive, reach out or redistribute work`).join('\n')}\n\n**Bus factor concerns:** ${critBF.length ? critBF.join(', ') + ' have single-person dependency' : 'None critical.'}`
          : '**All members are active!** No intervention needed.',
        confidence: 88,
      },
      'demo readiness': {
        response: `**Health: ${hScore}/100**\n\n✅ **Active:** ${activeWork.filter(w => w.status === 'active').map(w => w.name).join(', ') || 'None'}\n⚠️ **Idle:** ${activeWork.filter(w => w.status === 'idle').map(w => w.name).join(', ') || 'None'}\n❌ **Inactive:** ${inactiveNames.join(', ') || 'None'}\n\n**Open PRs:** ${transformedPRs.filter(p => p.status === 'open').length} | **Stale:** ${transformedPRs.filter(p => p.stagnant).length}\n\n${hScore >= 70 ? 'Project is on track.' : 'Project needs attention.'}`,
        confidence: 90,
      },
      default: {
        response: `**DevPulse — ${fmtDate(now)}**\n\n**Health: ${hScore}/100** | Team: ${members.length} members, ${activeWork.filter(w => w.status === 'active').length} active\n**Commits:** ${commits.length} | **Open PRs:** ${transformedPRs.filter(p => p.status === 'open').length} | **Blockers:** ${blockers.length}\n\n**Risk:** Delivery ${deliveryRisk}% · Integration ${integrationRisk}% · Stability ${stabilityRisk}%\n\nAsk about specific risks, members, or modules.`,
        confidence: 85,
      },
    };

    // ── 18. Write to store ────────────────────────────
    const cleanMembers = members.map(({ _login, ...rest }) => rest);

    // Health score, velocity, and contribution stats are now computed
    // LIVE by metrics.service.js — not stored as stale snapshots.
    updateStore({
      TEAM: {
        name: repoInfo.name,
        repo: repoInfo.full_name,
        description: repoInfo.description || 'No description provided',
        createdAt: repoInfo.created_at,
        deadline: new Date(now.getTime() + 48 * 3600000).toISOString(),
        members: cleanMembers,
      },
      COMMITS: commits,
      BRANCHES: transformedBranches,
      PULL_REQUESTS: transformedPRs,
      ACTIVE_WORK: activeWork,
      BLOCKERS: blockers,
      GHOSTING_ALERTS: ghostingAlerts,
      INTEGRATION_RISKS: integrationRisks,
      BUS_FACTOR: busFactor,
      SIMULATION_SCENARIOS: scenarios,
      COMMIT_HONESTY: commitHonesty,
      AI_ADVISOR_RESPONSES: aiAdvisorResponses,
    });

    github.syncedAt = now.toISOString();
    const summary = { commits: commits.length, members: members.length, prs: transformedPRs.length, branches: transformedBranches.length, blockers: blockers.length };
    console.log('✅ GitHub sync complete:', summary);
    return summary;

  } finally {
    github.syncing = false;
  }
}
