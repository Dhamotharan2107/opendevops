import type { D1Database } from '@cloudflare/workers-types';
import type { Deployment } from '../types';

export class DeploymentRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async findById(id: string): Promise<Deployment | null> {
    const result = await this.db
      .prepare('SELECT * FROM deployments WHERE id = ?')
      .bind(id)
      .first<Deployment>();
    return result ?? null;
  }

  async findByProject(
    projectId: string,
    page = 1,
    limit = 10
  ): Promise<{ deployments: Deployment[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await this.db
      .prepare('SELECT COUNT(*) as total FROM deployments WHERE project_id = ?')
      .bind(projectId)
      .first<{ total: number }>();
    const total = countResult?.total ?? 0;

    const deployments = await this.db
      .prepare(
        'SELECT * FROM deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .bind(projectId, limit, offset)
      .all<Deployment>();

    return { deployments: deployments.results, total };
  }

  async create(data: Omit<Deployment, 'created_at'>): Promise<Deployment> {
    const now = new Date().toISOString();
    await this.db
      .prepare(
        `INSERT INTO deployments (id, project_id, version, commit_hash, commit_message, branch, status, logs, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.project_id,
        data.version,
        data.commit_hash ?? null,
        data.commit_message ?? null,
        data.branch,
        data.status,
        data.logs ?? null,
        data.created_by,
        now
      )
      .run();

    return { ...data, created_at: now };
  }

  async update(
    id: string,
    data: Partial<Pick<Deployment, 'status' | 'logs' | 'version' | 'commit_hash' | 'commit_message'>>
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];

    if (data.status !== undefined) {
      sets.push('status = ?');
      values.push(data.status);
    }
    if (data.logs !== undefined) {
      sets.push('logs = ?');
      values.push(data.logs);
    }
    if (data.version !== undefined) {
      sets.push('version = ?');
      values.push(data.version);
    }
    if (data.commit_hash !== undefined) {
      sets.push('commit_hash = ?');
      values.push(data.commit_hash);
    }
    if (data.commit_message !== undefined) {
      sets.push('commit_message = ?');
      values.push(data.commit_message);
    }

    if (sets.length === 0) return;

    values.push(id);
    await this.db
      .prepare(`UPDATE deployments SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  async getLatest(projectId: string): Promise<Deployment | null> {
    const result = await this.db
      .prepare(
        'SELECT * FROM deployments WHERE project_id = ? ORDER BY created_at DESC LIMIT 1'
      )
      .bind(projectId)
      .first<Deployment>();
    return result ?? null;
  }
}
