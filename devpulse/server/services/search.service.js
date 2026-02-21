// ─────────────────────────────────────────────────────────
// Semantic Search Service for DevPulse
// AI-powered semantic search across ALL workspace data
// ─────────────────────────────────────────────────────────

import github from './github.service.js';
import {
    TEAM, COMMITS, CHECKPOINTS, BRANCHES,
    PULL_REQUESTS, ACTIVE_WORK, BLOCKERS,
    GHOSTING_ALERTS, INTEGRATION_RISKS
} from '../data/store.js';

/* ── Relevance scoring ────────────────────────────────── */

function calculateRelevance(text, query, keywords = []) {
    if (!text || !query) return 0;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
    let score = 0;

    // Exact phrase match
    if (textLower.includes(queryLower)) score += 1.0;

    // Individual word matches
    queryWords.forEach(w => { if (textLower.includes(w)) score += 0.3; });

    // Keyword matching
    if (keywords.length) {
        queryWords.forEach(qw => {
            keywords.forEach(kw => {
                if (kw && (kw.toLowerCase().includes(qw) || qw.includes(kw.toLowerCase()))) score += 0.4;
            });
        });
    }

    return Math.min(score, 1.0);
}

/* ── Query intent analyzer ────────────────────────────── */

function analyzeQueryIntent(query, allResults) {
    const q = query.toLowerCase();
    const answers = [];

    const queryPatterns = [
        {
            patterns: [/who.*contributors?/i, /list.*contributors/i, /team.*members?/i, /who.*team/i],
            handler: () => {
                const members = allResults.filter(r => r.type === 'member');
                const names = members.map(m => m.title).join(', ');
                return { type: 'answer', title: `Team members: ${names}`, description: `The team has ${members.length} members: ${names}.`, relevanceScore: 2.0, metadata: { answerType: 'list', relatedResults: members } };
            }
        },
        {
            patterns: [/latest.*commit/i, /recent.*commit/i, /last commit/i],
            handler: () => {
                const commits = allResults.filter(r => r.type === 'commit').sort((a, b) => new Date(b.metadata?.date) - new Date(a.metadata?.date));
                const latest = commits[0];
                if (latest) return { type: 'answer', title: `Latest commit: ${latest.title}`, description: `"${latest.title}" by ${latest.metadata?.author} on ${new Date(latest.metadata?.date).toLocaleDateString()}.`, relevanceScore: 2.0, metadata: { answerType: 'latest', relatedResults: commits.slice(0, 3) } };
                return null;
            }
        },
        {
            patterns: [/how many.*pull requests?/i, /count.*pr/i, /open.*pull requests?/i, /pull requests/i],
            handler: () => {
                const openPRs = allResults.filter(r => r.type === 'pull_request' && r.metadata?.status === 'open');
                const total = allResults.filter(r => r.type === 'pull_request');
                return { type: 'answer', title: `${openPRs.length} open pull requests out of ${total.length} total`, description: `There are ${openPRs.length} open PRs and ${total.length} total.`, relevanceScore: 2.0, metadata: { answerType: 'count', relatedResults: openPRs.slice(0, 5) } };
            }
        },
        {
            patterns: [/repo.*overview/i, /project.*summary/i, /repo.*stats/i],
            handler: () => {
                const prs = allResults.filter(r => r.type === 'pull_request');
                const commits = allResults.filter(r => r.type === 'commit');
                const members = allResults.filter(r => r.type === 'member');
                const blockers = allResults.filter(r => r.type === 'blocker');
                const files = allResults.filter(r => r.type === 'file');
                return { type: 'answer', title: `Project Overview: ${TEAM?.name || 'DevPulse'}`, description: `${members.length} members, ${commits.length} commits, ${prs.length} pull requests, ${blockers.length} blockers, ${files.length} tracked files.`, relevanceScore: 2.0, metadata: { answerType: 'overview' } };
            }
        },
        {
            patterns: [/recent.*activity/i, /what.*happening/i, /latest.*changes/i],
            handler: () => {
                const recent = allResults.filter(r => r.metadata?.date || r.metadata?.createdAt).sort((a, b) => new Date(b.metadata?.date || b.metadata?.createdAt) - new Date(a.metadata?.date || a.metadata?.createdAt)).slice(0, 5);
                if (recent.length) {
                    const summary = recent.map(r => `${r.type.toUpperCase()}: ${r.title}`).join('; ');
                    return { type: 'answer', title: 'Recent Activity Summary', description: summary, relevanceScore: 2.0, metadata: { answerType: 'activity', relatedResults: recent } };
                }
                return null;
            }
        },
        {
            patterns: [/checkpoint/i, /task.*deadline/i, /upcoming.*deadline/i],
            handler: () => {
                const cps = allResults.filter(r => r.type === 'checkpoint');
                const overdue = cps.filter(r => r.metadata?.isOverdue);
                return { type: 'answer', title: `${cps.length} checkpoints (${overdue.length} overdue)`, description: `There are ${cps.length} checkpoints. ${overdue.length} are overdue.`, relevanceScore: 2.0, metadata: { answerType: 'count', relatedResults: cps.slice(0, 5) } };
            }
        },
        {
            patterns: [/blocker/i, /blocked/i, /what.*blocking/i],
            handler: () => {
                const blockers = allResults.filter(r => r.type === 'blocker');
                const critical = blockers.filter(r => r.metadata?.severity === 'critical');
                return { type: 'answer', title: `${blockers.length} blockers detected (${critical.length} critical)`, description: `There are ${blockers.length} blockers — ${critical.length} critical, ${blockers.length - critical.length} non-critical.`, relevanceScore: 2.0, metadata: { answerType: 'count', relatedResults: blockers.slice(0, 5) } };
            }
        },
        {
            patterns: [/risk/i, /integration.*risk/i, /which.*module.*risk/i],
            handler: () => {
                const risks = allResults.filter(r => r.type === 'integration_risk').sort((a, b) => (b.metadata?.risk || 0) - (a.metadata?.risk || 0));
                const atRisk = risks.filter(r => r.metadata?.risk > 50);
                return { type: 'answer', title: `${atRisk.length} modules at high risk`, description: `High risk: ${atRisk.map(r => r.title.replace('Module: ', '') + ' (' + r.metadata?.risk + '%)').join(', ') || 'None'}`, relevanceScore: 2.0, metadata: { answerType: 'list', relatedResults: risks.slice(0, 5) } };
            }
        },
        {
            patterns: [/ghost/i, /inactive/i, /who.*not.*coding/i],
            handler: () => {
                const ghosts = allResults.filter(r => r.type === 'ghosting_alert');
                return { type: 'answer', title: `${ghosts.length} ghosting alert${ghosts.length !== 1 ? 's' : ''}`, description: ghosts.map(g => g.description).join('; ') || 'No ghosting alerts.', relevanceScore: 2.0, metadata: { answerType: 'list', relatedResults: ghosts } };
            }
        },
    ];

    queryPatterns.forEach(({ patterns, handler }) => {
        if (patterns.some(p => p.test(q))) {
            const a = handler();
            if (a) answers.push(a);
        }
    });

    return answers;
}

