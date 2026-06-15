import { Hono } from 'hono';
import { adminAuth } from '../middleware/admin';
import {
  getStats, listAllUsers, getUserDetail, updateUserAdmin, deleteUserAdmin,
  listEnvVars, upsertEnvVar, deleteEnvVar,
} from '../controllers/admin';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();

router.use('*', adminAuth);

router.get('/stats', getStats);
router.get('/users', listAllUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id', updateUserAdmin);
router.delete('/users/:id', deleteUserAdmin);

router.get('/env', listEnvVars);
router.put('/env/:key', upsertEnvVar);
router.delete('/env/:key', deleteEnvVar);

export default router;
