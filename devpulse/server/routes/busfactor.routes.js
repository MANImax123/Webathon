import { Router } from 'express';
import { getBusFactor, getCriticalModules } from '../controllers/busfactor.controller.js';

const router = Router();

router.get('/', getBusFactor);                  // Full heatmap data
router.get('/critical', getCriticalModules);    // Modules with bus factor risk (?threshold=85)

export default router;
