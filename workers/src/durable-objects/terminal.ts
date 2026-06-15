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

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.appEnv = env;
    this.sessions = new Map();
    this.websockets = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/ws') {
      return this.handleWebSocketUpgrade(request);
    }

    if (request.method === 'POST' && url.pathname === '/session') {
      return this.handleCreateSession(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const sessionId = new URL(request.url).searchParams.get('sessionId');
    if (!sessionId) {
      return new Response('sessionId query parameter is required', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.websockets.set(sessionId, server);

    const session = this.sessions.get(sessionId);
    if (session) {
      for (const line of session.buffer) {
        try {
          server.send(JSON.stringify({ type: 'terminal_output', data: line }));
        } catch {}
      }
    }

    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleTerminalMessage(sessionId, data);
      } catch {
        server.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    server.addEventListener('close', () => {
      this.websockets.delete(sessionId);
    });

    server.addEventListener('error', () => {
      this.websockets.delete(sessionId);
    });

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

  private handleTerminalMessage(sessionId: string, data: Record<string, unknown>): void {
    const type = data.type as string;
    const server = this.websockets.get(sessionId);
    if (!server) return;

    switch (type) {
      case 'terminal_input': {
        const input = data.input as string;
        const session = this.sessions.get(sessionId);
        if (session) {
          session.buffer.push(`> ${input}`);
        }
        server.send(JSON.stringify({ type: 'terminal_output', data: `$ ${input}` }));
        break;
      }

      case 'terminal_resize': {
        const cols = data.cols as number;
        const rows = data.rows as number;
        server.send(JSON.stringify({ type: 'terminal_resized', cols, rows }));
        break;
      }

      case 'forward_output': {
        const output = data.output as string;
        const session = this.sessions.get(sessionId);
        if (session) {
          session.buffer.push(output);
          if (session.buffer.length > 1000) {
            session.buffer.splice(0, session.buffer.length - 1000);
          }
        }
        server.send(JSON.stringify({ type: 'terminal_output', data: output }));
        break;
      }

      case 'keepalive': {
        server.send(JSON.stringify({ type: 'keepalive_ack' }));
        break;
      }

      default:
        server.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  }

  getSessionHistory(sessionId: string): string[] {
    return this.sessions.get(sessionId)?.buffer ?? [];
  }

  getActiveSessions(): number {
    return this.websockets.size;
  }
}
