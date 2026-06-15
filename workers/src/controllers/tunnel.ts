import type { Context } from 'hono';
import type { Env } from '../types';
import { success, fail } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';

async function getProject(c: Context<{ Bindings: Env }>, projectId: string) {
  const project = await c.env.DB
    .prepare('SELECT * FROM projects WHERE id = ?')
    .bind(projectId)
    .first<{ id: string; name: string; tunnel_url?: string }>();
  return project ?? null;
}

export async function startTunnel(c: Context<{ Bindings: Env }>) {
  try {
    const { projectId, port } = await c.req.json<{ projectId: string; port?: number }>();

    if (!projectId) {
      return fail(c, new Error('projectId is required'), 400);
    }

    const project = await getProject(c, projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const tunnelPort = port ?? 3000;
    const tunnelSubdomain = `opendrap-${projectId.slice(0, 8)}`;
    const tunnelUrl = `https://${tunnelSubdomain}.trycloudflare.com`;

    await c.env.DB
      .prepare('UPDATE projects SET tunnel_url = ?, updated_at = ? WHERE id = ?')
      .bind(tunnelUrl, new Date().toISOString(), projectId)
      .run();

    return success(c, {
      tunnel_url: tunnelUrl,
      port: tunnelPort,
      subdomain: tunnelSubdomain,
    });
  } catch (err) {
    return fail(c, err);
  }
}

export async function stopTunnel(c: Context<{ Bindings: Env }>) {
  try {
    const { projectId } = await c.req.json<{ projectId: string }>();

    if (!projectId) {
      return fail(c, new Error('projectId is required'), 400);
    }

    const project = await getProject(c, projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    await c.env.DB
      .prepare('UPDATE projects SET tunnel_url = NULL, updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), projectId)
      .run();

    return success(c, { tunnel_url: null });
  } catch (err) {
    return fail(c, err);
  }
}

export async function getTunnelStatus(c: Context<{ Bindings: Env }>) {
  try {
    const projectId = c.req.query('projectId');

    if (!projectId) {
      return fail(c, new Error('projectId query parameter is required'), 400);
    }

    const project = await getProject(c, projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isActive = !!project.tunnel_url;

    return success(c, {
      project_id: projectId,
      active: isActive,
      tunnel_url: project.tunnel_url,
    });
  } catch (err) {
    return fail(c, err);
  }
}
