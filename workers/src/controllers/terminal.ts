import type { Context } from 'hono';
import type { Env } from '../types';
import { success, fail } from '../utils/helpers';

export async function createSession(c: Context<{ Bindings: Env }>) {
  try {
    const { projectId } = await c.req.json<{ projectId: string }>();
    if (!projectId) {
      return fail(c, new Error('projectId is required'), 400);
    }

    const id = c.env.TERMINAL_DO.idFromName(`terminal-${projectId}`);
    const stub = c.env.TERMINAL_DO.get(id);

    const response = await stub.fetch('http://do/session', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });

    const result = await response.json<{ success: boolean; data?: { sessionId: string }; error?: string }>();

    if (!result.success) {
      return fail(c, new Error(result.error ?? 'Failed to create session'), 500);
    }

    return success(c, result.data, 201);
  } catch (err) {
    return fail(c, err);
  }
}

export async function getWebSocket(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const projectId = c.req.query('projectId');

    if (!projectId) {
      return fail(c, new Error('projectId query parameter is required'), 400);
    }

    const doId = c.env.TERMINAL_DO.idFromName(`terminal-${projectId}`);
    const stub = c.env.TERMINAL_DO.get(doId);

    const url = new URL('http://do/ws');
    url.searchParams.set('sessionId', id);

    const response = await stub.fetch(url.toString(), {
      headers: {
        Upgrade: 'websocket',
      },
    });

    return response;
  } catch (err) {
    return fail(c, err);
  }
}

export async function getHistory(c: Context<{ Bindings: Env }>) {
  try {
    const id = c.req.param('id')!;
    const projectId = c.req.query('projectId');

    if (!projectId) {
      return fail(c, new Error('projectId query parameter is required'), 400);
    }

    const doId = c.env.TERMINAL_DO.idFromName(`terminal-${projectId}`);
    const stub = c.env.TERMINAL_DO.get(doId);

    const history = await stub.fetch('http://do/history', {
      method: 'GET',
    });

    const result = await history.json();
    return success(c, result);
  } catch (err) {
    return fail(c, err);
  }
}
