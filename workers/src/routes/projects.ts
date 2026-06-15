import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createProject, listProjects, getProject, updateProject, deleteProject,
  addMember, removeMember, updateMember,
} from '../controllers/projects';

const router = new Hono();

router.post('/', authenticate, createProject);
router.get('/', authenticate, listProjects);
router.get('/:id', authenticate, getProject);
router.patch('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);
router.post('/:id/members', authenticate, addMember);
router.delete('/:id/members/:userId', authenticate, removeMember);
router.patch('/:id/members/:userId', authenticate, updateMember);

export default router;
