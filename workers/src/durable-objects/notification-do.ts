import { DurableObject } from 'cloudflare:workers';

interface WebSocketClient {
  ws: WebSocket;
  userId: string;
}

export class NotificationDurableObject extends DurableObject {
  private connections = new Map<string, WebSocketClient[]>();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      return this.handleWebSocket(request);
    }

    if (url.pathname === '/send' && request.method === 'POST') {
      return this.handleSend(request);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return new Response('Missing user ID', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    const clientEntry: WebSocketClient = { ws: server, userId };
    const existing = this.connections.get(userId) || [];
    existing.push(clientEntry);
    this.connections.set(userId, existing);

    const cleanup = () => {
      const clients = this.connections.get(userId) || [];
      this.connections.set(
        userId,
        clients.filter((c) => c.ws !== server),
      );
    };

    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);

    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleSend(request: Request): Promise<Response> {
    const { userId, title, message, type, link } = await request.json() as {
      userId: string;
      title: string;
      message: string;
      type: string;
      link?: string;
    };

    const clients = this.connections.get(userId) || [];
    const payload = JSON.stringify({
      type: 'notification',
      title,
      message,
      notificationType: type,
      link,
      timestamp: new Date().toISOString(),
    });

    for (const client of clients) {
      try {
        client.ws.send(payload);
      } catch {
        // Connection dead, will be cleaned up on next close/error
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
