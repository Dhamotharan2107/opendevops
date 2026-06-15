import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  reportBug, listBugs, getBug, updateBug, deleteBug,
  addBugComment, getBugComments,
} from '../controllers/bugs';

export const bugsRouter = new Hono();

bugsRouter.post('/', authenticate, reportBug);
bugsRouter.get('/', authenticate, listBugs);
bugsRouter.get('/:id', authenticate, getBug);
bugsRouter.patch('/:id', authenticate, updateBug);
bugsRouter.delete('/:id', authenticate, deleteBug);
bugsRouter.post('/:id/comments', authenticate, addBugComment);
bugsRouter.get('/:id/comments', authenticate, getBugComments);
