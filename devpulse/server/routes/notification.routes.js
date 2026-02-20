import { Router } from 'express';
import {
  getStatus,
  configureDiscord, disconnectDiscord, testDiscord,
  configureGmail, disconnectGmail, testGmail,
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

// Send alerts
router.post('/send/ghosting',  sendGhostingAlerts);
router.post('/send/blockers',  sendBlockerAlerts);     // ?severity=critical|all
router.post('/send/health',    sendHealthSummary);

export default router;
