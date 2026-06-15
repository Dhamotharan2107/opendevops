import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { listLogs, listErrors, updateErrorStatus } from '../controllers/logs';

export const logsRouter = new Hono();

logsRouter.get('/logs', authenticate, listLogs);
logsRouter.get('/errors', authenticate, listErrors);
logsRouter.patch('/errors/:id', authenticate, updateErrorStatus);
