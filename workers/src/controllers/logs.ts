import { Context } from 'hono';
import { LogRepository } from '../repositories/logs';
import { successResponse } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';
import type { Env } from '../types';

export async function listLogs(c: Context) {
  const env = c.env as Env;
  const repo = new LogRepository(env.DB);
  // projectId is optional: omitted (or 'all') means recent logs across projects.
  const rawProjectId = c.req.query('projectId');
  const projectId = rawProjectId && rawProjectId !== 'all' ? rawProjectId : undefined;
  const level = c.req.query('level');
  const search = c.req.query('search');
  const page = c.req.query('page');
  const limit = c.req.query('limit');

  const result = await repo.findByProject(
    projectId,
    level,
    search,
    page ? parseInt(page) : 1,
    limit ? parseInt(limit) : 20,
  );

  return c.json(successResponse(result));
}

export async function createLog(c: Context) {
  const env = c.env as Env;
  const userId = (c.get('userId') as string) || 'unknown';
  const body = await c.req.json().catch(() => ({})) as { project_id?: string; projectId?: string; action?: string; details?: string };
  const projectId = body.project_id ?? body.projectId;
  const action = (body.action || 'info').toLowerCase();
  if (!['info', 'warn', 'error'].includes(action)) {
    throw new ValidationError('action must be one of info, warn, error');
  }
  const repo = new LogRepository(env.DB);
  const log = await repo.create({
    user_id: userId,
    project_id: projectId || 'default',
    action,
    details: (body.details || '').slice(0, 2000) || undefined,
  });
  return c.json(successResponse(log, 'Log recorded'), 201);
}

export async function listErrors(c: Context) {
  const env = c.env as Env;
  const repo = new LogRepository(env.DB);
  const rawProjectId = c.req.query('projectId');
  const projectId = rawProjectId && rawProjectId !== 'all' ? rawProjectId : undefined;
  const severity = c.req.query('severity');
  const status = c.req.query('status');
  const page = c.req.query('page');
  const limit = c.req.query('limit');

  const result = await repo.getErrors(
    projectId,
    severity,
    status,
    page ? parseInt(page) : 1,
    limit ? parseInt(limit) : 20,
  );

  return c.json(successResponse(result));
}

export async function createError(c: Context) {
  const env = c.env as Env;
  const body = await c.req.json().catch(() => ({})) as {
    project_id?: string; projectId?: string; title?: string;
    message?: string; stack_trace?: string; stackTrace?: string; severity?: string;
  };
  const projectId = body.project_id ?? body.projectId;
  const title = (body.title || '').trim().slice(0, 200);
  const message = (body.message || '').trim().slice(0, 10000);
  if (!projectId) throw new ValidationError('project_id is required');
  if (!title) throw new ValidationError('title is required');
  if (!message) throw new ValidationError('message is required');
  const severity = (body.severity || 'medium').toLowerCase();
  if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
    throw new ValidationError('severity must be one of critical, high, medium, low');
  }

  const repo = new LogRepository(env.DB);
  // Dedupe: a repeated failure bumps the existing open error's count
  // instead of flooding the Errors tab with identical rows.
  const existing = await repo.findOpenByTitle(projectId, title);
  if (existing) {
    await repo.incrementErrorCount(existing.id);
    const updated = await repo.updateError(existing.id, {
      message,
      stack_trace: body.stack_trace ?? body.stackTrace,
      severity: severity as 'critical' | 'high' | 'medium' | 'low',
    });
    return c.json(successResponse(updated, 'Error count incremented'));
  }

  const error = await repo.createError({
    project_id: projectId,
    title,
    message,
    stack_trace: body.stack_trace ?? body.stackTrace,
    severity: severity as 'critical' | 'high' | 'medium' | 'low',
  });
  return c.json(successResponse(error, 'Error recorded'), 201);
}

export async function updateErrorStatus(c: Context) {
  const env = c.env as Env;
  const repo = new LogRepository(env.DB);
  const id = c.req.param('id')!;
  const { status: newStatus } = await c.req.json();

  const error = await repo.updateError(id, { status: newStatus });
  if (!error) throw new NotFoundError('Error not found');

  return c.json(successResponse(error, 'Error status updated'));
}
