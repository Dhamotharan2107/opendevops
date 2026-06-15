import type { Context } from 'hono';
import type { Env } from '../types';
import { success, fail, paginated } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';
import { DeploymentRepository } from '../repositories/deployment';

export async function createDeployment(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const { project_id, branch, commit_hash, commit_message } = await c.req.json<{
      project_id: string;
      branch: string;
      commit_hash?: string;
      commit_message?: string;
    }>();

    if (!project_id || !branch) {
      return fail(c, new Error('project_id and branch are required'), 400);
    }

    const repo = new DeploymentRepository(c.env.DB);

    const latestDeployment = await repo.getLatest(project_id);
    const nextVersion = latestDeployment
      ? incrementVersion(latestDeployment.version)
      : 'v1.0.0';

    const deployment = await repo.create({
      id: crypto.randomUUID(),
      project_id,
      version: nextVersion,
      commit_hash: commit_hash ?? undefined,
      commit_message: commit_message ?? undefined,
      branch,
      status: 'pending',
      logs: undefined,
      created_by: userId,
    });

    return success(c, deployment, 201);
  } catch (err) {
    return fail(c, err);
  }
}

export async function listDeployments(c: Context<{ Bindings: Env }>) {
  try {
    const projectId = c.req.query('projectId');
    const page = parseInt(c.req.query('page') ?? '1', 10);
    const limit = Math.min(parseInt(c.req.query('limit') ?? '10', 10), 50);

    if (!projectId) {
      return fail(c, new Error('projectId query parameter is required'), 400);
    }

    const repo = new DeploymentRepository(c.env.DB);
    const result = await repo.findByProject(projectId, page, limit);

    return paginated(c, result.deployments, result.total, page, limit);
  } catch (err) {
    return fail(c, err);
  }
}

export async function getDeployment(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const repo = new DeploymentRepository(c.env.DB);
    const deployment = await repo.findById(id);

    if (!deployment) {
      throw new NotFoundError('Deployment not found');
    }

    return success(c, deployment);
  } catch (err) {
    return fail(c, err);
  }
}

export async function updateDeployment(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const repo = new DeploymentRepository(c.env.DB);

    const existing = await repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Deployment not found');
    }

    const { status, logs } = await c.req.json<{
      status?: 'pending' | 'building' | 'success' | 'failed';
      logs?: string;
    }>();

    await repo.update(id, { status, logs });

    const updated = await repo.findById(id);
    return success(c, updated);
  } catch (err) {
    return fail(c, err);
  }
}

function incrementVersion(version: string): string {
  const match = version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return 'v1.0.0';

  const [major, minor, patch] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  return `v${major}.${minor}.${patch + 1}`;
}
