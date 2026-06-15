interface TestRun {
  id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  test_results?: string;
  screenshots?: string;
  video_url?: string;
  duration?: number;
  config?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateTestRunData {
  project_id: string;
  created_by: string;
  config?: string;
}

interface UpdateTestRunData {
  status?: 'pending' | 'running' | 'completed' | 'failed';
  test_results?: string;
  screenshots?: string;
  video_url?: string;
  duration?: number;
}

export class TestRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<TestRun | null> {
    return this.db
      .prepare('SELECT * FROM test_runs WHERE id = ?')
      .bind(id)
      .first<TestRun>();
  }

  async findByProject(
    projectId: string,
    page = 1,
    limit = 20,
  ): Promise<{ runs: TestRun[]; total: number }> {
    const offset = (page - 1) * limit;

    const total = await this.db
      .prepare('SELECT COUNT(*) as total FROM test_runs WHERE project_id = ?')
      .bind(projectId)
      .first<{ total: number }>();

    const runs = await this.db
      .prepare('SELECT * FROM test_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(projectId, limit.toString(), offset.toString())
      .all<TestRun>();

    return { runs: runs.results, total: total?.total ?? 0 };
  }

  async create(data: CreateTestRunData): Promise<TestRun> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'INSERT INTO test_runs (id, project_id, status, config, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(id, data.project_id, 'pending', data.config || null, data.created_by, now, now)
      .run();

    return (await this.findById(id))!;
  }

  async update(id: string, data: UpdateTestRunData): Promise<TestRun | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.test_results !== undefined) { fields.push('test_results = ?'); values.push(data.test_results); }
    if (data.screenshots !== undefined) { fields.push('screenshots = ?'); values.push(data.screenshots); }
    if (data.video_url !== undefined) { fields.push('video_url = ?'); values.push(data.video_url); }
    if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration); }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db
      .prepare(`UPDATE test_runs SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return this.findById(id);
  }
}
