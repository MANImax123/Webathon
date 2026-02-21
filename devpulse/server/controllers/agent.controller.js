// ────────────────────────────────────────────────────────
// DevPulse — Agent Controller
// Handles HTTP endpoints for agent features:
//   POST /api/agent/respond  — respond to inactivity alerts
//   POST /api/agent/query    — work visibility queries
//   GET  /api/agent/alerts   — list inactivity alerts
//   POST /api/agent/detect   — trigger inactivity detection
//   POST /api/agent/escalate — escalate an alert
// ────────────────────────────────────────────────────────

import inactivityService from '../services/inactivity.service.js';
import agentService from '../services/agent.service.js';

/**
 * POST /api/agent/detect
 * Trigger inactivity detection and generate alerts.
 */
export const detectInactivity = async (_req, res) => {
    try {
        const newAlerts = inactivityService.generateInactivityAlerts();
        const allAlerts = inactivityService.getAlerts();

        res.json({
            newAlerts: newAlerts.length,
            totalAlerts: allAlerts.length,
            alerts: allAlerts,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[Agent] Detect inactivity error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/agent/alerts
 * Return all agent alerts, optionally filtered by status.
 * Query param: ?status=OPEN|RESOLVED|ESCALATED|NEEDS_SUPPORT
 */
export const getAlerts = async (req, res) => {
    try {
        const { status } = req.query;
        const alerts = inactivityService.getAlerts(status || undefined);

        res.json({
            count: alerts.length,
            alerts,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[Agent] Get alerts error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/agent/respond
 * User responds to an inactivity alert; AI classifies the response.
 * Body: { alertId, userMessage }
 */
export const respondToAlert = async (req, res) => {
    try {
        const { alertId, userMessage } = req.body;

        if (!alertId) return res.status(400).json({ error: 'alertId is required' });
        if (!userMessage) return res.status(400).json({ error: 'userMessage is required' });

        const result = await agentService.handleAlertResponse(alertId, userMessage);

        res.json({
            classification: result.classification,
            explanation: result.explanation,
            alert: result.alert,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[Agent] Respond to alert error:', err.message);
        res.status(err.message.includes('not found') ? 404 : 500).json({ error: err.message });
    }
};

/**
 * POST /api/agent/query
 * Work visibility query — natural language question about repo.
 * Body: { userQuery }
 */
export const queryWork = async (req, res) => {
    try {
        const { userQuery } = req.body;

        if (!userQuery) return res.status(400).json({ error: 'userQuery is required' });

        const result = await agentService.handleWorkQuery(userQuery);

        res.json({
            query: userQuery,
            response: result.response,
            source: result.source,
            timestamp: result.timestamp,
        });
    } catch (err) {
        console.error('[Agent] Query work error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/agent/escalate
 * Manually escalate an alert.
 * Body: { alertId }
 */
export const escalateAlert = async (req, res) => {
    try {
        const { alertId } = req.body;
        if (!alertId) return res.status(400).json({ error: 'alertId is required' });

        const alert = agentService.escalateAlert(alertId);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });

        res.json({
            alert,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[Agent] Escalate error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
