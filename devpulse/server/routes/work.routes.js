import { Router } from 'express';
import { getActiveWork, getCommitsByAuthor, getWorkMap } from '../controllers/work.controller.js';

const router = Router();

router.get('/', getWorkMap);                      // Combined: activeWork + recentCommits
router.get('/active', getActiveWork);             // Just active work items
router.get('/commits/:authorId', getCommitsByAuthor); // Commits by author

export default router;
