import type { Context } from 'hono';
import { TaskRepository } from '../repositories/task';
import { success, fail } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';
import { assertProjectMember } from '../utils/access';
import { createTaskSchema, updateTaskSchema } from '../validators';
import type { Env } from '../types';

export async function createTask(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();

    if (!body.project_id) throw new ValidationError('project_id is required');
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    await assertProjectMember(c.env.DB, body.project_id, userId);

    const repo = new TaskRepository(c.env.DB);
    const task = await repo.create({
      project_id: body.project_id,
      title: parsed.data.title.trim(),
      description: parsed.data.description,
      assignee_id: parsed.data.assignee_id,
      due_date: parsed.data.due_date,
      priority: parsed.data.priority ?? 'medium',
      status: 'todo',
      created_by: userId,
    });

    return success(c, task, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function listTasks(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const projectId = c.req.query('project_id');
    if (!projectId) throw new ValidationError('project_id query parameter is required');

    await assertProjectMember(c.env.DB, projectId, userId);

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
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(id);
    if (!task) throw new NotFoundError('Task');
    await assertProjectMember(c.env.DB, task.project_id, userId);
    const comments = await repo.getComments(id);
    return success(c, { task, comments });
  } catch (e) {
    return fail(c, e);
  }
}

export async function updateTask(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const body = await c.req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const repo = new TaskRepository(c.env.DB);
    const existing = await repo.findById(id);
    if (!existing) throw new NotFoundError('Task');
    await assertProjectMember(c.env.DB, existing.project_id, userId);

    const task = await repo.update(id, parsed.data);
    if (!task) throw new NotFoundError('Task');
    return success(c, task);
  } catch (e) {
    return fail(c, e);
  }
}

export async function deleteTask(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(id);
    if (!task) throw new NotFoundError('Task');
    await assertProjectMember(c.env.DB, task.project_id, userId);
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
    await assertProjectMember(c.env.DB, task.project_id, userId);

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
    const userId = c.get('userId') as string;
    const taskId = c.req.param('id')!;
    const repo = new TaskRepository(c.env.DB);
    const task = await repo.findById(taskId);
    if (!task) throw new NotFoundError('Task');
    await assertProjectMember(c.env.DB, task.project_id, userId);
    const comments = await repo.getComments(taskId);
    return success(c, comments);
  } catch (e) {
    return fail(c, e);
  }
}
