import type { D1Database } from '@cloudflare/workers-types';
import type { AgentSession } from '../types';

export class AgentRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async findByProject(projectId: string): Promise<AgentSession | null> {
    const result = await this.db
      .prepare('SELECT * FROM agent_sessions WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(projectId)
      .first<AgentSession>();
    return result ?? null;
  }

  async create(data: Pick<AgentSession, 'id' | 'project_id' | 'status'>): Promise<AgentSession> {
    const now = new Date().toISOString();
    await this.db
      .prepare(
        'INSERT INTO agent_sessions (id, project_id, status, last_heartbeat, created_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(data.id, data.project_id, data.status, now, now)
      .run();
    return {
      id: data.id,
      project_id: data.project_id,
      status: data.status,
      last_heartbeat: now,
      created_at: now,
    };
  }

  async update(id: string, data: Partial<Pick<AgentSession, 'status' | 'last_heartbeat'>>): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.status !== undefined) {
      sets.push('status = ?');
      values.push(data.status);
    }
    if (data.last_heartbeat !== undefined) {
      sets.push('last_heartbeat = ?');
      values.push(data.last_heartbeat);
    }

    if (sets.length === 0) return;

    values.push(id);
    await this.db
      .prepare(`UPDATE agent_sessions SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async saveLog(projectId: string, log: string): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        'INSERT INTO agent_logs (id, project_id, log, created_at) VALUES (?, ?, ?, ?)'
      )
      .bind(id, projectId, log, now)
      .run();
  }

  async saveCommandResult(
    sessionId: string,
    command: string,
    output: string,
    status: string
  ): Promise<void> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db
      .prepare(
        'INSERT INTO command_results (id, session_id, command, output, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(id, sessionId, command, output, status, now)
      .run();
  }
}
