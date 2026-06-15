import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createTask, listTasks, getTask, updateTask, deleteTask,
  addTaskComment, getTaskComments,
} from '../controllers/tasks';

export const tasksRouter = new Hono();

tasksRouter.post('/', authenticate, createTask);
tasksRouter.get('/', authenticate, listTasks);
tasksRouter.get('/:id', authenticate, getTask);
tasksRouter.patch('/:id', authenticate, updateTask);
tasksRouter.delete('/:id', authenticate, deleteTask);
tasksRouter.post('/:id/comments', authenticate, addTaskComment);
tasksRouter.get('/:id/comments', authenticate, getTaskComments);
