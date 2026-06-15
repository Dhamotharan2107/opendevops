// WebSocket event types for the entire platform

export type WSEventType =
  // Chat
  | 'new_message'
  | 'user_joined'
  | 'user_left'
  | 'ping'
  | 'pong'
  // Agent
  | 'agent_connected'
  | 'agent_disconnected'
  | 'heartbeat'
  | 'heartbeat_ping'
  | 'log_received'
  | 'command_completed'
  | 'command_output'
  | 'execute_command'
  // Terminal
  | 'terminal_input'
  | 'terminal_output'
  | 'terminal_resize'
  | 'terminal_resized'
  | 'forward_output'
  | 'keepalive'
  | 'keepalive_ack'
  // Notifications
  | 'notification'
  // Errors
  | 'error';

export interface WSEvent<T = unknown> {
  type: WSEventType;
  data?: T;
  timestamp?: string;
}

export function createEvent<T>(type: WSEventType, data?: T): string {
  return JSON.stringify({ type, data, timestamp: new Date().toISOString() });
}

export function parseEvent(raw: string): WSEvent | null {
  try {
    return JSON.parse(raw) as WSEvent;
  } catch {
    return null;
  }
}

export function sendToSocket(ws: WebSocket, type: WSEventType, data?: unknown): void {
  try {
    ws.send(createEvent(type, data));
  } catch {
    // Socket may be closed
  }
}
