// ────────────────────────────────────────────────────────
// DevPulse — Agent Service
// Handles work visibility queries + alert response logic
// ────────────────────────────────────────────────────────

import * as store from '../data/store.js';
import { classifyAlertResponse, answerWorkQuery } from '../utils/claudeClient.js';
import inactivityService from './inactivity.service.js';

/**
 * Build structured repository data for work visibility queries.
 * Gathers contributors, PRs, branches, and blockers from the store.
 * @returns {object}
 */
export function buildRepoData() {
    const members = store.TEAM?.members || [];
    const commits = store.COMMITS || [];
    const activeWork = store.ACTIVE_WORK || [];
    const branches = store.BRANCHES || [];
    const pullRequests = store.PULL_REQUESTS || [];
    const blockers = store.BLOCKERS || [];

    const contributors = members.map(member => {
        const memberCommits = commits
            .filter(c => c.author === member.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const work = activeWork.find(w => w.memberId === member.id);
        const memberBranches = branches.filter(b => b.author === member.id);
        const memberPRs = pullRequests.filter(p => p.author === member.id && p.status === 'open');
        const lastCommit = memberCommits[0];

        return {
            name: member.name,
            role: member.role,
            activeBranch: work?.branch || memberBranches.find(b => b.status === 'active')?.name || null,
            openPR: memberPRs.map(p => ({ title: p.title, branch: p.branch, ageDays: p.ageDays })),
            recentFiles: lastCommit?.files || [],
            lastCommitDate: lastCommit?.date || null,
            lastCommitMessage: lastCommit?.message || null,
            currentTask: work?.currentTask || null,
            status: work?.status || 'unknown',
            module: work?.module || lastCommit?.module || null,
        };
    });

    return {
        project: store.TEAM?.name || 'Unknown',
        contributors,
        openPRs: pullRequests
            .filter(p => p.status === 'open')
            .map(p => ({
                title: p.title,
                author: members.find(m => m.id === p.author)?.name || p.author,
                branch: p.branch,
                ageDays: p.ageDays,
                stagnant: p.stagnant || false,
            })),
        branches: branches.map(b => ({
            name: b.name,
            author: members.find(m => m.id === b.author)?.name || b.author,
            status: b.status,
            lastCommit: b.lastCommit,
            ahead: b.ahead,
            behind: b.behind,
        })),
        blockers: blockers.map(b => ({
            severity: b.severity,
            title: b.title,
            type: b.type,
            owner: members.find(m => m.id === b.owner)?.name || b.owner,
        })),
    };
}

/**
 * Handle a work visibility query.
 * @param {string} userQuery - Natural language question
 * @returns {Promise<object>} - { response, source }
 */
export async function handleWorkQuery(userQuery) {
    const repoData = buildRepoData();

    try {
        const aiResponse = await answerWorkQuery(repoData, userQuery);
        return {
            response: aiResponse,
            source: 'ai',
            timestamp: new Date().toISOString(),
        };
    } catch (err) {
        console.error('Agent query AI error:', err.message);
        // Fallback: basic keyword matching
        return {
            response: buildFallbackResponse(repoData, userQuery),
            source: 'fallback',
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Handle a user response to an inactivity alert.
 * @param {string} alertId
 * @param {string} userMessage
 * @returns {Promise<object>} - { classification, explanation, alert }
 */
export async function handleAlertResponse(alertId, userMessage) {
    const alert = inactivityService.getAlertById(alertId);
    if (!alert) {
        throw new Error(`Alert ${alertId} not found`);
    }

    // Add user message to conversation
    inactivityService.addConversationMessage(alertId, 'user', userMessage);

    // Build context for AI
    const context = inactivityService.buildAlertContext(alert);
    context.userMessage = userMessage;
    context.conversationHistory = alert.conversations;

    try {
        const result = await classifyAlertResponse(context, userMessage);

        // Update alert status based on classification
        const statusMap = {
            RESOLVED: 'RESOLVED',
            ESCALATE: 'ESCALATED',
            NEEDS_SUPPORT: 'NEEDS_SUPPORT',
            CONTINUE_MONITORING: 'OPEN',
        };

        const newStatus = statusMap[result.classification] || 'OPEN';
        inactivityService.updateAlertStatus(alertId, newStatus);

        // Add AI response to conversation
        inactivityService.addConversationMessage(
            alertId,
            'assistant',
            `**Classification: ${result.classification}**\n\n${result.explanation}`
        );

        return {
            classification: result.classification,
            explanation: result.explanation,
            alert: inactivityService.getAlertById(alertId),
        };
    } catch (err) {
        console.error('Alert response AI error:', err.message);

        // Fallback classification
        inactivityService.addConversationMessage(
            alertId,
            'assistant',
            'I noted your response. Continuing to monitor this situation.'
        );

        return {
            classification: 'CONTINUE_MONITORING',
            explanation: 'AI classification unavailable — defaulting to continued monitoring.',
            alert: inactivityService.getAlertById(alertId),
        };
    }
}

/**
 * Escalate an alert (e.g., no response within session).
 * @param {string} alertId
 * @returns {object|null}
 */
export function escalateAlert(alertId) {
    const alert = inactivityService.getAlertById(alertId);
    if (!alert) return null;

    inactivityService.updateAlertStatus(alertId, 'ESCALATED');
    inactivityService.addConversationMessage(
        alertId,
        'assistant',
        '⚠️ **Auto-escalated:** No response received. This alert has been escalated to the team lead.'
    );

    return inactivityService.getAlertById(alertId);
}

/**
 * Fallback response when AI is unavailable.
 * Simple keyword matching against repo data.
 */
function buildFallbackResponse(repoData, query) {
    const q = query.toLowerCase();

    // "What is X working on?" pattern
    const nameMatch = repoData.contributors.find(c =>
        q.includes(c.name.toLowerCase())
    );
    if (nameMatch) {
        const parts = [`**${nameMatch.name}** (${nameMatch.role})`];
        if (nameMatch.currentTask) parts.push(`• Current task: ${nameMatch.currentTask}`);
        if (nameMatch.activeBranch) parts.push(`• Active branch: ${nameMatch.activeBranch}`);
        if (nameMatch.status) parts.push(`• Status: ${nameMatch.status}`);
        if (nameMatch.lastCommitDate) parts.push(`• Last commit: ${nameMatch.lastCommitMessage} (${nameMatch.lastCommitDate})`);
        if (nameMatch.openPR?.length) {
            parts.push(`• Open PRs: ${nameMatch.openPR.map(p => p.title).join(', ')}`);
        }
        return parts.join('\n');
    }

    // "Who is working on X?" pattern
    if (q.includes('who is working on') || q.includes('anyone working on')) {
        const topic = q.replace(/who is working on|anyone working on|is anyone working on/gi, '').trim().replace(/[?]/g, '');
        const matches = repoData.contributors.filter(c =>
            (c.module && c.module.toLowerCase().includes(topic)) ||
            (c.currentTask && c.currentTask.toLowerCase().includes(topic)) ||
            (c.activeBranch && c.activeBranch.toLowerCase().includes(topic))
        );
        if (matches.length) {
            return matches.map(m => `• **${m.name}** — ${m.currentTask || m.module || 'N/A'} (branch: ${m.activeBranch || 'N/A'})`).join('\n');
        }
        return `No one is currently working on "${topic}" based on available data.`;
    }

    // "Show active branches"
    if (q.includes('branch')) {
        const active = repoData.branches.filter(b => b.status === 'active');
        return `**Active Branches (${active.length}):**\n${active.map(b => `• ${b.name} — by ${b.author}, ahead: ${b.ahead}, behind: ${b.behind}`).join('\n')}`;
    }

    return `Here's a summary of current work:\n${repoData.contributors.map(c => `• **${c.name}**: ${c.currentTask || 'No active task'} (${c.status})`).join('\n')}`;
}

export default {
    buildRepoData,
    handleWorkQuery,
    handleAlertResponse,
    escalateAlert,
};
