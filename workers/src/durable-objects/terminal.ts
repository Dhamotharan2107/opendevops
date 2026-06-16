import type { Env } from '../types';

interface TerminalSession {
  id: string;
  projectId: string;
  buffer: string[];
  createdAt: string;
}

export class TerminalDurableObject implements DurableObject {
  private state: DurableObjectState;
  private appEnv: Env;
  private sessions: Map<string, TerminalSession>;
  private websockets: Map<string, WebSocket>;
  private agentWs: WebSocket | null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.appEnv = env;
    this.sessions = new Map();
    this.websockets = new Map();
    this.agentWs = null;
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

    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleMessage(sessionId, projectId, data, server);
      } catch {
        server.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    server.addEventListener('close', () => {
      if (this.agentWs === server) {
        this.agentWs = null;
      }
      this.websockets.delete(sessionId);
    });

    server.addEventListener('error', () => {
      if (this.agentWs === server) {
        this.agentWs = null;
      }
      this.websockets.delete(sessionId);
    });

    this.websockets.set(sessionId, server);

    const session = this.sessions.get(sessionId);
    if (session) {
      for (const line of session.buffer) {
        try {
          server.send(JSON.stringify({ type: 'terminal_output', data: line }));
        } catch {}
      }
    }

    return new Response(null, { status: 101, webSocket: client });
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
        data: { sessionId: session.id },
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
      },
    });
  }

  private handleMessage(sessionId: string, projectId: string, data: Record<string, unknown>, ws: WebSocket): void {
    const type = data.type as string;

    switch (type) {
      case 'agent_connected': {
        this.agentWs = ws;
        const session = this.sessions.get(sessionId);
        if (!session) {
          this.sessions.set(sessionId, {
            id: sessionId,
            projectId,
            buffer: [],
            createdAt: new Date().toISOString(),
          });
        }
        ws.send(JSON.stringify({ type: 'agent_connected_ack', sessionId }));
        break;
      }

      case 'heartbeat': {
        if (this.agentWs) {
          ws.send(JSON.stringify({ type: 'heartbeat_pong' }));
        }
        break;
      }

      case 'heartbeat_ping': {
        ws.send(JSON.stringify({ type: 'heartbeat' }));
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

        if (this.agentWs) {
          try {
            this.agentWs.send(JSON.stringify({
              type: 'execute_command',
              command_id: crypto.randomUUID(),
              command: input,
            }));
          } catch {
            ws.send(JSON.stringify({ type: 'terminal_output', data: 'Agent disconnected. Cannot execute command.\n' }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'terminal_output', data: `$ ${input}` }));
        }
        break;
      }

      case 'command_output': {
        const output = data.output as string;
        this.broadcastToBrowsers(JSON.stringify({ type: 'terminal_output', data: output }), sessionId);
        break;
      }

      case 'command_completed': {
        const status = data.status as string;
        const output = data.output as string;
        this.broadcastToBrowsers(JSON.stringify({
          type: 'terminal_output',
          data: output ? `\n${output}` : `\nCommand finished with status: ${status}\n`,
        }), sessionId);
        break;
      }

      case 'terminal_resize': {
        const cols = data.cols as number;
        const rows = data.rows as number;
        ws.send(JSON.stringify({ type: 'terminal_resized', cols, rows }));
        break;
      }

      case 'keepalive': {
        ws.send(JSON.stringify({ type: 'keepalive_ack' }));
        break;
      }

      case 'forward_output': {
        const fwdOutput = data.output as string;
        const session = this.sessions.get(sessionId);
        if (session) {
          session.buffer.push(fwdOutput);
          if (session.buffer.length > 1000) {
            session.buffer.splice(0, session.buffer.length - 1000);
          }
        }
        ws.send(JSON.stringify({ type: 'terminal_output', data: fwdOutput }));
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  }

  private broadcastToBrowsers(message: string, excludeSessionId?: string): void {
    for (const [sid, ws] of this.websockets.entries()) {
      if (sid === excludeSessionId) continue;
      try {
        ws.send(message);
      } catch {}
    }
  }
}
