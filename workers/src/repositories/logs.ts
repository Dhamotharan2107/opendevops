import type { ActivityLog, ErrorLog } from '../types';

export interface CreateLogData {
  user_id: string;
  project_id?: string;
  action: string;
  details?: string;
}

export interface CreateErrorData {
  project_id: string;
  title: string;
  message: string;
  stack_trace?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface UpdateErrorData {
  status?: 'open' | 'investigating' | 'resolved';
  title?: string;
  message?: string;
  stack_trace?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

export class LogRepository {
  constructor(private db: D1Database) {}

  async findByProject(
    projectId: string,
    level?: string,
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    const offset = (page - 1) * limit;
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE project_id = ?';
    let query = 'SELECT * FROM activity_logs WHERE project_id = ?';
    const params: string[] = [projectId];

    if (level) {
      countQuery += ' AND action = ?';
      query += ' AND action = ?';
      params.push(level);
    }

    if (search) {
      countQuery += ' AND (details LIKE ? OR action LIKE ?)';
      query += ' AND (details LIKE ? OR action LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const logs = await this.db
      .prepare(query)
      .bind(...params, limit.toString(), offset.toString())
      .all<ActivityLog>();

    return { logs: logs.results, total: total?.total ?? 0 };
  }

  async create(data: CreateLogData): Promise<ActivityLog> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'INSERT INTO activity_logs (id, user_id, project_id, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .bind(id, data.user_id, data.project_id || null, data.action, data.details || null, now)
      .run();

    return (await this.db.prepare('SELECT * FROM activity_logs WHERE id = ?').bind(id).first<ActivityLog>())!;
  }

  async getErrors(
    projectId: string,
    severity?: string,
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<{ errors: ErrorLog[]; total: number }> {
    const offset = (page - 1) * limit;
    let countQuery = 'SELECT COUNT(*) as total FROM error_logs WHERE project_id = ?';
    let query = 'SELECT * FROM error_logs WHERE project_id = ?';
    const params: string[] = [projectId];

    if (severity) {
      countQuery += ' AND severity = ?';
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (status) {
      countQuery += ' AND status = ?';
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = await this.db.prepare(countQuery).bind(...params).first<{ total: number }>();
    const errors = await this.db
      .prepare(query)
      .bind(...params, limit.toString(), offset.toString())
      .all<ErrorLog>();

    return { errors: errors.results, total: total?.total ?? 0 };
  }

  async createError(data: CreateErrorData): Promise<ErrorLog> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'INSERT INTO error_logs (id, project_id, title, message, stack_trace, severity, status, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        id, data.project_id, data.title, data.message,
        data.stack_trace || null, data.severity, 'open', 1, now, now,
      )
      .run();

    return (await this.db.prepare('SELECT * FROM error_logs WHERE id = ?').bind(id).first<ErrorLog>())!;
  }

  async updateError(id: string, data: UpdateErrorData): Promise<ErrorLog | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.message !== undefined) { fields.push('message = ?'); values.push(data.message); }
    if (data.stack_trace !== undefined) { fields.push('stack_trace = ?'); values.push(data.stack_trace); }
    if (data.severity !== undefined) { fields.push('severity = ?'); values.push(data.severity); }

    if (fields.length === 0) {
      return this.db.prepare('SELECT * FROM error_logs WHERE id = ?').bind(id).first<ErrorLog>();
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db
      .prepare(`UPDATE error_logs SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return this.db.prepare('SELECT * FROM error_logs WHERE id = ?').bind(id).first<ErrorLog>();
  }

  async incrementErrorCount(id: string): Promise<void> {
    await this.db
      .prepare('UPDATE error_logs SET count = count + 1, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), id)
      .run();
  }
}
