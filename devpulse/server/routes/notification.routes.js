import { Router } from 'express';
import {
  getStatus,
  configureDiscord, disconnectDiscord, testDiscord,
  configureGmail, disconnectGmail, testGmail,
  configureGoogleCalendar, disconnectGoogleCalendar, testGoogleCalendar,
  sendGhostingAlerts, sendBlockerAlerts, sendHealthSummary,
} from '../controllers/notification.controller.js';

const router = Router();

// Status
router.get('/status', getStatus);

// Discord
router.post('/discord/configure',  configureDiscord);
router.post('/discord/disconnect', disconnectDiscord);
router.post('/discord/test',       testDiscord);

// Gmail
router.post('/gmail/configure',  configureGmail);
router.post('/gmail/disconnect', disconnectGmail);
router.post('/gmail/test',       testGmail);

// Google Calendar
router.post('/gcal/configure',  configureGoogleCalendar);
router.post('/gcal/disconnect', disconnectGoogleCalendar);
router.post('/gcal/test',       testGoogleCalendar);

// Send alerts
router.post('/send/ghosting',  sendGhostingAlerts);
router.post('/send/blockers',  sendBlockerAlerts);     // ?severity=critical|all
router.post('/send/health',    sendHealthSummary);

export default router;
