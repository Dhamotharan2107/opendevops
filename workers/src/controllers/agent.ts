import type { Context } from 'hono';
import type { Env } from '../types';
import { success, fail } from '../utils/helpers';

export async function handleAgentWebSocket(c: Context<{ Bindings: Env }>) {
  try {
    const projectId = c.req.param('projectId');
    if (!projectId) {
      return fail(c, new Error('projectId is required'), 400);
    }

    const doId = c.env.AGENT_DO.idFromName(projectId);
    const stub = c.env.AGENT_DO.get(doId);

    const url = new URL('http://do/ws');
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

export async function handleAgentCommand(c: Context<{ Bindings: Env }>) {
  try {
    const projectId = c.req.param('projectId');
    if (!projectId) {
      return fail(c, new Error('projectId is required'), 400);
    }

    const { command } = await c.req.json<{ command: string }>();
    if (!command) {
      return fail(c, new Error('command is required'), 400);
    }

    const doId = c.env.AGENT_DO.idFromName(projectId);
    const stub = c.env.AGENT_DO.get(doId);

    const response = await stub.fetch('http://do/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    const result = await response.json<{ success: boolean; data: { command_id: string; queued?: boolean }; error?: string }>();
    if (!result.success) {
      return fail(c, new Error(result.error ?? 'Failed to send command'), 500);
    }

    return success(c, result.data);
  } catch (err) {
    return fail(c, err);
  }
}

export async function handleAgentStatus(c: Context<{ Bindings: Env }>) {
  try {
    const projectId = c.req.param('projectId');
    if (!projectId) {
      return fail(c, new Error('projectId is required'), 400);
    }

    const doId = c.env.AGENT_DO.idFromName(projectId);
    const stub = c.env.AGENT_DO.get(doId);

    const response = await stub.fetch('http://do/status');
    const result = await response.json<{ success: boolean; data: unknown }>();
    if (!result.success) {
      return fail(c, new Error('Failed to get agent status'), 500);
    }

    return success(c, result.data);
  } catch (err) {
    return fail(c, err);
  }
}
