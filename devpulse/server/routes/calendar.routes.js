// ────────────────────────────────────────────────────────
// DevPulse — Calendar Routes
// ────────────────────────────────────────────────────────

import { Router } from 'express';
import {
    getCalendarStatus,
    configureCalendar,
    getAuthUrl,
    handleOAuthCallback,
    createCalendarEvent,
    getEventLog,
    disconnectCalendar,
} from '../controllers/calendar.controller.js';

const router = Router();

router.get('/status', getCalendarStatus);
router.post('/configure', configureCalendar);
router.get('/auth-url', getAuthUrl);
router.get('/oauth/callback', handleOAuthCallback);
router.post('/create-event', createCalendarEvent);
router.get('/events', getEventLog);
router.post('/disconnect', disconnectCalendar);

export default router;
