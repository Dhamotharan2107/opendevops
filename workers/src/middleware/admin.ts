import type { Context, Next } from 'hono';
import type { User } from '../types';

// Admin authorization. Must run AFTER `authenticate` (which verifies the JWT and
// loads the user). Authorization is based on the user's DB `role`, not a shared
// static key — so there is no secret to leak in source or in the client bundle.
export async function adminAuth(c: Context, next: Next) {
  const user = c.get('user') as User | undefined;
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access denied' }, 403);
  }
  await next();
}
