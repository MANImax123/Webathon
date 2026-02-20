import { Router } from 'express';
import { getHealthScore, getVelocity, getContributions, getHealthRadar } from '../controllers/health.controller.js';

const router = Router();

router.get('/', getHealthRadar);           // Combined: healthScore + velocity + contributions
router.get('/score', getHealthScore);       // Just health score
router.get('/velocity', getVelocity);       // Just velocity data
router.get('/contributions', getContributions); // Just contribution stats

export default router;
