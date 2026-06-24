import type { Context } from 'hono';
import type { Env } from '../types';
import { success, fail } from '../utils/helpers';
import { assertProjectMember } from '../utils/access';

// Resolve which Durable Object id this terminal request should use.
//  - A real project id  -> `terminal-<projectId>` (caller must be a project member).
//  - The "default" id    -> `terminal-user-<userId>`, i.e. a PER-USER terminal.
// Per-user keying both (a) closes the cross-tenant IDOR where everyone shared the
// single `terminal-default` DO, and (b) shards the single-threaded DO per user.
// The installed agent connects with the same user's token + projectId=default, so
// it resolves to the same id and the relay still works.
async function resolveTerminalKey(c: Context<{ Bindings: Env }>, projectId: string | undefined, userId: string): Promise<string> {
  if (projectId && projectId !== 'default') {
    await assertProjectMember(c.env.DB, projectId, userId);
    return `terminal-${projectId}`;
  }
  return `terminal-user-${userId}`;
}

export async function createSession(c: Context<{ Bindings: Env }>) {
  try {
    const userId = c.get('userId') as string;
    const { projectId } = await c.req.json<{ projectId: string }>();

    const key = await resolveTerminalKey(c, projectId, userId);
    const id = c.env.TERMINAL_DO.idFromName(key);
    const stub = c.env.TERMINAL_DO.get(id);

    const response = await stub.fetch('http://do/session', {
      method: 'POST',
      body: JSON.stringify({ projectId: projectId ?? 'default' }),
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
    const userId = c.get('userId') as string;
    const sessionId = c.req.query('sessionId') || 'default';
    const projectId = c.req.query('projectId');

    const key = await resolveTerminalKey(c, projectId, userId);
    const doId = c.env.TERMINAL_DO.idFromName(key);
    const stub = c.env.TERMINAL_DO.get(doId);

    const url = new URL('http://do/ws');
    url.searchParams.set('sessionId', sessionId);
    url.searchParams.set('projectId', projectId || 'default');

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
    const userId = c.get('userId') as string;
    const sessionId = c.req.query('sessionId') || 'default';
    const projectId = c.req.query('projectId');

    const key = await resolveTerminalKey(c, projectId, userId);
    const doId = c.env.TERMINAL_DO.idFromName(key);
    const stub = c.env.TERMINAL_DO.get(doId);

    const url = new URL('http://do/history');
    url.searchParams.set('sessionId', sessionId);

    const response = await stub.fetch(url.toString(), {
      method: 'GET',
    });

    const result = await response.json();
    return success(c, result);
  } catch (err) {
    return fail(c, err);
  }
}
