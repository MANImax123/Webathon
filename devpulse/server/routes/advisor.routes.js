import { Router } from 'express';
import { askAdvisor, getSuggestions } from '../controllers/advisor.controller.js';

const router = Router();

router.post('/ask', askAdvisor);                // POST { question: "..." }
router.get('/suggestions', getSuggestions);      // Get available prompt suggestions

export default router;
