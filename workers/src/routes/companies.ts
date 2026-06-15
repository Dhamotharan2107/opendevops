import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createCompany, listCompanies, getCompany, updateCompany, deleteCompany,
  joinCompany, leaveCompany,
} from '../controllers/companies';

const router = new Hono();

router.post('/', authenticate, createCompany);
router.get('/', authenticate, listCompanies);
router.get('/:id', authenticate, getCompany);
router.patch('/:id', authenticate, updateCompany);
router.delete('/:id', authenticate, deleteCompany);
router.post('/:id/join', authenticate, joinCompany);
router.post('/:id/leave', authenticate, leaveCompany);

export default router;