/* ── Data gatherers ───────────────────────────────────── */

async function getGitHubResults() {
    if (!github.isConfigured || !github.token) return [];
    const results = [];
    try {
        const headers = { Authorization: `token ${github.token}`, Accept: 'application/vnd.github.v3+json' };
        const base = 'https://api.github.com';

        const repoRes = await fetch(`${base}/repos/${github.owner}/${github.repo}`, { headers });
        if (repoRes.ok) {
            const r = await repoRes.json();
            results.push({ type: 'github_repo', title: r.full_name, description: r.description || 'GitHub repository', url: r.html_url, relevanceScore: 0.9, metadata: { language: r.language, stars: r.stargazers_count, forks: r.forks_count, keywords: ['repository', 'repo', 'codebase', 'project', r.language?.toLowerCase(), 'github'].filter(Boolean) } });
        }

        const issuesRes = await fetch(`${base}/repos/${github.owner}/${github.repo}/issues?state=all&per_page=50`, { headers });
        if (issuesRes.ok) {
            (await issuesRes.json()).filter(i => !i.pull_request).forEach(i => {
                results.push({ type: 'github_issue', title: `#${i.number}: ${i.title}`, description: i.body || `${i.state} issue`, url: i.html_url, relevanceScore: i.state === 'open' ? 0.9 : 0.7, metadata: { author: i.user.login, createdAt: i.created_at, state: i.state, number: i.number, labels: i.labels.map(l => l.name), keywords: ['issue', i.state, ...i.labels.map(l => l.name.toLowerCase())] } });
            });
        }

        const prRes = await fetch(`${base}/repos/${github.owner}/${github.repo}/pulls?state=all&per_page=30`, { headers });
        if (prRes.ok) {
            (await prRes.json()).forEach(pr => {
                results.push({ type: 'github_pr', title: `PR #${pr.number}: ${pr.title}`, description: pr.body || `${pr.state} pull request`, url: pr.html_url, relevanceScore: pr.state === 'open' ? 0.85 : 0.65, metadata: { author: pr.user.login, createdAt: pr.created_at, state: pr.state, number: pr.number, merged: !!pr.merged_at, keywords: ['pull request', 'pr', pr.state] } });
            });
        }

        const cmtRes = await fetch(`${base}/repos/${github.owner}/${github.repo}/commits?per_page=20`, { headers });
        if (cmtRes.ok) {
            (await cmtRes.json()).forEach(c => {
                results.push({ type: 'commit', title: c.commit.message.split('\n')[0], description: `Commit by ${c.commit.author.name}`, url: c.html_url, relevanceScore: 0.6, metadata: { author: c.commit.author.name, date: c.commit.author.date, sha: c.sha.substring(0, 7), keywords: ['commit', 'change', 'update'] } });
            });
        }
    } catch (err) {
        console.warn('Semantic search: GitHub data fetch error:', err.message);
    }
    return results;
}

