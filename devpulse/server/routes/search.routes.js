// ─────────────────────────────────────────────────────────
// Semantic Search Routes for DevPulse
// ─────────────────────────────────────────────────────────
import { Router } from 'express';
import { semanticSearch, getSearchSuggestions } from '../services/search.service.js';

const router = Router();

// POST /api/search/semantic — perform semantic search
router.post('/semantic', async (req, res) => {
    try {
        const { query, filters = {} } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const result = await semanticSearch(query, filters);
        res.json(result);
    } catch (err) {
        console.error('Semantic search error:', err);
        res.status(500).json({ message: 'Search failed. Please try again.', details: err.message });
    }
});

// GET /api/search/suggestions — get search suggestions
router.get('/suggestions', (_req, res) => {
    res.json({ success: true, suggestions: getSearchSuggestions() });
});

export default router;
