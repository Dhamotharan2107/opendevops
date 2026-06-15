import type { D1Database } from '@cloudflare/workers-types';
import type { Connection } from '../types';
import { NotFoundError } from '../utils/errors';
import { generateId, now } from '../utils/helpers';

export class ConnectionRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<Connection | null> {
    return this.db.prepare('SELECT * FROM connections WHERE id = ?').bind(id).first<Connection>();
  }

  async findByUsers(requesterId: string, receiverId: string): Promise<Connection | null> {
    return this.db
      .prepare(
        'SELECT * FROM connections WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)'
      )
      .bind(requesterId, receiverId, receiverId, requesterId)
      .first<Connection>();
  }

  async findByUser(userId: string, status?: Connection['status'], page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const params: string[] = [userId, userId];

    let countSql = 'SELECT COUNT(*) as total FROM connections WHERE (requester_id = ? OR receiver_id = ?)';
    let sql = 'SELECT * FROM connections WHERE (requester_id = ? OR receiver_id = ?)';

    if (status) {
      countSql += ' AND status = ?';
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = await this.db.prepare(countSql).bind(...params).first<{ total: number }>();
    const connections = await this.db
      .prepare(sql)
      .bind(...params, limit.toString(), offset.toString())
      .all<Connection>();

    return { connections: connections.results, total: total?.total ?? 0 };
  }

  async findPendingForUser(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const total = await this.db
      .prepare('SELECT COUNT(*) as total FROM connections WHERE receiver_id = ? AND status = ?')
      .bind(userId, 'pending')
      .first<{ total: number }>();

    const connections = await this.db
      .prepare('SELECT * FROM connections WHERE receiver_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(userId, 'pending', limit.toString(), offset.toString())
      .all<Connection>();

    return { connections: connections.results, total: total?.total ?? 0 };
  }

  async findSentByUser(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const total = await this.db
      .prepare('SELECT COUNT(*) as total FROM connections WHERE requester_id = ? AND status = ?')
      .bind(userId, 'pending')
      .first<{ total: number }>();

    const connections = await this.db
      .prepare('SELECT * FROM connections WHERE requester_id = ? AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(userId, 'pending', limit.toString(), offset.toString())
      .all<Connection>();

    return { connections: connections.results, total: total?.total ?? 0 };
  }

  async create(data: { requester_id: string; receiver_id: string }) {
    const id = generateId();
    const timestamp = now();

    await this.db
      .prepare(
        'INSERT INTO connections (id, requester_id, receiver_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(id, data.requester_id, data.receiver_id, 'pending', timestamp, timestamp)
      .run();

    const connection = await this.findById(id);
    if (!connection) throw new NotFoundError('Connection not found after creation');
    return connection;
  }

  async update(id: string, data: { status: 'pending' | 'accepted' | 'rejected' }) {
    const timestamp = now();
    const result = await this.db
      .prepare('UPDATE connections SET status = ?, updated_at = ? WHERE id = ?')
      .bind(data.status, timestamp, id)
      .run();

    if (result.meta.changes === 0) throw new NotFoundError('Connection not found');

    const connection = await this.findById(id);
    if (!connection) throw new NotFoundError('Connection not found');
    return connection;
  }

  async remove(id: string) {
    const result = await this.db.prepare('DELETE FROM connections WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) throw new NotFoundError('Connection not found');
  }
}
