import { Context } from 'hono';
import { LogRepository } from '../repositories/logs';
import { successResponse } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';
import type { Env } from '../types';

export async function listLogs(c: Context) {
  const env = c.env as Env;
  const repo = new LogRepository(env.DB);
  const projectId = c.req.query('projectId')!;
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

export async function listErrors(c: Context) {
  const env = c.env as Env;
  const repo = new LogRepository(env.DB);
  const projectId = c.req.query('projectId')!;
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

export async function updateErrorStatus(c: Context) {
  const env = c.env as Env;
  const repo = new LogRepository(env.DB);
  const id = c.req.param('id')!;
  const { status: newStatus } = await c.req.json();

  const error = await repo.updateError(id, { status: newStatus });
  if (!error) throw new NotFoundError('Error not found');

  return c.json(successResponse(error, 'Error status updated'));
}
