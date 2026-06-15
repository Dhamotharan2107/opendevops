import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { listNotifications, markAsRead, markAllAsRead, getUnreadCount, websocketHandler } from '../controllers/notifications';

export const notificationsRouter = new Hono();

notificationsRouter.get('/notifications', authenticate, listNotifications);
notificationsRouter.patch('/notifications/:id/read', authenticate, markAsRead);
notificationsRouter.patch('/notifications/read-all', authenticate, markAllAsRead);
notificationsRouter.get('/notifications/unread-count', authenticate, getUnreadCount);
notificationsRouter.get('/notifications/ws', authenticate, websocketHandler);