function getDemoResults() {
    const results = [];

    // ── Team members ──
    (TEAM?.members || []).forEach(m => {
        results.push({ type: 'member', title: m.name, description: `${m.role}${m.email ? ' — ' + m.email : ''}`, relevanceScore: 0.6, metadata: { role: m.role, email: m.email, keywords: ['team', 'member', 'contributor', 'people', m.role.toLowerCase(), m.name.toLowerCase()] } });
    });

    // ── Commits + individual source files ──
    const allFiles = new Set();
    (COMMITS || []).forEach(c => {
        const author = TEAM?.members?.find(m => m.id === c.author);
        const authorName = author?.name || c.author;
        results.push({ type: 'commit', title: c.message, description: `Commit by ${authorName} — ${c.files?.length || 0} files (+${c.additions} -${c.deletions}) — Module: ${c.module}`, relevanceScore: 0.6, metadata: { author: authorName, date: c.date, module: c.module, files: c.files, additions: c.additions, deletions: c.deletions, keywords: ['commit', 'change', c.module, authorName.toLowerCase(), ...(c.message.toLowerCase().split(/\s+/).slice(0, 5))] } });
        // Index each unique file
        (c.files || []).forEach(f => {
            if (!allFiles.has(f)) {
                allFiles.add(f);
                const ext = f.split('.').pop();
                const fileName = f.split('/').pop();
                results.push({ type: 'file', title: f, description: `Source file — Last modified by ${authorName} in module: ${c.module}`, relevanceScore: 0.5, metadata: { author: authorName, date: c.date, module: c.module, extension: ext, keywords: ['file', 'source', 'code', ext, fileName.toLowerCase(), c.module, f.toLowerCase()] } });
            }
        });
    });

    // ── Pull Requests from store ──
    (PULL_REQUESTS || []).forEach(pr => {
        const author = TEAM?.members?.find(m => m.id === pr.author);
        results.push({ type: 'pull_request', title: `PR: ${pr.title}`, description: `${pr.status} PR by ${author?.name || pr.author} on branch ${pr.branch}${pr.stagnant ? ' ⚠️ Stagnant' : ''}`, relevanceScore: pr.status === 'open' ? 0.85 : 0.65, metadata: { author: author?.name || pr.author, status: pr.status, state: pr.status, branch: pr.branch, createdAt: pr.createdAt, comments: pr.comments, stagnant: pr.stagnant, keywords: ['pull request', 'pr', 'merge', 'review', pr.status, pr.branch, pr.stagnant ? 'stagnant' : ''].filter(Boolean) } });
    });

    // ── Active Work ──
    (ACTIVE_WORK || []).forEach(w => {
        results.push({ type: 'active_work', title: `${w.name}: ${w.currentTask}`, description: `Status: ${w.status} — Module: ${w.module} — Branch: ${w.branch} — Last commit: ${w.lastCommit}${w.warning ? ' ⚠️ ' + w.warning : ''}`, relevanceScore: 0.65, metadata: { author: w.name, status: w.status, module: w.module, branch: w.branch, warning: w.warning, keywords: ['work', 'active', 'task', 'current', w.status, w.module, w.name.toLowerCase(), w.branch] } });
    });

    // ── Blockers ──
    (BLOCKERS || []).forEach(b => {
        const owner = TEAM?.members?.find(m => m.id === b.owner);
        results.push({ type: 'blocker', title: b.title, description: `[${b.severity.toUpperCase()}] ${b.description}`, relevanceScore: b.severity === 'critical' ? 0.95 : b.severity === 'high' ? 0.85 : 0.7, metadata: { severity: b.severity, type: b.type, affectedModules: b.affectedModules, owner: owner?.name, createdAt: b.detectedAt, keywords: ['blocker', 'blocked', 'problem', b.severity, b.type, ...(b.affectedModules || [])] } });
    });

    // ── Ghosting Alerts ──
    (GHOSTING_ALERTS || []).forEach(g => {
        results.push({ type: 'ghosting_alert', title: `Ghosting: ${g.name}`, description: g.alert, relevanceScore: 0.8, metadata: { author: g.name, daysSinceCommit: g.daysSinceCommit, type: g.type, keywords: ['ghost', 'ghosting', 'inactive', 'absent', g.name.toLowerCase(), g.type] } });
    });

    // ── Integration Risks ──
    (INTEGRATION_RISKS || []).forEach(r => {
        results.push({ type: 'integration_risk', title: `Module: ${r.module}`, description: `Risk: ${r.risk}% — Status: ${r.status} — Dependencies: ${r.dependencies.join(', ')}`, relevanceScore: r.risk > 50 ? 0.8 : 0.5, metadata: { risk: r.risk, status: r.status, dependencies: r.dependencies, keywords: ['integration', 'risk', 'module', r.status, r.module.toLowerCase(), ...r.dependencies.map(d => d.toLowerCase())] } });
    });

    // ── Checkpoints ──
    (CHECKPOINTS || []).forEach(cp => {
        const isOverdue = cp.status !== 'completed' && new Date(cp.deadline) < new Date();
        results.push({ type: 'checkpoint', title: cp.title, description: `${cp.description || 'Task'} — ${cp.status} — Due: ${new Date(cp.deadline).toLocaleDateString()}`, relevanceScore: isOverdue ? 0.9 : 0.7, metadata: { status: cp.status, priority: cp.priority, assignee: cp.assigneeName, deadline: cp.deadline, isOverdue, keywords: ['checkpoint', 'task', 'deadline', cp.status, cp.priority, cp.assigneeName?.toLowerCase()].filter(Boolean) } });
    });

    // ── Branches ──
    (BRANCHES || []).forEach(b => {
        const author = TEAM?.members?.find(m => m.id === b.author);
        results.push({ type: 'branch', title: `Branch: ${b.name}`, description: `Status: ${b.status} — By: ${author?.name || 'unknown'}${b.staleDays ? ' — Stale: ' + b.staleDays + ' days' : ''}`, relevanceScore: 0.5, metadata: { status: b.status, author: author?.name, staleDays: b.staleDays, keywords: ['branch', b.status, b.name, b.staleDays ? 'stale' : ''].filter(Boolean) } });
    });

    return results;
}

