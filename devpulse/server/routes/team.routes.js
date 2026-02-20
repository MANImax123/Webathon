import { Router } from 'express';
import { getTeam, getMember } from '../controllers/team.controller.js';

const router = Router();

router.get('/', getTeam);
router.get('/members/:id', getMember);

export default router;
