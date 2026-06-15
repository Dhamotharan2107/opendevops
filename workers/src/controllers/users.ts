import type { Context } from 'hono';
import { UserRepository } from '../repositories/user';
import type { Env } from '../types';
import { updateUserSchema, searchSchema as searchQuerySchema } from '../validators';
import { NotFoundError, ValidationError, UnauthorizedError } from '../utils/errors';
import { successResponse } from '../utils/helpers';

export async function listUsers(c: Context<{ Bindings: Env }>) {
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);

  const repo = new UserRepository(c.env.DB);

  if (query) {
    const result = await repo.search(query, page, limit);
    const users = result.users.map((u) => {
      u.password_hash = undefined;
      return u;
    });
    return c.json(successResponse({ users, total: result.total, page, limit }));
  }

  const offset = (page - 1) * limit;
  const usersResult = await c.env.DB
    .prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .bind(limit, offset)
    .all();

  const countResult = await c.env.DB
    .prepare('SELECT COUNT(*) as total FROM users')
    .first<{ total: number }>();

  const users = usersResult.results.map((u: Record<string, unknown>) => {
    const { password_hash, ...rest } = u;
    return rest;
  });

  return c.json(
    successResponse({ users, total: countResult?.total ?? 0, page, limit }),
  );
}

export async function getUser(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')!;
  const repo = new UserRepository(c.env.DB);
  const user = await repo.findById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.password_hash = undefined;
  return c.json(successResponse({ user }));
}

export async function updateUser(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;

  if (userId !== id) {
    throw new UnauthorizedError('You can only update your own profile');
  }

  const body = await c.req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.errors.map((e) => e.message).join(', '),
    );
  }

  const repo = new UserRepository(c.env.DB);
  const user = await repo.update(id, parsed.data);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.password_hash = undefined;
  return c.json(successResponse({ user }));
}

export async function deleteUser(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;

  if (userId !== id) {
    throw new UnauthorizedError('You can only delete your own account');
  }

  const repo = new UserRepository(c.env.DB);
  const user = await repo.findById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await repo.delete(id);
  return c.json(successResponse({ message: 'User deleted successfully' }));
}

export async function updateAvatar(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const body = await c.req.json();
  const avatarUrl = body.avatar_url as string;

  if (!avatarUrl) {
    throw new ValidationError('avatar_url is required');
  }

  const repo = new UserRepository(c.env.DB);
  const user = await repo.update(userId, {
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.password_hash = undefined;
  return c.json(successResponse({ user }));
}
