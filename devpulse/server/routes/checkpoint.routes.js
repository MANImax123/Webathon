import { Router } from 'express';
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

// Middleware: Only allow Lead (Admin) to view checkpoints
function requireLead(req, res, next) {
  // Use github service state (after connection)
  if (!github.isLead) {
    return res.status(403).json({ error: 'Only Lead (Admin) can view checkpoints.' });
  }
  next();
}

router.get('/',                requireLead, getCheckpoints);       // List all
router.get('/progress',        requireLead, getProgressSummary);   // Progress overview per member
router.get('/member/:memberId', requireLead, getMemberCheckpoints); // Tasks for a specific member
router.get('/:id',             requireLead, getCheckpoint);         // Single checkpoint
router.post('/',               createCheckpoint);      // Create (lead only)
router.put('/:id',             updateCheckpoint);      // Update
router.delete('/:id',          deleteCheckpoint);      // Delete (lead only)

export default router;