// ── Read local files for true codebase search ──
import fs from 'fs';
import path from 'path';

function getLocalCodebaseResults(query) {
    if (!query || query.length < 3) return [];
    const results = [];
    const q = query.toLowerCase();

    // We only want to search if the query looks like a code term or specific request, 
    // to avoid overwhelming results for generic words like "the".
    const srcDir = path.join(process.cwd(), '../src');
    if (!fs.existsSync(srcDir)) return [];

    function scanDir(dir) {
        let items = [];
        try { items = fs.readdirSync(dir); } catch (e) { return; }

        for (const item of items) {
            const fullPath = path.join(dir, item);
            let stat;
            try { stat = fs.statSync(fullPath); } catch (e) { continue; }

            if (stat.isDirectory()) {
                if (['node_modules', 'dist', '.git', 'assets'].includes(item)) continue;
                scanDir(fullPath);
            } else if (stat.isFile() && /\.(js|jsx|css|html)$/.test(item)) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lines = content.split('\n');

                    // Simple text search line-by-line
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.toLowerCase().includes(q)) {
                            // Extract a snippet (current line + 1 line context)
                            const snippet = [
                                i > 0 ? lines[i - 1].trim() : '',
                                line.trim(),
                                i < lines.length - 1 ? lines[i + 1].trim() : ''
                            ].filter(Boolean).join('\n');

                            // Determine if it's a function declaration, export, state, etc.
                            let typeLabel = 'Code match';
                            if (line.includes('function ')) typeLabel = 'Function definition';
                            if (line.includes('const ') && line.includes(' = (')) typeLabel = 'Arrow function';
                            if (line.includes('export ')) typeLabel = 'Exported code';
                            if (line.includes('import ')) typeLabel = 'Import statement';

                            const relativePath = fullPath.replace(path.join(process.cwd(), '../'), '').replace(/\\/g, '/');

                            results.push({
                                type: 'file',
                                title: `${item} (Line ${i + 1})`,
                                description: `**${typeLabel}** in \`${relativePath}\`\n\`\`\`jsx\n${snippet}\n\`\`\``,
                                relevanceScore: 1.5, // Boost code matches significantly
                                metadata: {
                                    file: relativePath,
                                    line: i + 1,
                                    keywords: ['code', 'source', 'function', item.toLowerCase(), relativePath.toLowerCase()]
                                }
                            });

                            // Prevent flooding from a single file that has a common word mentioned 100 times
                            if (results.filter(r => r.metadata.file === relativePath).length > 3) {
                                break;
                            }
                        }
                    }
                } catch (e) {
                    // Ignore read errors
                }
            }
        }
    }

    // Only run expensive code scan if requested explicitly or if it's a specific-looking word
    if (q.length >= 4 || ['api', 'app', 'use', 'get', 'set'].includes(q)) {
        scanDir(srcDir);
    }

    // Deduplicate and return top 20
    const unique = [];
    const seen = new Set();
    for (const r of results) {
        const id = r.metadata?.file + ':' + r.metadata?.line;
        if (!seen.has(id)) {
            seen.add(id);
            unique.push(r);
        }
    }

    return unique.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 15);
}

