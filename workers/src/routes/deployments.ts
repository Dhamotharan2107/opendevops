import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { createDeployment, listDeployments, getDeployment, updateDeployment } from '../controllers/deployments';

const router = new Hono();

router.post('/', authenticate, createDeployment);
router.get('/', authenticate, listDeployments);
router.get('/:id', authenticate, getDeployment);
router.patch('/:id', authenticate, updateDeployment);

export default router;
