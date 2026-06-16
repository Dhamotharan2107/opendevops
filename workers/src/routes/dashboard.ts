import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { getDashboard } from '../controllers/dashboard';

export const dashboardRouter = new Hono();

dashboardRouter.get('/dashboard', authenticate, getDashboard);
