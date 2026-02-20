// ────────────────────────────────────────────────────────
// DevPulse — Google Calendar Service
// Creates events on Google Calendar when leader assigns work.
// Member gets automatic invite + reminders via Google Calendar.
// ────────────────────────────────────────────────────────

import { google } from 'googleapis';

class CalendarService {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID || null;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || null;
        this.refreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;
        this._calendar = null;
        this._auth = null;
        this.eventLog = [];

        this._init();
    }

    _init() {
        if (this.clientId && this.clientSecret && this.refreshToken) {
            try {
                this._auth = new google.auth.OAuth2(
                    this.clientId,
                    this.clientSecret,
                    'http://localhost:4000/api/calendar/oauth/callback'
                );
                this._auth.setCredentials({ refresh_token: this.refreshToken });
                this._calendar = google.calendar({ version: 'v3', auth: this._auth });
                console.log('📅 Google Calendar API initialized');
            } catch (err) {
                console.error('Google Calendar init error:', err.message);
            }
        } else {
            console.log('📅 Google Calendar not configured — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env');
        }
    }

    get enabled() {
        return Boolean(this._calendar);
    }

    get status() {
        return {
            enabled: this.enabled,
            configured: Boolean(this.clientId && this.clientSecret && this.refreshToken),
            eventsCreated: this.eventLog.length,
        };
    }

    /**
     * Configure credentials at runtime (from UI).
     */
    configure({ clientId, clientSecret, refreshToken }) {
        if (clientId) this.clientId = clientId;
        if (clientSecret) this.clientSecret = clientSecret;
        if (refreshToken) this.refreshToken = refreshToken;
        this._init();
        return this.status;
    }

    /**
     * Generate OAuth URL for the user to authorize.
     * They visit this URL, grant permission, get a code back.
     */
    getAuthUrl() {
        if (!this.clientId || !this.clientSecret) {
            throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set first');
        }

        const auth = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            'http://localhost:4000/api/calendar/oauth/callback'
        );

        return auth.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.events'],
            prompt: 'consent',
        });
    }

    /**
     * Exchange auth code for tokens.
     */
    async exchangeCode(code) {
        if (!this.clientId || !this.clientSecret) {
            throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set first');
        }

        const auth = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            'http://localhost:4000/api/calendar/oauth/callback'
        );

        const { tokens } = await auth.getToken(code);
        this.refreshToken = tokens.refresh_token || this.refreshToken;

        // Re-initialize with new tokens
        this._auth = auth;
        this._auth.setCredentials(tokens);
        this._calendar = google.calendar({ version: 'v3', auth: this._auth });

        return {
            refreshToken: this.refreshToken,
            message: 'Google Calendar connected! Add GOOGLE_REFRESH_TOKEN to .env for persistence.',
        };
    }

    /**
     * Create a Google Calendar event when a task is assigned.
     * The member (attendee email) receives an automatic Google invite + reminders.
     *
     * @param {object} params
     * @param {string} params.title - Task / work title
     * @param {string} params.description - Task description
     * @param {string} params.email - Assignee email (gets the calendar invite)
     * @param {string} params.date - Deadline date/time ISO string
     * @param {string} [params.priority] - Task priority
     * @param {string} [params.assigneeName] - Name of assignee
     * @returns {Promise<object>} - Created event details
     */
    async createTaskEvent({ title, description, email, date, priority, assigneeName }) {
        if (!this._calendar) {
            throw new Error('Google Calendar not configured. Set credentials in Settings or .env');
        }

        if (!title || !email || !date) {
            throw new Error('title, email, and date are required');
        }

        const deadline = new Date(date);
        // Event is 1 hour long at the deadline time
        const endTime = new Date(deadline.getTime() + 60 * 60 * 1000);

        const priorityEmoji = {
            critical: '🔴',
            high: '🟠',
            medium: '🔵',
            low: '⚪',
        };

        const event = {
            summary: `${priorityEmoji[priority] || '📋'} ${title}`,
            description: [
                description || 'No description provided.',
                '',
                `Priority: ${(priority || 'medium').toUpperCase()}`,
                `Assigned to: ${assigneeName || email}`,
                `Assigned by: DevPulse Team Lead`,
                '',
                '— Created by DevPulse',
            ].join('\n'),
            start: {
                dateTime: deadline.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Asia/Kolkata',
            },
            attendees: [
                { email, displayName: assigneeName || email, responseStatus: 'needsAction' },
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 },    // 1 hour before
                    { method: 'popup', minutes: 1440 },   // 1 day before
                    { method: 'email', minutes: 1440 },   // Email 1 day before
                    { method: 'email', minutes: 60 },      // Email 1 hour before
                ],
            },
            colorId: priority === 'critical' ? '11' : priority === 'high' ? '6' : priority === 'low' ? '8' : '9',
            status: 'confirmed',
            guestsCanModify: false,
            guestsCanSeeOtherGuests: true,
        };

        try {
            const result = await this._calendar.events.insert({
                calendarId: 'primary',
                resource: event,
                sendUpdates: 'all', // Sends invite email to attendee
            });

            const logEntry = {
                eventId: result.data.id,
                title,
                email,
                date: deadline.toISOString(),
                htmlLink: result.data.htmlLink,
                createdAt: new Date().toISOString(),
            };
            this.eventLog.unshift(logEntry);
            if (this.eventLog.length > 50) this.eventLog.length = 50;

            return {
                success: true,
                eventId: result.data.id,
                htmlLink: result.data.htmlLink,
                summary: result.data.summary,
                start: result.data.start,
                end: result.data.end,
                attendees: result.data.attendees,
            };
        } catch (err) {
            console.error('Google Calendar create event error:', err.message);
            throw new Error(`Failed to create calendar event: ${err.message}`);
        }
    }

    /**
     * List recent events created by DevPulse.
     */
    getEventLog() {
        return this.eventLog;
    }

    /**
     * Disconnect / reset credentials.
     */
    disconnect() {
        this.clientId = null;
        this.clientSecret = null;
        this.refreshToken = null;
        this._calendar = null;
        this._auth = null;
        return { message: 'Google Calendar disconnected' };
    }
}

export const calendarService = new CalendarService();
export default calendarService;
