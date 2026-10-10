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
    projectId?: string,
    level?: string,
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<{ logs: ActivityLog[]; total: number }> {
    const offset = (page - 1) * limit;
    // projectId is optional: the global Logs page passes none to see recent
    // activity across all projects. Per-project tabs pass their project id.
    const clauses: string[] = [];
    const params: string[] = [];

    if (projectId) {
      clauses.push('project_id = ?');
      params.push(projectId);
    }

    if (level) {
      clauses.push('action = ?');
      params.push(level);
    }

    if (search) {
      clauses.push('(details LIKE ? OR action LIKE ?)');
      const pattern = `%${search}%`;
      params.push(pattern, pattern);
    }

    const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
    const countQuery = 'SELECT COUNT(*) as total FROM activity_logs' + where;
    const query = 'SELECT * FROM activity_logs' + where + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

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

    // Build the row in memory instead of a second SELECT round trip.
    return {
      id,
      user_id: data.user_id,
      project_id: data.project_id,
      action: data.action,
      details: data.details,
      created_at: now,
    };
  }

  async getErrors(
    projectId?: string,
    severity?: string,
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<{ errors: ErrorLog[]; total: number }> {
    const offset = (page - 1) * limit;
    const clauses: string[] = [];
    const params: string[] = [];

    if (projectId) {
      clauses.push('project_id = ?');
      params.push(projectId);
    }

    if (severity) {
      clauses.push('severity = ?');
      params.push(severity);
    }

    if (status) {
      clauses.push('status = ?');
      params.push(status);
    }

    const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
    const countQuery = 'SELECT COUNT(*) as total FROM error_logs' + where;
    const query = 'SELECT * FROM error_logs' + where + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

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

  async findOpenByTitle(projectId: string, title: string): Promise<ErrorLog | null> {
    return this.db
      .prepare(
        "SELECT * FROM error_logs WHERE project_id = ? AND title = ? AND status IN ('open', 'investigating') ORDER BY updated_at DESC LIMIT 1",
      )
      .bind(projectId, title)
      .first<ErrorLog>();
  }
}
