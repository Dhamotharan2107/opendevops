import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  register, login, logout, me,
  googleAuth, googleCallback, exchangeGoogleCode,
  githubAuth, githubCallback,
} from '../controllers/auth';

const router = new Hono();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/google/exchange', exchangeGoogleCode);
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

export default router;
