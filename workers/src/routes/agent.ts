import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { handleAgentWebSocket, handleAgentCommand, handleAgentStatus } from '../controllers/agent';

const router = new Hono();

router.get('/:projectId/ws', authenticate, handleAgentWebSocket);
router.post('/:projectId/command', authenticate, handleAgentCommand);
router.get('/:projectId/status', authenticate, handleAgentStatus);

export default router;
