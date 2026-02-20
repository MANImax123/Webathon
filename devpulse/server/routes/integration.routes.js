import { Router } from 'express';
import { getIntegrationRisks, getModuleRisk } from '../controllers/integration.controller.js';

const router = Router();

router.get('/', getIntegrationRisks);            // All module risks
router.get('/:module', getModuleRisk);           // Single module risk

export default router;
