import type { Context } from 'hono';
import { BugRepository } from '../repositories/bug';
import { success, fail } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { Env } from '../types';

export async function reportBug(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json<{
      project_id: string;
      title: string;
      description: string;
      screenshot_url?: string;
      video_url?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'open' | 'in-progress' | 'testing' | 'fixed' | 'closed';
      assigned_to?: string;
    }>();

    if (!body.project_id) throw new ValidationError('project_id is required');
    if (!body.title?.trim()) throw new ValidationError('Bug title is required');
    if (!body.description?.trim()) throw new ValidationError('Bug description is required');

    const repo = new BugRepository(c.env.DB);
    const bug = await repo.create({
      project_id: body.project_id,
      title: body.title.trim(),
      description: body.description.trim(),
      screenshot_url: body.screenshot_url,
      video_url: body.video_url,
      priority: body.priority ?? 'medium',
      status: body.status ?? 'open',
      assigned_to: body.assigned_to,
      created_by: userId,
    });

    return success(c, bug, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function listBugs(c: Context<{ Bindings: Env }>) {
  try {
    const projectId = c.req.query('project_id');
    if (!projectId) throw new ValidationError('project_id query parameter is required');

    const repo = new BugRepository(c.env.DB);
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const page = parseInt(c.req.query('page') ?? '1', 10);
    const limit = parseInt(c.req.query('limit') ?? '20', 10);

    const result = await repo.findByProject(projectId, status, priority, page, limit);
    return success(c, result);
  } catch (e) {
    return fail(c, e);
  }
}

export async function getBug(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const repo = new BugRepository(c.env.DB);
    const bug = await repo.findById(id);
    if (!bug) throw new NotFoundError('Bug');
    const comments = await repo.getComments(id);
    return success(c, { bug, comments });
  } catch (e) {
    return fail(c, e);
  }
}

export async function updateBug(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const body = await c.req.json<{
      title?: string;
      description?: string;
      screenshot_url?: string | null;
      video_url?: string | null;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'open' | 'in-progress' | 'testing' | 'fixed' | 'closed';
      assigned_to?: string | null;
    }>();

    const repo = new BugRepository(c.env.DB);
    const bug = await repo.update(id, body);
    if (!bug) throw new NotFoundError('Bug');
    return success(c, bug);
  } catch (e) {
    return fail(c, e);
  }
}

export async function deleteBug(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const repo = new BugRepository(c.env.DB);
    const bug = await repo.findById(id);
    if (!bug) throw new NotFoundError('Bug');
    await repo.delete(id);
    return success(c, { message: 'Bug deleted' });
  } catch (e) {
    return fail(c, e);
  }
}

export async function addBugComment(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const bugId = c.req.param('id')!;
    const body = await c.req.json<{ text: string }>();

    if (!body.text?.trim()) throw new ValidationError('Comment text is required');

    const repo = new BugRepository(c.env.DB);
    const bug = await repo.findById(bugId);
    if (!bug) throw new NotFoundError('Bug');

    const comment = await repo.addComment({
      bug_id: bugId,
      user_id: userId,
      text: body.text.trim(),
    });

    return success(c, comment, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function getBugComments(c: Context<{ Bindings: Env }>) {
  try {
    const bugId = c.req.param('id')!;
    const repo = new BugRepository(c.env.DB);
    const bug = await repo.findById(bugId);
    if (!bug) throw new NotFoundError('Bug');
    const comments = await repo.getComments(bugId);
    return success(c, comments);
  } catch (e) {
    return fail(c, e);
  }
}
