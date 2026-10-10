import { Hono } from 'hono';
import { getPublicStats } from '../controllers/stats';

export const statsRouter = new Hono();

// Public aggregate platform stats — no auth required (for landing page).
statsRouter.get('/stats', getPublicStats);
