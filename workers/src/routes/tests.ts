import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { triggerTestRun, getTestRun } from '../controllers/tests';

export const testsRouter = new Hono();

testsRouter.post('/tests/run', authenticate, triggerTestRun);
testsRouter.get('/tests/:id', authenticate, getTestRun);
