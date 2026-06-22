import type { Env } from '../types';

interface TerminalSession {
  id: string;
  projectId: string;
  buffer: string[];
  createdAt: string;
}

const AGENT_SESSION_ID = 'agent';
const HEARTBEAT_TIMEOUT_MS = 90000;

export class TerminalDurableObject implements DurableObject {
  private state: DurableObjectState;
  private appEnv: Env;
  private sessions: Map<string, TerminalSession>;
  private websockets: Map<string, WebSocket>;
  private agentSessionId: string | null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null;
  private lastHeartbeat: number;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.appEnv = env;
    this.sessions = new Map();
    this.websockets = new Map();
    this.agentSessionId = null;
    this.heartbeatTimer = null;
    this.lastHeartbeat = 0;
    // Restore persisted agent status on cold start
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<string>('agentSessionId');
      const lastHb = await this.state.storage.get<number>('lastHeartbeat');
      if (stored) {
        this.agentSessionId = stored;
        // Only consider agent online if heartbeat was recent (within 3 minutes)
        if (lastHb && (Date.now() - lastHb) < 180000) {
          this.lastHeartbeat = lastHb;
        } else {
          // Heartbeat too old, mark offline
          this.agentSessionId = null;
          await this.state.storage.delete('agentSessionId');
          await this.state.storage.delete('lastHeartbeat');
        }
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/ws') {
      return this.handleWebSocketUpgrade(request);
    }

    if (request.method === 'POST' && url.pathname === '/session') {
      return this.handleCreateSession(request);
    }

