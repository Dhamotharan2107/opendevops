import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { startTunnel, stopTunnel, getTunnelStatus } from '../controllers/tunnel';

const router = new Hono();

router.post('/start', authenticate, startTunnel);
router.post('/stop', authenticate, stopTunnel);
router.get('/status', authenticate, getTunnelStatus);

export default router;
