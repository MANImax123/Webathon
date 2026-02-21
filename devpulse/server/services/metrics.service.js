// ────────────────────────────────────────────────────────
// DevPulse — Live Metrics Computation Service
// ALL metrics are derived from current store data.
// ZERO hardcoded values. ZERO synthetic data.
// ────────────────────────────────────────────────────────

import * as store from '../data/store.js';

const clamp = (lo, hi, v) => Math.max(lo, Math.min(hi, Math.round(v)));
const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const daysBetween = (a, b) =>
    Math.abs(new Date(a) - new Date(b)) / 864e5; // fractional days

/* ══════════════════════════════════════════════════════
 *  DELIVERY RISK (0–100)
 *  Inputs: stagnant PRs, inactive contributors, unreviewed PRs
 * ══════════════════════════════════════════════════════ */
export function computeDeliveryRisk() {
    const now = new Date();
    const prs = store.PULL_REQUESTS || [];
    const commits = store.COMMITS || [];
    const members = store.TEAM?.members || [];

    // Stagnant PRs: open PRs with no comments and age > 3 days
    const openPRs = prs.filter((p) => p.status === 'open' && !p.mergedAt);
    const stagnantPRs = openPRs.filter((p) => {
        const age = daysBetween(p.createdAt, now);
        return age > 3 && (p.comments || 0) === 0;
    });

    // Inactive contributors: no commit in last 5 days
    const inactiveCount = members.filter((m) => {
        const memberCommits = commits.filter((c) => c.author === m.id);
        if (memberCommits.length === 0) return true;
        const latest = memberCommits.reduce((a, b) =>
            new Date(a.date) > new Date(b.date) ? a : b
        );
        return daysBetween(latest.date, now) > 5;
    }).length;

    // PRs with no reviewers assigned
    const unreviewedPRs = openPRs.filter(
        (p) => (p.reviewers || []).length === 0
    ).length;

    const score = clamp(
        0,
        100,
        stagnantPRs.length * 15 + inactiveCount * 18 + unreviewedPRs * 8
    );

    return {
        score,
        factors: {
            stagnantPRs: stagnantPRs.length,
            inactiveContributors: inactiveCount,
            unreviewedPRs,
        },
    };
}

/* ══════════════════════════════════════════════════════
 *  INTEGRATION RISK (0–100)
 *  Inputs: branch divergence, single-owner modules, cross-module overlap
 * ══════════════════════════════════════════════════════ */
export function computeIntegrationRisk() {
    const branches = store.BRANCHES || [];
    const commits = store.COMMITS || [];
    const members = store.TEAM?.members || [];

    // Branches behind main (non-merged, with behind > 0 or stale/abandoned)
    const divergedBranches = branches.filter(
        (b) =>
            b.name !== 'main' &&
            b.status !== 'merged' &&
            ((b.behind || 0) > 5 || b.status === 'abandoned' || b.status === 'stale')
    ).length;

    // Single-owner modules: modules where one person did > 80% of commits
    const moduleOwnership = {};
    commits.forEach((c) => {
        if (!c.module || c.module === 'setup' || c.module === 'other') return;
        if (!moduleOwnership[c.module]) moduleOwnership[c.module] = {};
        moduleOwnership[c.module][c.author] =
            (moduleOwnership[c.module][c.author] || 0) + 1;
    });

    let singleOwnerModules = 0;
    const moduleNames = Object.keys(moduleOwnership);
    moduleNames.forEach((mod) => {
        const owners = moduleOwnership[mod];
        const total = Object.values(owners).reduce((a, b) => a + b, 0);
        const max = Math.max(...Object.values(owners));
        if (total > 0 && max / total > 0.8) singleOwnerModules++;
    });

    // Cross-module file overlap: commits touching files in multiple modules
    let crossModuleCommits = 0;
    commits.forEach((c) => {
        if ((c.files || []).length <= 1) return;
        const modules = new Set();
        (c.files || []).forEach((f) => {
            const mod = detectModuleFromPath(f);
            if (mod !== 'setup' && mod !== 'other') modules.add(mod);
        });
        if (modules.size > 1) crossModuleCommits++;
    });

    const totalModules = Math.max(moduleNames.length, 1);
    const score = clamp(
        0,
        100,
        divergedBranches * 12 +
        (singleOwnerModules / totalModules) * 40 +
        Math.min(crossModuleCommits * 3, 20)
    );

    return {
        score,
        factors: {
            divergedBranches,
            singleOwnerModules,
            totalModules: moduleNames.length,
            crossModuleCommits,
        },
    };
}

/* ══════════════════════════════════════════════════════
 *  STABILITY RISK (0–100)
 *  Inputs: large commits, revert commits, vague messages, near-deadline commits
 * ══════════════════════════════════════════════════════ */
