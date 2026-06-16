import { Context } from 'hono';
import { LogRepository } from '../repositories/logs';
import { successResponse } from '../utils/helpers';
import type { Env, User } from '../types';

export async function getDashboard(c: Context) {
  const env = c.env as Env;
  const user = c.get('user') as User;
  const db = env.DB;

  const projectCount = await db.prepare('SELECT COUNT(*) as count FROM projects WHERE created_by = ?')
    .bind(user.id).first<{ count: number }>();
  const deploymentCount = await db.prepare('SELECT COUNT(*) as count FROM deployments WHERE created_by = ?')
    .bind(user.id).first<{ count: number }>();
  const errorCount = await db.prepare('SELECT COUNT(*) as count FROM error_logs')
    .first<{ count: number }>();
  const bugCount = await db.prepare('SELECT COUNT(*) as count FROM bugs WHERE assigned_to = ?')
    .bind(user.id).first<{ count: number }>();

  const recentProjects = await db.prepare(
    'SELECT * FROM projects WHERE created_by = ? ORDER BY created_at DESC LIMIT 5'
  ).bind(user.id).all<any>();

  const recentDeployments = await db.prepare(
    'SELECT d.*, p.name as project_name FROM deployments d LEFT JOIN projects p ON d.project_id = p.id WHERE d.created_by = ? ORDER BY d.created_at DESC LIMIT 5'
  ).bind(user.id).all<any>();

  const recentActivity = await db.prepare(
    'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(user.id).all<any>();

  const notifications = await db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
  ).bind(user.id).all<any>();

  return c.json(successResponse({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan || 'free',
    },
    stats: {
      totalProjects: projectCount?.count || 0,
      totalDeployments: deploymentCount?.count || 0,
      totalErrors: errorCount?.count || 0,
      openBugs: bugCount?.count || 0,
    },
    recentProjects: recentProjects?.results || [],
    recentDeployments: recentDeployments?.results || [],
    recentActivity: recentActivity?.results || [],
    notifications: notifications?.results || [],
  }));
}
