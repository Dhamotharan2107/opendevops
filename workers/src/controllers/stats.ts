import { Context } from 'hono';
import { successResponse } from '../utils/helpers';
import type { Env } from '../types';

// Public, unauthenticated aggregate stats for the landing page.
// Only exposes counts — no user-identifiable or sensitive data.
export async function getPublicStats(c: Context) {
  const db = (c.env as Env).DB;

  const [users, projects, deployments, successDeploys, totalDeploys, bugs, errors] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM projects').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM deployments').first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM deployments WHERE status = 'success'").first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM deployments').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM bugs').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM error_logs').first<{ count: number }>(),
  ]);

  const deployTotal = totalDeploys?.count || 0;
  const deploySuccess = successDeploys?.count || 0;
  const successRate = deployTotal > 0 ? Math.round((deploySuccess / deployTotal) * 1000) / 10 : 100;

  return c.json(successResponse({
    users: users?.count || 0,
    projects: projects?.count || 0,
    deployments: deployments?.count || 0,
    successRate,
    bugs: bugs?.count || 0,
    errors: errors?.count || 0,
  }));
}