export function computeStabilityRisk() {
    const commits = store.COMMITS || [];
    const deadline = store.TEAM?.deadline;
    const total = Math.max(commits.length, 1);

    // Large commits (touching > 5 files)
    const largeCommits = commits.filter(
        (c) => (c.files || []).length > 5
    ).length;

    // Revert commits
    const revertCommits = commits.filter((c) =>
        /^revert/i.test(c.message)
    ).length;

    // Vague / misleading commits
    const vagueCommits = commits.filter((c) => c.flagged).length;

    // Commits close to deadline (within 24h before deadline)
    let nearDeadlineCommits = 0;
    if (deadline) {
        const deadlineDate = new Date(deadline);
        nearDeadlineCommits = commits.filter((c) => {
            const diff = deadlineDate - new Date(c.date);
            return diff > 0 && diff < 24 * 60 * 60 * 1000; // within 24h before deadline
        }).length;
    }

    const score = clamp(
        0,
        100,
        (vagueCommits / total) * 50 +
        (largeCommits / total) * 25 +
        revertCommits * 10 +
        nearDeadlineCommits * 5
    );

    return {
        score,
        factors: {
            largeCommits,
            revertCommits,
            vagueCommits,
            nearDeadlineCommits,
            totalCommits: commits.length,
        },
    };
}

/* ══════════════════════════════════════════════════════
 *  OVERALL HEALTH SCORE (0–100)
 *  Weighted composite of the three risk dimensions.
 *  Higher score = healthier project.
 * ══════════════════════════════════════════════════════ */
export function computeHealthScore() {
    const delivery = computeDeliveryRisk();
    const integration = computeIntegrationRisk();
    const stability = computeStabilityRisk();

    const overall = clamp(
        0,
        100,
        100 -
        (delivery.score * 0.45 +
            integration.score * 0.30 +
            stability.score * 0.25)
    );

    return {
        overall,
        breakdown: {
            deliveryRisk: delivery.score,
            integrationRisk: integration.score,
            stabilityRisk: stability.score,
        },
        factors: {
            delivery: delivery.factors,
            integration: integration.factors,
            stability: stability.factors,
        },
    };
}

/* ══════════════════════════════════════════════════════
 *  HEALTH SCORE TREND
 *  Groups commits by date, for each day recalculates
 *  the health score using only data available up to that day.
 *  Never generates dates before the first commit.
 * ══════════════════════════════════════════════════════ */
export function computeHealthTrend() {
    const commits = store.COMMITS || [];
    const prs = store.PULL_REQUESTS || [];
    const branches = store.BRANCHES || [];
    const members = store.TEAM?.members || [];
    const deadline = store.TEAM?.deadline;

    if (commits.length === 0) {
        return {
            trend: [],
            message: 'No commits found. Insufficient historical data.',
        };
    }

    // Find date range: first commit date → today
    const sortedDates = commits
        .map((c) => new Date(c.date))
        .sort((a, b) => a - b);
    const firstDate = new Date(sortedDates[0]);
    firstDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const trend = [];
    const dayMs = 24 * 60 * 60 * 1000;

    for (
        let d = new Date(firstDate);
        d <= today;
        d = new Date(d.getTime() + dayMs)
    ) {
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);

        // Commits up to this day
        const cumCommits = commits.filter((c) => new Date(c.date) <= endOfDay);
        // PRs that existed by this day
        const cumPRs = prs.filter((p) => new Date(p.createdAt) <= endOfDay);
        const cumOpenPRs = cumPRs.filter((p) => {
            if (p.mergedAt && new Date(p.mergedAt) <= endOfDay) return false;
            return p.status === 'open' || !p.mergedAt;
        });

        // Stagnant PRs as of this day
        const stagnantCount = cumOpenPRs.filter((p) => {
            const age = daysBetween(p.createdAt, endOfDay);
            return age > 3 && (p.comments || 0) === 0;
        }).length;

        // Inactive members as of this day
        const inactiveCount = members.filter((m) => {
            const mc = cumCommits.filter((c) => c.author === m.id);
            if (mc.length === 0) return daysBetween(firstDate, endOfDay) > 2; // only flag after 2 days
            const latest = mc.reduce((a, b) =>
                new Date(a.date) > new Date(b.date) ? a : b
            );
            return daysBetween(latest.date, endOfDay) > 5;
        }).length;

        // Unreviewed PRs as of this day
        const unreviewedCount = cumOpenPRs.filter(
            (p) => (p.reviewers || []).length === 0
        ).length;

        // Vague commits ratio
        const vagueCount = cumCommits.filter((c) => c.flagged).length;
        const totalCum = Math.max(cumCommits.length, 1);

        // Diverged branches as of this day
        const divergedCount = branches.filter((b) => {
            if (b.name === 'main' || b.status === 'merged') return false;
            // Only count if branch existed by this day
            if (new Date(b.lastCommit) > endOfDay) return false;
            return (b.behind || 0) > 5 || b.status === 'abandoned' || b.status === 'stale';
        }).length;

        // Module ownership as of this day
        const modOwn = {};
        cumCommits.forEach((c) => {
            if (!c.module || c.module === 'setup' || c.module === 'other') return;
            if (!modOwn[c.module]) modOwn[c.module] = {};
            modOwn[c.module][c.author] = (modOwn[c.module][c.author] || 0) + 1;
        });
        let singleOwner = 0;
        const modKeys = Object.keys(modOwn);
        modKeys.forEach((mod) => {
            const total = Object.values(modOwn[mod]).reduce((a, b) => a + b, 0);
            const max = Math.max(...Object.values(modOwn[mod]));
            if (total > 0 && max / total > 0.8) singleOwner++;
        });

        // Compute day-level risks
        const delivery = clamp(0, 100,
            stagnantCount * 15 + inactiveCount * 18 + unreviewedCount * 8
        );
        const integration = clamp(0, 100,
            divergedCount * 12 +
            (modKeys.length > 0 ? (singleOwner / modKeys.length) * 40 : 0)
        );
        const stability = clamp(0, 100,
            (vagueCount / totalCum) * 50
        );

        const dayScore = clamp(
            0,
            100,
            100 - (delivery * 0.45 + integration * 0.30 + stability * 0.25)
        );

        trend.push({
            date: fmtDate(d),
            score: dayScore,
        });
    }

    // If only one data point, note it
    if (trend.length === 1) {
        return {
            trend,
            message: 'Only one day of data available.',
        };
    }

    return { trend };
}

