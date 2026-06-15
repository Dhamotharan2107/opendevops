import type { AITestRun } from '../types';

interface CreateAITestRunData {
  project_id: string;
  prompt: string;
  created_by: string;
}

interface UpdateAITestRunData {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  results?: string;
}

export class AITestRepository {
  constructor(private db: D1Database) {}

  async findByProject(
    projectId: string,
    page = 1,
    limit = 20,
  ): Promise<{ runs: AITestRun[]; total: number }> {
    const offset = (page - 1) * limit;

    const total = await this.db
      .prepare('SELECT COUNT(*) as total FROM ai_test_runs WHERE project_id = ?')
      .bind(projectId)
      .first<{ total: number }>();

    const runs = await this.db
      .prepare('SELECT * FROM ai_test_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(projectId, limit.toString(), offset.toString())
      .all<AITestRun>();

    return { runs: runs.results, total: total?.total ?? 0 };
  }

  async findById(id: string): Promise<AITestRun | null> {
    return this.db
      .prepare('SELECT * FROM ai_test_runs WHERE id = ?')
      .bind(id)
      .first<AITestRun>();
  }

  async create(data: CreateAITestRunData): Promise<AITestRun> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'INSERT INTO ai_test_runs (id, project_id, prompt, status, results, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, data.project_id, data.prompt, 'pending', null, data.created_by, now)
      .run();

    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateAITestRunData): Promise<AITestRun | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.results !== undefined) { fields.push('results = ?'); values.push(data.results); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);

    await this.db
      .prepare(`UPDATE ai_test_runs SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return this.findById(id);
  }
}
