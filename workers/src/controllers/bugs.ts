import type { Context } from 'hono';
import { BugRepository } from '../repositories/bug';
import { success, fail } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';
import { assertProjectMember } from '../utils/access';
import { createBugSchema, updateBugSchema } from '../validators';
import type { Env } from '../types';

export async function reportBug(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();

    if (!body.project_id) throw new ValidationError('project_id is required');
    const parsed = createBugSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    // IDOR guard: caller must belong to the target project.
    await assertProjectMember(c.env.DB, body.project_id, userId);

    const repo = new BugRepository(c.env.DB);
    const bug = await repo.create({
      project_id: body.project_id,
      title: parsed.data.title.trim(),
      description: parsed.data.description.trim(),
      screenshot_url: parsed.data.screenshot_url || undefined,
      video_url: parsed.data.video_url || undefined,
      priority: parsed.data.priority ?? 'medium',
      status: 'open',
      assigned_to: parsed.data.assigned_to,
      created_by: userId,
    });

    return success(c, bug, 201);
  } catch (e) {
    return fail(c, e);
  }
}

export async function listBugs(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const projectId = c.req.query('project_id');
    if (!projectId) throw new ValidationError('project_id query parameter is required');

    await assertProjectMember(c.env.DB, projectId, userId);

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
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const repo = new BugRepository(c.env.DB);
    const bug = await repo.findById(id);
    if (!bug) throw new NotFoundError('Bug');
    await assertProjectMember(c.env.DB, bug.project_id, userId);
    const comments = await repo.getComments(id);
    return success(c, { bug, comments });
  } catch (e) {
    return fail(c, e);
  }
}

export async function updateBug(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const body = await c.req.json();
    const parsed = updateBugSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const repo = new BugRepository(c.env.DB);
    const existing = await repo.findById(id);
    if (!existing) throw new NotFoundError('Bug');
    await assertProjectMember(c.env.DB, existing.project_id, userId);

    const bug = await repo.update(id, parsed.data);
    if (!bug) throw new NotFoundError('Bug');
    return success(c, bug);
  } catch (e) {
    return fail(c, e);
  }
}

export async function deleteBug(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const id = c.req.param('id')!;
    const repo = new BugRepository(c.env.DB);
    const bug = await repo.findById(id);
    if (!bug) throw new NotFoundError('Bug');
    await assertProjectMember(c.env.DB, bug.project_id, userId);
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
    await assertProjectMember(c.env.DB, bug.project_id, userId);

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
    const userId = c.get('userId') as string;
    const bugId = c.req.param('id')!;
    const repo = new BugRepository(c.env.DB);
    const bug = await repo.findById(bugId);
    if (!bug) throw new NotFoundError('Bug');
    await assertProjectMember(c.env.DB, bug.project_id, userId);
    const comments = await repo.getComments(bugId);
    return success(c, comments);
  } catch (e) {
    return fail(c, e);
  }
}
