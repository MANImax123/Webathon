// ────────────────────────────────────────────────────────
// DevPulse — Calendar Controller
// Handles Google Calendar configuration and event creation.
// ────────────────────────────────────────────────────────

import calendarService from '../services/calendar.service.js';

/**
 * GET /api/calendar/status
 * Returns current Google Calendar configuration status.
 */
export const getCalendarStatus = (req, res) => {
    res.json(calendarService.status);
};

/**
 * POST /api/calendar/configure
 * Body: { clientId, clientSecret, refreshToken }
 * Configure Google Calendar credentials at runtime.
 */
export const configureCalendar = (req, res) => {
    try {
        const { clientId, clientSecret, refreshToken } = req.body;
        const status = calendarService.configure({ clientId, clientSecret, refreshToken });
        res.json({ success: true, ...status });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * GET /api/calendar/auth-url
 * Returns OAuth URL to authorize Google Calendar access.
 */
export const getAuthUrl = (req, res) => {
    try {
        const url = calendarService.getAuthUrl();
        res.json({ url });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

/**
 * GET /api/calendar/oauth/callback
 * OAuth2 callback — exchanges code for tokens.
 */
export const handleOAuthCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ error: 'Missing authorization code' });
        }
        const result = await calendarService.exchangeCode(code);
        // Return an HTML page so the user can see the result and close the tab
        res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0;">
          <div style="text-align: center; padding: 2rem; border: 1px solid #334155; border-radius: 1rem; background: #1e293b;">
            <h2 style="color: #22d3ee;">✅ Google Calendar Connected!</h2>
            <p>Refresh Token: <code style="background: #0f172a; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">${result.refreshToken}</code></p>
            <p style="color: #94a3b8; font-size: 14px;">Save this refresh token in your .env file as GOOGLE_REFRESH_TOKEN for persistence.</p>
            <p style="color: #94a3b8; font-size: 14px;">You can close this tab now.</p>
          </div>
        </body>
      </html>
    `);
    } catch (err) {
        res.status(400).send(`
      <html>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0;">
          <div style="text-align: center; padding: 2rem;">
            <h2 style="color: #f87171;">❌ Authorization Failed</h2>
            <p>${err.message}</p>
          </div>
        </body>
      </html>
    `);
    }
};

/**
 * POST /api/calendar/create-event
 * Body: { title, description, email, date, priority, assigneeName }
 * Creates a Google Calendar event for a task assignment.
 */
export const createCalendarEvent = async (req, res) => {
    try {
        const { title, description, email, date, priority, assigneeName } = req.body;

        if (!title || !email || !date) {
            return res.status(400).json({ error: 'title, email, and date are required' });
        }

        const result = await calendarService.createTaskEvent({
            title,
            description,
            email,
            date,
            priority,
            assigneeName,
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/calendar/events
 * Returns log of events created via DevPulse.
 */
export const getEventLog = (req, res) => {
    res.json(calendarService.getEventLog());
};

/**
 * POST /api/calendar/disconnect
 * Disconnects Google Calendar integration.
 */
export const disconnectCalendar = (req, res) => {
    const result = calendarService.disconnect();
    res.json(result);
};