/* ══════════════════════════════════════════════════════
 *  COMMIT VELOCITY
 *  Groups commits by contributor by date.
 *  Actual commit counts — no synthetic spikes.
 * ══════════════════════════════════════════════════════ */
export function computeVelocity() {
    const commits = store.COMMITS || [];
    const members = store.TEAM?.members || [];

    if (commits.length === 0) {
        return [];
    }

    // Date range: first commit → today
    const sortedDates = commits
        .map((c) => new Date(c.date))
        .sort((a, b) => a - b);
    const firstDate = new Date(sortedDates[0]);
    firstDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build map: dateKey → { memberName: count }
    const velocityMap = {};
    commits.forEach((c) => {
        const key = fmtDate(c.date);
        if (!velocityMap[key]) velocityMap[key] = {};
        const name =
            members.find((m) => m.id === c.author)?.name || c.author;
        velocityMap[key][name] = (velocityMap[key][name] || 0) + 1;
    });

    const velocity = [];
    const dayMs = 24 * 60 * 60 * 1000;
    for (
        let d = new Date(firstDate);
        d <= today;
        d = new Date(d.getTime() + dayMs)
    ) {
        const key = fmtDate(d);
        const entry = { date: key };
        members.forEach((m) => {
            entry[m.name] = velocityMap[key]?.[m.name] || 0;
        });
        velocity.push(entry);
    }

    return velocity;
}

/* ══════════════════════════════════════════════════════
 *  CONTRIBUTION STATS
 *  Computed from actual commits. No hardcoded percentages.
 * ══════════════════════════════════════════════════════ */
export function computeContributions() {
    const commits = store.COMMITS || [];
    const members = store.TEAM?.members || [];
    const totalCommits = Math.max(commits.length, 1);

    return members.map((m) => {
        const mc = commits.filter((c) => c.author === m.id);
        return {
            name: m.name,
            commits: mc.length,
            additions: mc.reduce((s, c) => s + (c.additions || 0), 0),
            deletions: mc.reduce((s, c) => s + (c.deletions || 0), 0),
            percentage: Math.round((mc.length / totalCommits) * 100),
        };
    });
}

/* ══════════════════════════════════════════════════════
 *  SUMMARY BADGES (replaces hardcoded "5 Blockers" etc.)
 * ══════════════════════════════════════════════════════ */
export function computeSummaryBadges() {
    const now = new Date();
    const blockers = store.BLOCKERS || [];
    const prs = store.PULL_REQUESTS || [];
    const deadline = store.TEAM?.deadline;

    const blockerCount = blockers.length;

    const stalePRs = prs.filter((p) => {
        if (p.status !== 'open' || p.mergedAt) return false;
        return p.stagnant || (daysBetween(p.createdAt, now) > 5 && (p.comments || 0) === 0);
    }).length;

    let deadlineBadge = null;
    if (deadline) {
        const diff = new Date(deadline) - now;
        if (diff > 0) {
            const daysLeft = Math.ceil(diff / 864e5);
            const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
            deadlineBadge =
                daysLeft <= 1
                    ? `${hoursLeft}h left`
                    : `${daysLeft}d left`;
        } else {
            deadlineBadge = 'Overdue';
        }
    }

    return {
        blockerCount,
        stalePRs,
        deadlineBadge,
    };
}

/* ══════════════════════════════════════════════════════
 *  FULL HEALTH RADAR PAYLOAD
 *  Everything the HealthRadar component needs, all computed live.
 * ══════════════════════════════════════════════════════ */
export function computeFullHealthRadar() {
    const healthScore = computeHealthScore();
    const { trend, message } = computeHealthTrend();
    const velocity = computeVelocity();
    const contributions = computeContributions();
    const badges = computeSummaryBadges();

    return {
        healthScore: {
            ...healthScore,
            trend,
            trendMessage: message || null,
        },
        velocity,
        contributions,
        badges,
    };
}

/* ── Module detection helper ─────────────────────────── */
function detectModuleFromPath(filepath) {
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
