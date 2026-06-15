import { NotificationRepository } from '../repositories/notification';
import type { Env, Notification } from '../types';

export class NotificationService {
  constructor(private env: Env) {}

  async send(data: {
    userId: string;
    type: Notification['type'];
    title: string;
    message: string;
    link?: string;
  }): Promise<Notification> {
    const repo = new NotificationRepository(this.env.DB);
    const notification = await repo.create(data);

    // Broadcast via Durable Object (best-effort)
    try {
      const doId = this.env.NOTIFICATION_DO.idFromName(data.userId);
      const stub = this.env.NOTIFICATION_DO.get(doId);
      await stub.fetch('http://do/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link,
        }),
      });
    } catch {
      // DO broadcast is best-effort, DB record already saved
    }

    return notification;
  }
}
