import { Context } from 'hono';
import { TestRepository } from '../repositories/test';
import { successResponse } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';
import type { Env } from '../types';

export async function triggerTestRun(c: Context) {
  const env = c.env as Env;
  const userId = c.get('userId');
  const { projectId, config } = await c.req.json();

  const repo = new TestRepository(env.DB);
  const run = await repo.create({ project_id: projectId, created_by: userId, config });

  // TODO: Communicate with Agent DO to trigger Playwright test execution
  // const agentDoId = env.AGENT_DO.idFromName(projectId);
  // const agentStub = env.AGENT_DO.get(agentDoId);
  // await agentStub.fetch('http://internal/run-tests', { method: 'POST', body: JSON.stringify({ runId: run.id, config }) });

  return c.json(successResponse(run, 'Test run triggered'));
}

export async function getTestRun(c: Context) {
  const env = c.env as Env;
  const id = c.req.param('id')!;

  const repo = new TestRepository(env.DB);
  const run = await repo.findById(id);
  if (!run) throw new NotFoundError('Test run not found');

  return c.json(successResponse(run));
}
