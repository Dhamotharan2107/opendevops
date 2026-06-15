import { Context } from 'hono';
import { NotificationRepository } from '../repositories/notification';
import { successResponse } from '../utils/helpers';
import type { Env } from '../types';

export async function listNotifications(c: Context) {
  const env = c.env as Env;
  const userId = c.get('userId');
  const repo = new NotificationRepository(env.DB);
  const page = c.req.query('page');
  const limit = c.req.query('limit');

  const result = await repo.findByUser(
    userId,
    page ? parseInt(page) : 1,
    limit ? parseInt(limit) : 20,
  );

  return c.json(successResponse(result));
}

export async function markAsRead(c: Context) {
  const env = c.env as Env;
  const id = c.req.param('id')!;
  const repo = new NotificationRepository(env.DB);

  await repo.markRead(id);
  return c.json(successResponse(null, 'Notification marked as read'));
}

export async function markAllAsRead(c: Context) {
  const env = c.env as Env;
  const userId = c.get('userId');
  const repo = new NotificationRepository(env.DB);

  await repo.markAllRead(userId);
  return c.json(successResponse(null, 'All notifications marked as read'));
}

export async function getUnreadCount(c: Context) {
  const env = c.env as Env;
  const userId = c.get('userId');
  const repo = new NotificationRepository(env.DB);

  const count = await repo.getUnreadCount(userId);
  return c.json(successResponse({ count }));
}

export async function websocketHandler(c: Context) {
  const env = c.env as Env;
  const userId = c.get('userId');
  const doId = env.NOTIFICATION_DO.idFromName(userId);
  const stub = env.NOTIFICATION_DO.get(doId);

  const url = new URL(c.req.url);
  url.pathname = '/ws';

  const doRequest = new Request(url.toString(), {
    headers: { 'X-User-Id': userId },
  });

  return stub.fetch(doRequest);
}
