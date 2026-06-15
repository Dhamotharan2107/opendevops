import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { globalSearch } from '../controllers/search';

const router = new Hono();

router.get('/', authenticate, globalSearch);

export default router;
