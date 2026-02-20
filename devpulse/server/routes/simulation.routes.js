import { Router } from 'express';
import { getScenarios, runSimulation, getSimulationDashboard } from '../controllers/simulation.controller.js';

const router = Router();

router.get('/', getSimulationDashboard);         // Combined: scenarios + currentHealth
router.get('/scenarios', getScenarios);          // Just scenarios
router.get('/run/:scenarioId', runSimulation);   // Run a specific scenario

export default router;
