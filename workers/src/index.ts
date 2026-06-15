import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppError } from './utils/errors';
import { errorResponse } from './utils/helpers';
import type { Env } from './types';
import { NotificationDurableObject } from './durable-objects/notification-do';

import authRouter from './routes/auth';
import usersRouter from './routes/users';
import searchRouter from './routes/search';
import connectionsRouter from './routes/connections';
import companiesRouter from './routes/companies';
import projectsRouter from './routes/projects';
import deploymentsRouter from './routes/deployments';
import terminalRouter from './routes/terminal';
import tunnelRouter from './routes/tunnel';
import { chatRouter } from './routes/chat';
import { tasksRouter } from './routes/tasks';
import { bugsRouter } from './routes/bugs';
import { logsRouter } from './routes/logs';
import { aiRouter } from './routes/ai';
import { testsRouter } from './routes/tests';
import { notificationsRouter } from './routes/notifications';
import adminRouter from './routes/admin';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: '*',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
}));

app.route('/api/auth', authRouter);
app.route('/api/users', usersRouter);
app.route('/api/search', searchRouter);
app.route('/api/connections', connectionsRouter);
app.route('/api/companies', companiesRouter);
app.route('/api/projects', projectsRouter);
app.route('/api/chat', chatRouter);
app.route('/api/tasks', tasksRouter);
app.route('/api/bugs', bugsRouter);
app.route('/api/deployments', deploymentsRouter);
app.route('/api/terminal', terminalRouter);
app.route('/api/tunnel', tunnelRouter);
app.route('/api', logsRouter);
app.route('/api', aiRouter);
app.route('/api', testsRouter);
app.route('/api', notificationsRouter);
app.route('/api/admin', adminRouter);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(errorResponse(err.message, err.status), err.status as any);
  }
  console.error('Unhandled error:', err);
  return c.json(errorResponse('Internal server error', 500), 500);
});

app.notFound((c) => c.json(errorResponse('Not found', 404), 404));

export default app;
export { ChatDurableObject } from './durable-objects/chat-do';
export { AgentDurableObject } from './durable-objects/agent';
export { TerminalDurableObject } from './durable-objects/terminal';
export { NotificationDurableObject };