    if (request.method === 'GET' && url.pathname === '/history') {
      return this.handleGetHistory(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const sessionId = new URL(request.url).searchParams.get('sessionId') || 'default';
    const projectId = new URL(request.url).searchParams.get('projectId') || '';

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.websockets.set(sessionId, server);

    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        projectId,
        buffer: [],
        createdAt: new Date().toISOString(),
      };
      this.sessions.set(sessionId, session);
    }
    for (const line of session.buffer) {
      try {
        server.send(JSON.stringify({ type: 'terminal_output', data: line }));
      } catch {}
    }

    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleMessage(sessionId, projectId, data, server);
      } catch {
        server.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(sessionId, server);
    });

    server.addEventListener('error', () => {
      this.handleDisconnect(sessionId, server);
    });

    server.send(JSON.stringify({
      type: 'session_ready',
      sessionId,
      isAgent: sessionId === AGENT_SESSION_ID,
      agentConnected: this.agentSessionId !== null,
      hostname: this.agentSessionId ? 'cloudshell' : undefined,
      cwd: this.agentSessionId ? '~' : undefined,
    }));

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleDisconnect(sessionId: string, ws: WebSocket): void {
    this.websockets.delete(sessionId);

    if (this.agentSessionId === sessionId) {
      this.agentSessionId = null;
      this.lastHeartbeat = 0;
      this.state.storage.delete('agentSessionId');
      this.state.storage.delete('lastHeartbeat');
      this.clearHeartbeatTimer();
      this.broadcastToBrowsers(JSON.stringify({
        type: 'agent_disconnected',
        message: 'Agent went offline',
      }), sessionId);
    }
  }

  private async handleCreateSession(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as { projectId: string };
      if (!body.projectId) {
        return Response.json({ success: false, error: 'projectId is required' }, { status: 400 });
      }

      const session: TerminalSession = {
        id: crypto.randomUUID(),
        projectId: body.projectId,
        buffer: [],
        createdAt: new Date().toISOString(),
      };

      this.sessions.set(session.id, session);

      return Response.json({
        success: true,
        data: { sessionId: session.id, agentConnected: this.agentSessionId !== null },
      });
    } catch {
      return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
  }

  private handleGetHistory(request: Request): Response {
    const sessionId = new URL(request.url).searchParams.get('sessionId') || 'default';
    const session = this.sessions.get(sessionId);
    return Response.json({
      success: true,
      data: {
        buffer: session?.buffer ?? [],
        sessionId,
        agentConnected: this.agentSessionId !== null,
      },
    });
  }

  private handleMessage(sessionId: string, projectId: string, data: Record<string, unknown>, ws: WebSocket): void {
    const type = data.type as string;

    switch (type) {
      case 'agent_connected': {
        this.agentSessionId = sessionId;
        this.lastHeartbeat = Date.now();
        this.state.storage.put('agentSessionId', sessionId);
        this.state.storage.put('lastHeartbeat', this.lastHeartbeat);
        this.startHeartbeatTimer();
        if (!this.sessions.has(sessionId)) {
          this.sessions.set(sessionId, {
            id: sessionId,
            projectId,
            buffer: [],
            createdAt: new Date().toISOString(),
          });
        }
        ws.send(JSON.stringify({ type: 'agent_connected_ack', sessionId }));
        const agentInfo = data.info as Record<string, unknown> || {};
        const hostname = (agentInfo.hostname as string) || 'cloudshell';
        this.broadcastToBrowsers(JSON.stringify({
          type: 'agent_connected',
          hostname,
          message: `Agent connected from ${hostname}`,
        }), sessionId);
        break;
      }

      case 'agent_disconnected': {
        this.handleAgentOffline(sessionId);
        break;
      }

      case 'heartbeat': {
        this.lastHeartbeat = Date.now();
        this.state.storage.put('lastHeartbeat', this.lastHeartbeat);
        break;
      }

      case 'terminal_input': {
        const input = data.input as string;
        const session = this.sessions.get(sessionId);
        if (session) {
          session.buffer.push(`> ${input}`);
          if (session.buffer.length > 1000) {
            session.buffer.splice(0, session.buffer.length - 1000);
          }
        }

        if (this.agentSessionId) {
          const agentWs = this.websockets.get(this.agentSessionId);
          if (agentWs) {
            try {
              agentWs.send(JSON.stringify({
                type: 'execute_command',
                command_id: crypto.randomUUID(),
                command: input,
              }));
            } catch {
              this.handleAgentOffline(this.agentSessionId);
              ws.send(JSON.stringify({ type: 'terminal_output', data: 'Agent unreachable. Command not sent.\n' }));
            }
          } else {
            ws.send(JSON.stringify({ type: 'terminal_output', data: 'Agent disconnected. Cannot execute command.\n' }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'terminal_output', data: 'No agent connected. Install the agent to run commands.\n' }));
        }
        break;
      }

      case 'command_output': {
        const output = data.output as string;
        const filtered = output.split('\n').filter((l) => !l.startsWith('__DONE_')).join('\n');
        if (filtered.trim()) {
          for (const [sid, ws] of this.websockets.entries()) {
            if (sid === AGENT_SESSION_ID) continue;
            const s = this.sessions.get(sid);
            if (s) {
              s.buffer.push(filtered);
              if (s.buffer.length > 1000) s.buffer.splice(0, s.buffer.length - 1000);
            }
            try { ws.send(JSON.stringify({ type: 'terminal_output', data: filtered })); } catch {}
          }
        }
        break;
      }

      case 'command_completed': {
        const output = data.output as string;
        const status = data.status as string;
        const newCwd = data.cwd as string | undefined;
        if (output) {
          this.broadcastToBrowsers(JSON.stringify({
            type: 'terminal_output',
            data: output,
          }), sessionId);
        } else if (status === 'error') {
          this.broadcastToBrowsers(JSON.stringify({
            type: 'terminal_output',
            data: 'Command failed (see agent logs)',
          }), sessionId);
        }
        if (newCwd) {
          this.broadcastToBrowsers(JSON.stringify({ type: 'cwd', data: newCwd }), sessionId);
        }
        break;
      }

      case 'terminal_resize': {
        const cols = data.cols as number;
        const rows = data.rows as number;
        ws.send(JSON.stringify({ type: 'terminal_resized', cols, rows }));
        break;
      }

      case 'ctrl_c': {
        if (this.agentSessionId) {
          const agentWs = this.websockets.get(this.agentSessionId);
          if (agentWs) {
            try {
              agentWs.send(JSON.stringify({ type: 'ctrl_c' }));
            } catch {
              this.handleAgentOffline(this.agentSessionId);
            }
          }
        }
        break;
      }

      case 'keepalive': {
        ws.send(JSON.stringify({ type: 'keepalive_ack' }));
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  }

  private handleAgentOffline(sessionId: string): void {
    this.agentSessionId = null;
    this.lastHeartbeat = 0;
    this.state.storage.delete('agentSessionId');
    this.state.storage.delete('lastHeartbeat');
    this.clearHeartbeatTimer();
    this.websockets.delete(sessionId);
    this.broadcastToBrowsers(JSON.stringify({
      type: 'agent_disconnected',
      message: 'Agent went offline',
    }), sessionId);
  }

  private startHeartbeatTimer(): void {
    this.clearHeartbeatTimer();
    this.heartbeatTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastHeartbeat;
      if (elapsed > HEARTBEAT_TIMEOUT_MS && this.agentSessionId) {
        const sessionId = this.agentSessionId;
        this.agentSessionId = null;
        this.clearHeartbeatTimer();
        this.lastHeartbeat = 0;
        this.state.storage.delete('agentSessionId');
        this.state.storage.delete('lastHeartbeat');
        this.websockets.delete(sessionId);
        this.broadcastToBrowsers(JSON.stringify({
          type: 'agent_disconnected',
          message: 'Agent heartbeat timed out',
        }), sessionId);
      }
    }, 30000);
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private broadcastToBrowsers(message: string, excludeSessionId?: string): void {
    for (const [sid, ws] of this.websockets.entries()) {
      if (sid === excludeSessionId) continue;
      if (sid === AGENT_SESSION_ID) continue;
      try {
        ws.send(message);
      } catch {}
    }
  }
}
