import { Hono } from 'hono';
import { chatRouter as chat } from './chat';
import { tasksRouter as tasks } from './tasks';
import { bugsRouter as bugs } from './bugs';
import users from './users';
import auth from './auth';
import projects from './projects';
import deployments from './deployments';
import companies from './companies';
import connections from './connections';
import search from './search';
import terminal from './terminal';
import tunnel from './tunnel';
import { aiRouter } from './ai';
import { logsRouter } from './logs';
import { notificationsRouter } from './notifications';
import { testsRouter } from './tests';
import type { Env } from '../types';

const apiRoutes = new Hono<{ Bindings: Env }>();

apiRoutes.route('/chat', chat);
apiRoutes.route('/tasks', tasks);
apiRoutes.route('/bugs', bugs);
apiRoutes.route('/users', users);
apiRoutes.route('/auth', auth);
apiRoutes.route('/projects', projects);
apiRoutes.route('/deployments', deployments);
apiRoutes.route('/companies', companies);
apiRoutes.route('/connections', connections);
apiRoutes.route('/search', search);
apiRoutes.route('/terminal', terminal);
apiRoutes.route('/tunnel', tunnel);
apiRoutes.route('/', aiRouter);
apiRoutes.route('/', logsRouter);
apiRoutes.route('/', notificationsRouter);
apiRoutes.route('/', testsRouter);

export default apiRoutes;
