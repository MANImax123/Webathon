// ────────────────────────────────────────────────────────
// DevPulse — Agent Routes
// POST /api/agent/respond   — respond to inactivity alert
// POST /api/agent/query     — work visibility query
// GET  /api/agent/alerts    — list alerts
// POST /api/agent/detect    — trigger detection
// POST /api/agent/escalate  — escalate alert
// ────────────────────────────────────────────────────────

import { Router } from 'express';
import {
    detectInactivity,
    getAlerts,
    respondToAlert,
    queryWork,
    escalateAlert,
} from '../controllers/agent.controller.js';

const router = Router();

router.post('/detect', detectInactivity);
router.get('/alerts', getAlerts);
router.post('/respond', respondToAlert);
router.post('/query', queryWork);
router.post('/escalate', escalateAlert);

export default router;
