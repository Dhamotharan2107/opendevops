import type { Context } from 'hono';
import { TaskRepository } from '../repositories/task';
import { success, fail } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { Env } from '../types';

export async function createTask(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json<{
      project_id: string;
      title: string;
      description?: string;
      assignee_id?: string;
      due_date?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      status?: 'todo' | 'in-progress' | 'testing' | 'done';
    }>();

    if (!body.project_id) throw new ValidationError('project_id is required');
    if (!body.title?.trim()) throw new ValidationError('Task title is required');

    const repo = new TaskRepository(c.env.DB);
    const task = await repo.create({
      project_id: body.project_id,
      title: body.title.trim(),
      description: body.description,
      assignee_id: body.assignee_id,
      due_date: body.due_date,
      priority: body.priority ?? 'medium',
      status: body.status ?? 'todo',
      created_by: userId,
    });

    return success(c, task, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function listTasks(c: Context<{ Bindings: Env }>) {
  try {
    const projectId = c.req.query('project_id');
    if (!projectId) throw new ValidationError('project_id query parameter is required');

    const repo = new TaskRepository(c.env.DB);
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const assigneeId = c.req.query('assignee_id');
    const page = parseInt(c.req.query('page') ?? '1', 10);
    const limit = parseInt(c.req.query('limit') ?? '20', 10);

    const result = await repo.findByProject(projectId, status, priority, assigneeId, page, limit);
    return success(c, result);
  } catch (e) {
    return fail(c, e);
  }
}

export async function getTask(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(id);
    if (!task) throw new NotFoundError('Task');
    const comments = await repo.getComments(id);
    return success(c, { task, comments });
  } catch (e) {
    return fail(c, e);
  }
}

export async function updateTask(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const body = await c.req.json<{
      title?: string;
      description?: string;
      assignee_id?: string | null;
      due_date?: string | null;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      status?: 'todo' | 'in-progress' | 'testing' | 'done';
    }>();

    const repo = new TaskRepository(c.env.DB);
    const task = await repo.update(id, body);
    if (!task) throw new NotFoundError('Task');
    return success(c, task);
  } catch (e) {
    return fail(c, e);
  }
}

export async function deleteTask(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(id);
    if (!task) throw new NotFoundError('Task');
    await repo.delete(id);
    return success(c, { message: 'Task deleted' });
  } catch (e) {
    return fail(c, e);
  }
}

export async function addTaskComment(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const taskId = c.req.param('id')!;
    const body = await c.req.json<{ text: string }>();

    if (!body.text?.trim()) throw new ValidationError('Comment text is required');

    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(taskId);
    if (!task) throw new NotFoundError('Task');

    const comment = await repo.addComment({
      task_id: taskId,
      user_id: userId,
      text: body.text.trim(),
    });

    return success(c, comment, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function getTaskComments(c: Context<{ Bindings: Env }>) {
  try {
    const taskId = c.req.param('id')!;
    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(taskId);
    if (!task) throw new NotFoundError('Task');
    const comments = await repo.getComments(taskId);
    return success(c, comments);
  } catch (e) {
    return fail(c, e);
  }
}
