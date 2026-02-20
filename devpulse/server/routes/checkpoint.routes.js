import { Router } from 'express';
import github from '../services/github.service.js';
import {
  getCheckpoints,
  getCheckpoint,
  createCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  getMemberCheckpoints,
  getProgressSummary,
} from '../controllers/checkpoint.controller.js';

const router = Router();

// Middleware: Only allow Lead (Admin) to access
function requireLead(req, res, next) {
  // In demo mode (no token), allow access
  if (!github.token) return next();
  if (!github.isLead) {
    return res.status(403).json({ error: 'Only Lead (Admin) can manage checkpoints.' });
  }
  next();
}

router.get('/',                 getCheckpoints);        // All users can view
router.get('/progress',         getProgressSummary);    // All users can view progress
router.get('/member/:memberId', getMemberCheckpoints);  // All users can view
router.get('/:id',              getCheckpoint);          // All users can view
router.post('/',                requireLead, createCheckpoint);      // Lead only
router.put('/:id',              updateCheckpoint);                   // Controller handles role logic
router.delete('/:id',           requireLead, deleteCheckpoint);      // Lead only

export default router;
