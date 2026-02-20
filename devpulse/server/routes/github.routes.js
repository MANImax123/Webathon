import { Router } from 'express';
import { getStatus, connect, sync, disconnect, getCollaboratorEmails } from '../controllers/github.controller.js';

const router = Router();

router.get('/status', getStatus);
router.get('/emails', getCollaboratorEmails);    // Lead: get collaborator emails
router.post('/connect', connect);
router.post('/sync', sync);
router.post('/disconnect', disconnect);

export default router;
