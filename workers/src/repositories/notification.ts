import type { Notification } from '../types';

interface CreateNotificationData {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  link?: string;
}

export class NotificationRepository {
  constructor(private db: D1Database) {}

  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const offset = (page - 1) * limit;

    const total = await this.db
      .prepare('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?')
      .bind(userId)
      .first<{ total: number }>();

    const notifications = await this.db
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(userId, limit.toString(), offset.toString())
      .all<Notification>();

    return { notifications: notifications.results, total: total?.total ?? 0 };
  }

  async create(data: CreateNotificationData): Promise<Notification> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'INSERT INTO notifications (id, user_id, type, title, message, link, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, data.user_id, data.type, data.title, data.message, data.link || null, 0, now)
      .run();

    return (await this.db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first<Notification>())!;
  }

  async markRead(id: string): Promise<void> {
    await this.db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').bind(id).run();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').bind(userId).run();
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0')
      .bind(userId)
      .first<{ count: number }>();

    return result?.count ?? 0;
  }
}
