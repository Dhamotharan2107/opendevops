import type { Bug, BugComment } from '../types';
import { generateId, now } from '../utils/helpers';

export class BugRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<Bug | null> {
    const result = await this.db.prepare('SELECT * FROM bugs WHERE id = ?').bind(id).first<Bug>();
    return result ?? null;
  }

  async findByProject(
    projectId: string,
    status?: string,
    priority?: string,
    page = 1,
    limit = 20,
  ): Promise<{ bugs: Bug[]; total: number }> {
    const conditions: string[] = ['project_id = ?'];
    const params: unknown[] = [projectId];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }

    const where = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const bugs = await this.db.prepare(
      `SELECT * FROM bugs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ).bind(...params, limit, offset).all<Bug>();

    const totalResult = await this.db.prepare(
      `SELECT COUNT(*) as count FROM bugs WHERE ${where}`,
    ).bind(...params).first<{ count: number }>();

    return { bugs: bugs.results, total: totalResult?.count ?? 0 };
  }

  async create(data: {
    project_id: string;
    title: string;
    description: string;
    screenshot_url?: string;
    video_url?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in-progress' | 'testing' | 'fixed' | 'closed';
    assigned_to?: string;
    created_by: string;
  }): Promise<Bug> {
    const bug: Bug = {
      id: generateId(),
      project_id: data.project_id,
      title: data.title,
      description: data.description,
      screenshot_url: data.screenshot_url ?? undefined,
      video_url: data.video_url ?? undefined,
      priority: data.priority,
      status: data.status,
      assigned_to: data.assigned_to ?? undefined,
      created_by: data.created_by,
      created_at: now(),
      updated_at: now(),
    };
    await this.db.prepare(
      `INSERT INTO bugs (id, project_id, title, description, screenshot_url, video_url, priority, status, assigned_to, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      bug.id, bug.project_id, bug.title, bug.description,
      bug.screenshot_url, bug.video_url, bug.priority, bug.status,
      bug.assigned_to, bug.created_by, bug.created_at, bug.updated_at,
    ).run();
    return bug;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      screenshot_url: string | null;
      video_url: string | null;
      priority: 'low' | 'medium' | 'high' | 'critical';
      status: 'open' | 'in-progress' | 'testing' | 'fixed' | 'closed';
      assigned_to: string | null;
    }>,
  ): Promise<Bug | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.screenshot_url !== undefined) { fields.push('screenshot_url = ?'); params.push(data.screenshot_url); }
    if (data.video_url !== undefined) { fields.push('video_url = ?'); params.push(data.video_url); }
    if (data.priority !== undefined) { fields.push('priority = ?'); params.push(data.priority); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.assigned_to !== undefined) { fields.push('assigned_to = ?'); params.push(data.assigned_to); }

    fields.push('updated_at = ?');
    params.push(now());
    params.push(id);

    await this.db.prepare(
      `UPDATE bugs SET ${fields.join(', ')} WHERE id = ?`,
    ).bind(...params).run();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM bugs WHERE id = ?').bind(id).run();
    return result.success;
  }

  async addComment(data: { bug_id: string; user_id: string; text: string }): Promise<BugComment> {
    const comment: BugComment = {
      id: generateId(),
      bug_id: data.bug_id,
      user_id: data.user_id,
      text: data.text,
      created_at: now(),
    };
    await this.db.prepare(
      'INSERT INTO bug_comments (id, bug_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(comment.id, comment.bug_id, comment.user_id, comment.text, comment.created_at).run();
    return comment;
  }

  async getComments(bugId: string): Promise<BugComment[]> {
    const result = await this.db.prepare(
      'SELECT * FROM bug_comments WHERE bug_id = ? ORDER BY created_at ASC',
    ).bind(bugId).all<BugComment>();
    return result.results;
  }
}
