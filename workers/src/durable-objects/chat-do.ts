import { generateId, now } from '../utils/helpers';
import type { Env, Message } from '../types';

interface ChatState {
  messages: Message[];
}

export class ChatDurableObject implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Set<WebSocket>;
  private chatState: ChatState;

  constructor(ctx: DurableObjectState, env: Env) {
    this.state = ctx;
    this.env = env;
    this.sessions = new Set();
    this.chatState = { messages: [] };

    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<ChatState>('chatState');
      if (stored) {
        this.chatState = stored;
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (url.pathname === '/ws' && method === 'GET') {
      return this.handleWebSocketUpgrade(request);
    }

    if (method === 'GET' && url.pathname === '/') {
      return new Response(JSON.stringify({ success: true, messages: this.chatState.messages }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && url.pathname === '/message') {
      const body = (await request.json()) as {
        sender_id: string;
        text: string;
        file_url?: string;
        file_type?: string;
        file_name?: string;
      };
      const message: Message = {
        id: generateId(),
        chat_id: url.searchParams.get('chat_id') || '',
        sender_id: body.sender_id,
        text: body.text,
        file_url: body.file_url,
        file_type: body.file_type,
        file_name: body.file_name,
        created_at: now(),
      };
      this.chatState.messages.push(message);
      await this.state.storage.put('chatState', this.chatState);
      this.broadcast({ type: 'new_message', message });
      return new Response(JSON.stringify({ success: true, data: message }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  private handleWebSocketUpgrade(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.sessions.add(server);

    server.accept();

    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === 'ping') {
          server.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        this.broadcast({ type: 'message', data: data.data, sender: data.sender });
      } catch {
        server.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
      this.broadcast({ type: 'user_left' });
    });

    server.addEventListener('error', () => {
      this.sessions.delete(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private broadcast(data: unknown): void {
    const message = JSON.stringify(data);
    for (const session of this.sessions) {
      try {
        session.send(message);
      } catch {
        this.sessions.delete(session);
      }
    }
  }
}
