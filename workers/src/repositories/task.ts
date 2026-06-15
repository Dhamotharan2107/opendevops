import type { Task, TaskComment } from '../types';
import { generateId, now } from '../utils/helpers';

export class TaskRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<Task | null> {
    const result = await this.db.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first<Task>();
    return result ?? null;
  }

  async findByProject(
    projectId: string,
    status?: string,
    priority?: string,
    assigneeId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ tasks: Task[]; total: number }> {
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
    if (assigneeId) {
      conditions.push('assignee_id = ?');
      params.push(assigneeId);
    }

    const where = conditions.join(' AND ');
    const offset = (page - 1) * limit;

    const tasks = await this.db.prepare(
      `SELECT * FROM tasks WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ).bind(...params, limit, offset).all<Task>();

    const totalResult = await this.db.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE ${where}`,
    ).bind(...params).first<{ count: number }>();

    return { tasks: tasks.results, total: totalResult?.count ?? 0 };
  }

  async create(data: {
    project_id: string;
    title: string;
    description?: string;
    assignee_id?: string;
    due_date?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in-progress' | 'testing' | 'done';
    created_by: string;
  }): Promise<Task> {
    const task: Task = {
      id: generateId(),
      project_id: data.project_id,
      title: data.title,
      description: data.description ?? undefined,
      assignee_id: data.assignee_id ?? undefined,
      due_date: data.due_date ?? undefined,
      priority: data.priority,
      status: data.status,
      created_by: data.created_by,
      created_at: now(),
      updated_at: now(),
    };
    await this.db.prepare(
      `INSERT INTO tasks (id, project_id, title, description, assignee_id, due_date, priority, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      task.id, task.project_id, task.title, task.description,
      task.assignee_id, task.due_date, task.priority, task.status,
      task.created_by, task.created_at, task.updated_at,
    ).run();
    return task;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      assignee_id: string | null;
      due_date: string | null;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      status: 'todo' | 'in-progress' | 'testing' | 'done';
    }>,
  ): Promise<Task | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.assignee_id !== undefined) { fields.push('assignee_id = ?'); params.push(data.assignee_id); }
    if (data.due_date !== undefined) { fields.push('due_date = ?'); params.push(data.due_date); }
    if (data.priority !== undefined) { fields.push('priority = ?'); params.push(data.priority); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    fields.push('updated_at = ?');
    params.push(now());
    params.push(id);

    await this.db.prepare(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
    ).bind(...params).run();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
    return result.success;
  }

  async addComment(data: { task_id: string; user_id: string; text: string }): Promise<TaskComment> {
    const comment: TaskComment = {
      id: generateId(),
      task_id: data.task_id,
      user_id: data.user_id,
      text: data.text,
      created_at: now(),
    };
    await this.db.prepare(
      'INSERT INTO task_comments (id, task_id, user_id, text, created_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(comment.id, comment.task_id, comment.user_id, comment.text, comment.created_at).run();
    return comment;
  }

  async getComments(taskId: string): Promise<TaskComment[]> {
    const result = await this.db.prepare(
      'SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC',
    ).bind(taskId).all<TaskComment>();
    return result.results;
  }
}
