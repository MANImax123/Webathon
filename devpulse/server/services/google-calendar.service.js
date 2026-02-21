// ────────────────────────────────────────────────────────
// Google Calendar Service for DevPulse
// Creates calendar events with collaborator attendees
// when checkpoints are assigned by the lead.
//
// Requires OAuth2 credentials:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
// ────────────────────────────────────────────────────────

import { google } from 'googleapis';

class GoogleCalendarService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID || null;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || null;
    this.refreshToken = process.env.GOOGLE_REFRESH_TOKEN || null;
    this.enabled = false;
    this._auth = null;
    this._calendar = null;
    this.eventLog = [];

    // Auto-initialise if env vars are present
    if (this.clientId && this.clientSecret && this.refreshToken) {
      this._init();
    }
  }

  /* ── Status ──────────────────────────────────────────── */
  get status() {
    return {
      enabled: this.enabled,
      configured: Boolean(this.clientId && this.clientSecret && this.refreshToken),
      eventsCreated: this.eventLog.length,
    };
  }

  /* ── Configure at runtime (Settings page) ────────────── */
  configure({ clientId, clientSecret, refreshToken }) {
    if (clientId) this.clientId = clientId;
    if (clientSecret) this.clientSecret = clientSecret;
    if (refreshToken) this.refreshToken = refreshToken;
    this._init();
  }

  disconnect() {
    this.clientId = null;
    this.clientSecret = null;
    this.refreshToken = null;
    this.enabled = false;
    this._auth = null;
    this._calendar = null;
  }

  /* ── Internal init ───────────────────────────────────── */
  _init() {
    try {
      this._auth = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        'https://developers.google.com/oauthplayground', // redirect URI
      );
      this._auth.setCredentials({ refresh_token: this.refreshToken });
      this._calendar = google.calendar({ version: 'v3', auth: this._auth });
      this.enabled = true;
      console.log('✅ Google Calendar service initialised');
    } catch (err) {
      console.error('❌ Google Calendar init failed:', err.message);
      this.enabled = false;
    }
  }

  /* ── Create calendar event for a checkpoint ──────────── */
  /**
   * @param {Object} checkpoint  – checkpoint object (title, description, deadline, priority, assigneeName, createdBy)
   * @param {string[]} attendeeEmails – array of collaborator email addresses
   * @param {string} teamName – repo / project name for context
   * @returns {Object|null} – Google Calendar event or null on failure
   */
  async createCheckpointEvent(checkpoint, attendeeEmails = [], teamName = 'Project') {
    if (!this.enabled || !this._calendar) {
      console.warn('Google Calendar not enabled — skipping event creation');
      return null;
    }

    const deadline = new Date(checkpoint.deadline);
    // Event starts 1 hour before deadline, ends at deadline
    const startTime = new Date(deadline.getTime() - 3600000);

    // Build attendee list (only valid emails)
    const attendees = attendeeEmails
      .filter(e => e && e.includes('@'))
      .map(email => ({ email }));

    const priorityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🔵',
      low: '⚪',
    };

    const event = {
      summary: `${priorityEmoji[checkpoint.priority] || '📋'} ${checkpoint.title}`,
      description: [
        checkpoint.description || 'No description provided.',
        '',
        `Priority: ${(checkpoint.priority || 'medium').toUpperCase()}`,
        `Assigned to: ${checkpoint.assigneeName || 'Team'}`,
        `Created by: ${checkpoint.createdBy || 'Lead'}`,
        `Project: ${teamName}`,
        '',
        '— Created by DevPulse',
      ].join('\n'),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: deadline.toISOString(),
        timeZone: 'UTC',
      },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },    // 1 hour before
          { method: 'popup', minutes: 30 },     // 30 min popup
          { method: 'email', minutes: 1440 },   // 1 day before
        ],
      },
      colorId: checkpoint.priority === 'critical' ? '11'  // red
        : checkpoint.priority === 'high' ? '6'            // orange
        : checkpoint.priority === 'medium' ? '9'           // blue
        : '8',                                             // gray
      // Send email notifications to attendees
      sendUpdates: 'all',
    };

    try {
      const response = await this._calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all',   // notifies all attendees
      });

      const entry = {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        title: checkpoint.title,
        attendees: attendeeEmails,
        createdAt: new Date().toISOString(),
      };
      this.eventLog.unshift(entry);
      if (this.eventLog.length > 50) this.eventLog.length = 50;

      console.log(`📅 Calendar event created: ${response.data.htmlLink}`);
      return entry;
    } catch (err) {
      console.error('❌ Failed to create Google Calendar event:', err.message);
      throw err;
    }
  }

  /* ── Update an existing calendar event ───────────────── */
  async updateCheckpointEvent(eventId, updates) {
    if (!this.enabled || !this._calendar || !eventId) return null;

    try {
      const response = await this._calendar.events.patch({
        calendarId: 'primary',
        eventId,
        resource: updates,
        sendUpdates: 'all',
      });
      console.log(`📅 Calendar event updated: ${eventId}`);
      return response.data;
    } catch (err) {
      console.error('Failed to update calendar event:', err.message);
      return null;
    }
  }

  /* ── Delete a calendar event ─────────────────────────── */
  async deleteCheckpointEvent(eventId) {
    if (!this.enabled || !this._calendar || !eventId) return false;

    try {
      await this._calendar.events.delete({
        calendarId: 'primary',
        eventId,
        sendUpdates: 'all',
      });
      console.log(`🗑️ Calendar event deleted: ${eventId}`);
      return true;
    } catch (err) {
      console.error('Failed to delete calendar event:', err.message);
      return false;
    }
  }
}

export const googleCalendar = new GoogleCalendarService();
export default googleCalendar;
