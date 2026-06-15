import type { Context } from 'hono';

export function generateId(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

export function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function paginate(page: number = 1, limit: number = 20) {
  const p = Math.max(1, page);
  const l = Math.min(100, Math.max(1, limit));
  return { offset: (p - 1) * l, limit: l };
}

export function successResponse(data: unknown, messageOrStatus?: string | number) {
  return { success: true, data };
}

export function errorResponse(message: string, status: number = 400) {
  return { success: false, error: message };
}

export function success(c: Context, data: unknown, status: number = 200) {
  return c.json({ success: true, data }, status as any);
}

export function fail(c: Context, e: unknown, status?: number) {
  const err = e as Error & { status?: number; code?: string };
  const s = status || err.status || 500;
  const message = err.message || 'Internal server error';
  return c.json({ success: false, error: message, code: err.code }, s as any);
}

export function paginated(c: Context, data: unknown, total: number, page: number, limit: number) {
  return c.json({ success: true, data: { items: data, total, page, limit } });
}
