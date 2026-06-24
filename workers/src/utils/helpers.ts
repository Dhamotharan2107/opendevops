import type { Context } from 'hono';
import { AppError } from './errors';

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
  const explicit = status ?? err.status;
  const isClientError = typeof explicit === 'number' && explicit >= 400 && explicit < 500;

  // Only surface messages for expected (AppError / explicit 4xx) failures.
  // Unexpected errors return a generic message and are logged server-side, so we
  // don't leak internal details (stack traces, DB errors) to clients.
  if (err instanceof AppError || isClientError) {
    return c.json(
      { success: false, error: err.message || 'Request failed', code: err.code },
      (explicit ?? 400) as any,
    );
  }

  console.error('Unhandled error:', err);
  return c.json({ success: false, error: 'Internal server error' }, (explicit ?? 500) as any);
}

export function paginated(c: Context, data: unknown, total: number, page: number, limit: number) {
  return c.json({ success: true, data: { items: data, total, page, limit } });
}
