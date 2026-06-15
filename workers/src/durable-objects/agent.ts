import type { Env, AgentSession } from '../types';

interface AgentSessionState {
  session: AgentSession | null;
  webSocket: WebSocket | null;
  queuedCommands: Array<{ id: string; command: string; timestamp: number }>;
  heartbeatInterval: ReturnType<typeof setInterval> | null;
}

export class AgentDurableObject implements DurableObject {
  private state: DurableObjectState;
  private appEnv: Env;
  private sessionState: AgentSessionState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.appEnv = env;
    this.sessionState = {
      session: null,
      webSocket: null,
      queuedCommands: [],
      heartbeatInterval: null,
    };
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/ws') {
      return this.handleWebSocketUpgrade(request);
    }

    if (request.method === 'POST' && url.pathname === '/command') {
      return this.handleQueueCommand(request);
    }

    if (request.method === 'GET' && url.pathname === '/status') {
      return this.handleGetStatus();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();
    this.sessionState.webSocket = server;

    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleAgentMessage(data);
      } catch {
        server.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    server.addEventListener('close', () => {
      this.handleAgentDisconnected();
    });

    server.addEventListener('error', () => {
      this.handleAgentDisconnected();
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleAgentMessage(data: Record<string, unknown>): void {
    const type = data.type as string;
    const ws = this.sessionState.webSocket;
    if (!ws) return;

    switch (type) {
      case 'agent_connected': {
        const projectId = data.project_id as string;
        this.sessionState.session = {
          id: this.state.id.toString(),
          project_id: projectId,
          status: 'connected',
          last_heartbeat: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        this.startHeartbeat(ws);
        break;
      }

      case 'agent_disconnected': {
        this.handleAgentDisconnected();
        break;
      }

      case 'heartbeat': {
        if (this.sessionState.session) {
          this.sessionState.session.last_heartbeat = new Date().toISOString();
          this.sessionState.session.status = 'connected';
        }
        break;
      }

      case 'log_received': {
        const log = data.log as string;
        const projectId = data.project_id as string;
        this.broadcastLog(projectId, log);
        break;
      }

      case 'command_completed': {
        const commandId = data.command_id as string;
        const output = data.output as string;
        const status = data.status as string;
        const sessionId = this.sessionState.session?.id;
        if (sessionId) {
          this.storeCommandResult(sessionId, commandId, output, status);
        }
        break;
      }

      case 'command_output': {
        const partialOutput = data.output as string;
        const wsConn = this.sessionState.webSocket;
        if (wsConn) {
          wsConn.send(JSON.stringify({ type: 'command_output', output: partialOutput }));
        }
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  }

  private startHeartbeat(ws: WebSocket): void {
    if (this.sessionState.heartbeatInterval) {
      clearInterval(this.sessionState.heartbeatInterval);
    }

    this.sessionState.heartbeatInterval = setInterval(() => {
      try {
        ws.send(JSON.stringify({ type: 'heartbeat_ping' }));
      } catch {
        this.handleAgentDisconnected();
      }
    }, 30000);
  }

  private handleAgentDisconnected(): void {
    if (this.sessionState.heartbeatInterval) {
      clearInterval(this.sessionState.heartbeatInterval);
      this.sessionState.heartbeatInterval = null;
    }

    if (this.sessionState.session) {
      this.sessionState.session.status = 'disconnected';
      this.sessionState.session.last_heartbeat = new Date().toISOString();
    }

    const ws = this.sessionState.webSocket;
    if (ws) {
      try {
        ws.close(1000, 'Agent disconnected');
      } catch {}
      this.sessionState.webSocket = null;
    }
  }

  private async handleQueueCommand(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as { command: string };
      if (!body.command) {
        return Response.json({ success: false, error: 'Command is required' }, { status: 400 });
      }

      const commandId = crypto.randomUUID();
      const ws = this.sessionState.webSocket;

      if (ws && this.sessionState.session?.status === 'connected') {
        ws.send(JSON.stringify({
          type: 'execute_command',
          command_id: commandId,
          command: body.command,
        }));

        return Response.json({ success: true, data: { command_id: commandId } });
      }

      this.sessionState.queuedCommands.push({
        id: commandId,
        command: body.command,
        timestamp: Date.now(),
      });

      return Response.json({
        success: true,
        data: { command_id: commandId, queued: true },
      });
    } catch {
      return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
  }

  private handleGetStatus(): Response {
    const status = this.sessionState.session?.status ?? 'disconnected';
    const lastHeartbeat = this.sessionState.session?.last_heartbeat ?? null;
    const queuedCount = this.sessionState.queuedCommands.length;

    return Response.json({
      success: true,
      data: {
        status,
        last_heartbeat: lastHeartbeat,
        queued_commands: queuedCount,
        session_id: this.sessionState.session?.id ?? null,
      },
    });
  }

  private broadcastLog(projectId: string, log: string): void {
    const ws = this.sessionState.webSocket;
    if (ws) {
      ws.send(JSON.stringify({ type: 'log_received', project_id: projectId, log }));
    }
  }

  private storeCommandResult(sessionId: string, commandId: string, output: string, status: string): void {
    this.state.storage?.put(`command:${commandId}`, {
      session_id: sessionId,
      command_id: commandId,
      output,
      status,
      completed_at: new Date().toISOString(),
    });

    const ws = this.sessionState.webSocket;
    if (ws) {
      ws.send(JSON.stringify({
        type: 'command_completed',
        command_id: commandId,
        output,
        status,
      }));
    }
  }

  async getCommandResult(commandId: string): Promise<unknown> {
    return this.state.storage?.get(`command:${commandId}`);
  }

  async processQueuedCommands(): Promise<void> {
    const ws = this.sessionState.webSocket;
    if (!ws || this.sessionState.session?.status !== 'connected') return;

    while (this.sessionState.queuedCommands.length > 0) {
      const cmd = this.sessionState.queuedCommands.shift();
      if (cmd) {
        ws.send(JSON.stringify({
          type: 'execute_command',
          command_id: cmd.id,
          command: cmd.command,
        }));
      }
    }
  }
}
