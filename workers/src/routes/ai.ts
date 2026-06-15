import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { analyzeLog, analyzeBug, generateTests, runTest } from '../controllers/ai';

export const aiRouter = new Hono();

aiRouter.post('/ai/analyze-log', authenticate, analyzeLog);
aiRouter.post('/ai/analyze-bug', authenticate, analyzeBug);
aiRouter.post('/ai/generate-tests', authenticate, generateTests);
aiRouter.post('/ai/test-run', authenticate, runTest);
