import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { createSession, getWebSocket, getHistory } from '../controllers/terminal';

const router = new Hono();

router.post('/session', authenticate, createSession);
router.get('/ws', authenticate, getWebSocket);
router.get('/:id/history', authenticate, getHistory);

export default router;
