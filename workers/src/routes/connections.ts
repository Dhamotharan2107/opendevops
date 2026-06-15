import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { sendRequest, acceptRequest, rejectRequest, removeConnection } from '../controllers/connections';

const router = new Hono();

router.post('/', authenticate, sendRequest);
router.patch('/accept', authenticate, acceptRequest);
router.patch('/reject', authenticate, rejectRequest);
router.delete('/:id', authenticate, removeConnection);

export default router;
