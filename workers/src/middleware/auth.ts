import { type Context, type Next } from 'hono';
import { verifyToken } from '../auth';
import { UnauthorizedError } from '../utils/errors';
import type { Env, User } from '../types';

declare module 'hono' {
  interface ContextVariableMap {
    user: User;
    userId: string;
  }
}

export async function authenticate(c: Context, next: Next) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedError('Missing or invalid token');

  const token = auth.slice(7);

  try {
    const env = c.env as Env;
    const payload = await verifyToken(token, env.JWT_SECRET);
    const userId = payload.sub as string;

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<User>();
    if (!user) throw new UnauthorizedError('User not found');
    if (user.is_disabled === 1) throw new UnauthorizedError('Account has been disabled');

    c.set('userId', user.id);
    c.set('user', user);
    await next();
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export const authMiddleware = authenticate;
