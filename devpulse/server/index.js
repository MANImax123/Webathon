import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import teamRoutes from './routes/team.routes.js';
import healthRoutes from './routes/health.routes.js';
import workRoutes from './routes/work.routes.js';
import blockerRoutes from './routes/blocker.routes.js';
import integrationRoutes from './routes/integration.routes.js';
import busfactorRoutes from './routes/busfactor.routes.js';
import simulationRoutes from './routes/simulation.routes.js';
import advisorRoutes from './routes/advisor.routes.js';
import commitRoutes from './routes/commit.routes.js';
import githubRoutes from './routes/github.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ───────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use('/api/team', teamRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/work', workRoutes);
app.use('/api/blockers', blockerRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/busfactor', busfactorRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/commits', commitRoutes);
app.use('/api/github', githubRoutes);

// ── Health check ────────────────────────────────────────
app.get('/api/ping', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`⚡ DevPulse API running on http://localhost:${PORT}`);
});