/* ── Filter & rank ────────────────────────────────────── */

function filterAndRank(results, query, filters) {
    const answers = analyzeQueryIntent(query, results);
    let all = [...answers, ...results];

    if (filters.type && filters.type !== 'all') {
        all = all.filter(r => {
            if (r.type === 'answer') return true;
            switch (filters.type) {
                case 'github': return r.type.startsWith('github_');
                case 'commits': return r.type === 'commit';
                case 'members': return r.type === 'member';
                case 'checkpoints': return r.type === 'checkpoint';
                case 'branches': return r.type === 'branch';
                case 'files': return r.type === 'file';
                case 'prs': return r.type === 'pull_request' || r.type === 'github_pr';
                case 'blockers': return r.type === 'blocker' || r.type === 'ghosting_alert';
                case 'risks': return r.type === 'integration_risk';
                case 'work': return r.type === 'active_work';
                default: return true;
            }
        });
    }

    all = all.map(r => {
        if (r.type === 'answer') return r;
        const titleScore = calculateRelevance(r.title, query, r.metadata?.keywords);
        const descScore = calculateRelevance(r.description, query, r.metadata?.keywords);

        let boost = 0;
        const q = query.toLowerCase();
        if (q.includes('file') && r.type === 'file') boost += 0.5;
        if (q.includes('blocker') && r.type === 'blocker') boost += 0.5;
        if (q.includes('risk') && r.type === 'integration_risk') boost += 0.5;
        if ((q.includes('pull request') || q.includes('pr')) && (r.type === 'pull_request' || r.type === 'github_pr')) boost += 0.5;
        if (q.includes('commit') && r.type === 'commit') boost += 0.5;
        if (q.includes('member') && r.type === 'member') boost += 0.5;

        return { ...r, relevanceScore: Math.min(Math.max(titleScore, descScore * 0.8) + boost, 3.0) };
    });

    all = all.filter(r => r.type === 'answer' || r.relevanceScore > 0.1)
        .sort((a, b) => {
            if (a.type === 'answer' && b.type !== 'answer') return -1;
            if (b.type === 'answer' && a.type !== 'answer') return 1;
            return b.relevanceScore - a.relevanceScore;
        });

    if (filters.limit) all = all.slice(0, filters.limit);
    return all;
}

