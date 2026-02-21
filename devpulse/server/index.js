import './env.js';              // load .env BEFORE anything else
import express from 'express';
import cors from 'cors';

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
import notificationRoutes from './routes/notification.routes.js';
import checkpointRoutes from './routes/checkpoint.routes.js';
import searchRoutes from './routes/search.routes.js';
import discordBot from './services/discord-bot.service.js';

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/search', searchRoutes);

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
  // Start Discord bot (non-blocking — will log if token missing)
  discordBot.start().catch(err => console.error('Discord bot start error:', err.message));
});
