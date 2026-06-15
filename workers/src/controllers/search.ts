import type { Context } from 'hono';
import { UserRepository } from '../repositories/user';
import type { Env } from '../types';
import { searchSchema as searchQuerySchema } from '../validators';
import { ValidationError } from '../utils/errors';
import { successResponse } from '../utils/helpers';

export async function globalSearch(c: Context<{ Bindings: Env }>) {
  const query = c.req.query('q');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '10', 10);

  const parsed = searchQuerySchema.safeParse({ q: query, page, limit });
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.errors.map((e) => e.message).join(', '),
    );
  }

  const { q } = parsed.data;
  const searchPattern = `%${q}%`;
  const db = c.env.DB;

  const [usersResult, companiesResult, projectsResult] = await Promise.all([
    new UserRepository(db).search(q, parsed.data.page, parsed.data.limit),
    db
      .prepare(
        `SELECT * FROM companies
         WHERE name LIKE ? OR description LIKE ? OR tech_stack LIKE ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(
        searchPattern,
        searchPattern,
        searchPattern,
        parsed.data.limit,
        (parsed.data.page - 1) * parsed.data.limit,
      )
      .all(),
    db
      .prepare(
        `SELECT * FROM projects
         WHERE name LIKE ? OR description LIKE ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(
        searchPattern,
        searchPattern,
        parsed.data.limit,
        (parsed.data.page - 1) * parsed.data.limit,
      )
      .all(),
  ]);

  const users = usersResult.users.map((u) => {
    u.password_hash = undefined;
    return u;
  });

  return c.json(
    successResponse({
      users,
      companies: companiesResult.results,
      projects: projectsResult.results,
      page: parsed.data.page,
      limit: parsed.data.limit,
    }),
  );
}
