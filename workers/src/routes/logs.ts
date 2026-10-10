import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { listLogs, createLog, listErrors, createError, updateErrorStatus } from '../controllers/logs';

export const logsRouter = new Hono();

logsRouter.get('/logs', authenticate, listLogs);
logsRouter.post('/logs', authenticate, createLog);
logsRouter.get('/errors', authenticate, listErrors);
logsRouter.post('/errors', authenticate, createError);
logsRouter.patch('/errors/:id', authenticate, updateErrorStatus);
