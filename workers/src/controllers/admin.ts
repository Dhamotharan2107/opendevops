import type { Context } from 'hono';
import type { Env } from '../types';
import { successResponse } from '../utils/helpers';
import { generateId } from '../utils/helpers';

const VALID_PLANS = ['free', 'pro', 'enterprise'] as const;
const VALID_ROLES = ['user', 'admin'] as const;

export async function getStats(c: Context<{ Bindings: Env }>) {
  const db = c.env.DB;
  const [users, disabled, projects, deployments, openBugs, companies, planRows] = await Promise.all([
    db.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM users WHERE is_disabled=1').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM projects').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM deployments').first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) as n FROM bugs WHERE status='open'").first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM companies').first<{ n: number }>(),
    db.prepare("SELECT plan, COUNT(*) as n FROM users GROUP BY plan").all<{ plan: string; n: number }>(),
  ]);

  const planCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
  for (const row of planRows.results) planCounts[row.plan] = row.n;

  return c.json(successResponse({
    users: users?.n ?? 0,
    disabled_users: disabled?.n ?? 0,
    projects: projects?.n ?? 0,
    deployments: deployments?.n ?? 0,
    open_bugs: openBugs?.n ?? 0,
    companies: companies?.n ?? 0,
    plan_free: planCounts.free,
    plan_pro: planCounts.pro,
    plan_enterprise: planCounts.enterprise,
  }));
}

export async function listAllUsers(c: Context<{ Bindings: Env }>) {
  const db = c.env.DB;
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, parseInt(c.req.query('limit') || '20'));
  const q = c.req.query('q') || '';
  const offset = (page - 1) * limit;

  const SELECT = `SELECT id,username,name,email,auth_provider,avatar_url,company,role,plan,is_disabled,created_at,updated_at FROM users`;

  if (q) {
    const p = `%${q}%`;
    const WHERE = ` WHERE name LIKE ? OR email LIKE ? OR username LIKE ?`;
    const [rows, count] = await Promise.all([
      db.prepare(SELECT + WHERE + ' ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(p, p, p, limit, offset).all(),
      db.prepare('SELECT COUNT(*) as n FROM users' + WHERE).bind(p, p, p).first<{ n: number }>(),
    ]);
    return c.json(successResponse({ users: rows.results, total: count?.n ?? 0, page, limit }));
  }

  const [rows, count] = await Promise.all([
    db.prepare(SELECT + ' ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all(),
    db.prepare('SELECT COUNT(*) as n FROM users').first<{ n: number }>(),
  ]);
  return c.json(successResponse({ users: rows.results, total: count?.n ?? 0, page, limit }));
}

export async function getUserDetail(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id');
  const db = c.env.DB;
  const [user, projectCount, deployCount] = await Promise.all([
    db.prepare(
      `SELECT id,username,name,email,auth_provider,avatar_url,bio,skills,company,
       experience,website,github,role,plan,is_disabled,created_at,updated_at
       FROM users WHERE id=?`
    ).bind(id).first(),
    db.prepare('SELECT COUNT(*) as n FROM projects WHERE created_by=?').bind(id).first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM deployments WHERE created_by=?').bind(id).first<{ n: number }>(),
  ]);
  if (!user) return c.json({ success: false, error: 'User not found' }, 404);
  return c.json(successResponse({ user, stats: { projects: projectCount?.n ?? 0, deployments: deployCount?.n ?? 0 } }));
}

export async function updateUserAdmin(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id');
  const db = c.env.DB;
  const body = await c.req.json();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof body.is_disabled === 'boolean') {
    fields.push('is_disabled = ?');
    values.push(body.is_disabled ? 1 : 0);
  }
  if (VALID_ROLES.includes(body.role)) {
    fields.push('role = ?');
    values.push(body.role);
  }
  if (VALID_PLANS.includes(body.plan)) {
    fields.push('plan = ?');
    values.push(body.plan);
  }
  if (typeof body.name === 'string' && body.name.trim()) {
    fields.push('name = ?');
    values.push(body.name.trim());
  }

  if (fields.length === 0) return c.json({ success: false, error: 'Nothing to update' }, 400);

  fields.push('updated_at = ?');
  values.push(new Date().toISOString(), id);

  await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  const user = await db.prepare(
    'SELECT id,username,name,email,role,plan,is_disabled,created_at FROM users WHERE id=?'
  ).bind(id).first();

  return c.json(successResponse({ user }));
}

export async function deleteUserAdmin(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM users WHERE id=?').bind(id).run();
  return c.json(successResponse({ message: 'User deleted' }));
}

// ── Env vars ──────────────────────────────────────────────────────────────────

export async function listEnvVars(c: Context<{ Bindings: Env }>) {
  const rows = await c.env.DB.prepare(
    'SELECT * FROM env_vars ORDER BY key ASC'
  ).all();
  return c.json(successResponse(rows.results));
}

export async function upsertEnvVar(c: Context<{ Bindings: Env }>) {
  const key = decodeURIComponent(c.req.param('key'));
  if (!/^[A-Z0-9_]+$/.test(key)) {
    return c.json({ success: false, error: 'Key must be uppercase letters, digits, and underscores only' }, 400);
  }
  const body = await c.req.json();
  const value = typeof body.value === 'string' ? body.value : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const is_secret = body.is_secret ? 1 : 0;
  const now = new Date().toISOString();

  const existing = await c.env.DB.prepare('SELECT id FROM env_vars WHERE key=?').bind(key).first<{ id: string }>();

  if (existing) {
    await c.env.DB.prepare(
      'UPDATE env_vars SET value=?, description=?, is_secret=?, updated_at=? WHERE key=?'
    ).bind(value, description, is_secret, now, key).run();
  } else {
    await c.env.DB.prepare(
      'INSERT INTO env_vars (id,key,value,description,is_secret,created_at,updated_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(generateId(), key, value, description, is_secret, now, now).run();
  }

  const row = await c.env.DB.prepare('SELECT * FROM env_vars WHERE key=?').bind(key).first();
  return c.json(successResponse(row));
}

export async function deleteEnvVar(c: Context<{ Bindings: Env }>) {
  const key = decodeURIComponent(c.req.param('key'));
  await c.env.DB.prepare('DELETE FROM env_vars WHERE key=?').bind(key).run();
  return c.json(successResponse({ message: 'Deleted' }));
}
