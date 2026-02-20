// ────────────────────────────────────────────────────────
// DevPulse — Inactivity Detection Service
// Detects contributors with no commits in >= 3 hours
// Generates alert objects, stores in memory (demo mode)
// ────────────────────────────────────────────────────────

import * as store from '../data/store.js';

// In-memory alert store (demo mode — no database)
let agentAlerts = [];

/**
 * Detect team members who haven't committed in >= thresholdHours.
 * Uses COMMITS + TEAM from the data store.
 * @param {number} thresholdHours - Hours of inactivity to trigger alert (default: 3)
 * @returns {Array} - List of inactive member objects
 */
export function detectInactiveMembers(thresholdHours = 3) {
    const now = new Date();
    const members = store.TEAM?.members || [];
    const commits = store.COMMITS || [];

    const inactive = [];

    for (const member of members) {
        // Find the most recent commit by this member
        const memberCommits = commits
            .filter(c => c.author === member.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const lastCommit = memberCommits[0];
        const lastCommitDate = lastCommit ? new Date(lastCommit.date) : null;

        if (!lastCommitDate) {
            // Never committed — treat as inactive since project start
            const hoursInactive = Math.floor((now - new Date(store.TEAM?.createdAt || now)) / (1000 * 60 * 60));
            inactive.push({
                memberId: member.id,
                name: member.name,
                role: member.role,
                lastCommitDate: null,
                lastCommitMessage: null,
                hoursInactive,
                recentFiles: [],
            });
            continue;
        }

        const diffMs = now - lastCommitDate;
        const hoursInactive = Math.floor(diffMs / (1000 * 60 * 60));

        if (hoursInactive >= thresholdHours) {
            inactive.push({
                memberId: member.id,
                name: member.name,
                role: member.role,
                lastCommitDate: lastCommitDate.toISOString(),
                lastCommitMessage: lastCommit.message,
                hoursInactive,
                recentFiles: lastCommit.files || [],
            });
        }
    }

    return inactive;
}

/**
 * Generate alert objects for all inactive members.
 * Avoids duplicate alerts for the same member if one is already OPEN.
 * @returns {Array} - Newly created alerts
 */
export function generateInactivityAlerts() {
    const inactiveMembers = detectInactiveMembers(3);
    const newAlerts = [];

    for (const member of inactiveMembers) {
        // Skip if an OPEN alert already exists for this member
        const existingOpen = agentAlerts.find(
            a => a.member.memberId === member.memberId && a.status === 'OPEN'
        );
        if (existingOpen) continue;

        const alert = {
            id: `alert-${Date.now()}-${member.memberId}`,
            member,
            hoursInactive: member.hoursInactive,
            status: 'OPEN',
            createdAt: new Date().toISOString(),
            conversations: [],
        };

        agentAlerts.push(alert);
        newAlerts.push(alert);
    }

    return newAlerts;
}

/**
 * Get all stored alerts.
 * @param {string} [status] - Optional filter by status
 * @returns {Array}
 */
export function getAlerts(status) {
    if (status) {
        return agentAlerts.filter(a => a.status === status);
    }
    return [...agentAlerts];
}

/**
 * Get a single alert by ID.
 * @param {string} alertId
 * @returns {object|null}
 */
export function getAlertById(alertId) {
    return agentAlerts.find(a => a.id === alertId) || null;
}

/**
 * Update an alert's status.
 * @param {string} alertId
 * @param {string} newStatus - OPEN | RESOLVED | ESCALATED | NEEDS_SUPPORT | CONTINUE_MONITORING
 * @returns {object|null}
 */
export function updateAlertStatus(alertId, newStatus) {
    const alert = agentAlerts.find(a => a.id === alertId);
    if (!alert) return null;
    alert.status = newStatus;
    alert.updatedAt = new Date().toISOString();
    return alert;
}

/**
 * Add a conversation message to an alert.
 * @param {string} alertId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content
 */
export function addConversationMessage(alertId, role, content) {
    const alert = agentAlerts.find(a => a.id === alertId);
    if (!alert) return null;
    alert.conversations.push({
        role,
        content,
        timestamp: new Date().toISOString(),
    });
    return alert;
}

/**
 * Build context object for AI classification.
 * Merges alert data with project health data.
 * @param {object} alert
 * @returns {object}
 */
export function buildAlertContext(alert) {
    const health = store.HEALTH_SCORE || {};
    const blockers = (store.BLOCKERS || []).filter(
        b => b.owner === alert.member.memberId
    );
    const memberCommits = (store.COMMITS || [])
        .filter(c => c.author === alert.member.memberId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const activeWork = (store.ACTIVE_WORK || []).find(
        w => w.memberId === alert.member.memberId
    );

    return {
        member: alert.member.name,
        memberId: alert.member.memberId,
        role: alert.member.role,
        hoursInactive: alert.hoursInactive,
        lastCommitDate: alert.member.lastCommitDate,
        lastCommitMessage: alert.member.lastCommitMessage,
        projectHealth: health.overall || 0,
        healthBreakdown: health.breakdown || {},
        blockers: blockers.map(b => ({ severity: b.severity, title: b.title })),
        recentCommits: memberCommits.map(c => ({
            message: c.message,
            date: c.date,
            files: c.files,
        })),
        currentWork: activeWork ? {
            status: activeWork.status,
            task: activeWork.currentTask,
            branch: activeWork.branch,
        } : null,
    };
}

/**
 * Reset all alerts (useful for demo reset).
 */
export function resetAlerts() {
    agentAlerts = [];
}

export default {
    detectInactiveMembers,
    generateInactivityAlerts,
    getAlerts,
    getAlertById,
    updateAlertStatus,
    addConversationMessage,
    buildAlertContext,
    resetAlerts,
};
