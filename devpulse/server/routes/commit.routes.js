import { Router } from 'express';
import { getCommits, getCommitById, getHonestyAnalysis, getCommitHonestyPage } from '../controllers/commit.controller.js';

const router = Router();

router.get('/', getCommits);                     // All commits (supports ?author=u1&module=backend)
router.get('/honesty', getHonestyAnalysis);      // Just honesty analysis data
router.get('/honesty-page', getCommitHonestyPage); // Combined: commits + honesty
router.get('/:id', getCommitById);               // Single commit by ID

export default router;
