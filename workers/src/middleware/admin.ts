import type { Context, Next } from 'hono';

const ADMIN_KEY = 'opendrapdev@2026';

export async function adminAuth(c: Context, next: Next) {
  const key = c.req.header('X-Admin-Key');
  if (key !== ADMIN_KEY) {
    return c.json({ success: false, error: 'Admin access denied' }, 401);
  }
  await next();
}