/* ── Public API ───────────────────────────────────────── */

export async function semanticSearch(query, filters = {}) {
    let allResults = getDemoResults();

    const localSourceFiles = getLocalCodebaseResults(query.trim());
    allResults = allResults.concat(localSourceFiles);

    if (github.isConfigured && github.token) {
        allResults = allResults.concat(await getGitHubResults());
    }

    const ranked = filterAndRank(allResults, query.trim(), filters);

    return {
        success: true,
        results: ranked,
        total: ranked.length,
        query: query.trim(),
        filters,
        sources: {
            github: allResults.filter(r => r.type.startsWith('github_')).length,
            commits: allResults.filter(r => r.type === 'commit').length,
            files: allResults.filter(r => r.type === 'file').length,
            members: allResults.filter(r => r.type === 'member').length,
            pull_requests: allResults.filter(r => r.type === 'pull_request').length,
            blockers: allResults.filter(r => r.type === 'blocker').length,
            checkpoints: allResults.filter(r => r.type === 'checkpoint').length,
            branches: allResults.filter(r => r.type === 'branch').length,
            risks: allResults.filter(r => r.type === 'integration_risk').length,
        }
    };
}

export function getSearchSuggestions() {
    return [
        'Who are the team members?',
        'App.jsx',
        'authentication',
        'open pull requests',
        'blockers',
        'integration risk',
        'project summary',
        'latest commit',
        'vite.config.js',
        'Dashboard',
        'inactive members',
        'stale branches',
    ];
}

export default { semanticSearch, getSearchSuggestions };
