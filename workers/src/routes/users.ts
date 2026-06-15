import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { listUsers, getUser, updateUser, deleteUser, updateAvatar } from '../controllers/users';

const router = new Hono();

router.get('/', authenticate, listUsers);
router.get('/:id', authenticate, getUser);
router.patch('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);
router.patch('/:id/avatar', authenticate, updateAvatar);

export default router;
