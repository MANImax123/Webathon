import { Router } from 'express';
import { getBlockers, getGhostingAlerts, getBlockerDashboard } from '../controllers/blocker.controller.js';

const router = Router();

router.get('/', getBlockerDashboard);         // Combined: blockers + ghostingAlerts
router.get('/list', getBlockers);             // Just blockers (supports ?severity=critical)
router.get('/ghosting', getGhostingAlerts);   // Just ghosting alerts

export default router;
