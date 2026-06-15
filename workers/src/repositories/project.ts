import type { D1Database } from '@cloudflare/workers-types';
import type { Project, ProjectMember } from '../types';
import { NotFoundError } from '../utils/errors';
import { generateId, now } from '../utils/helpers';

interface MemberWithUser extends ProjectMember {
  username: string;
  name: string;
  avatar_url?: string;
  email: string;
}

export class ProjectRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<Project | null> {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<Project>();
  }

  async findAll(userId?: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    if (userId) {
      const total = await this.db
        .prepare(
          'SELECT COUNT(*) as total FROM projects p JOIN project_members pm ON pm.project_id = p.id WHERE pm.user_id = ?'
        )
        .bind(userId)
        .first<{ total: number }>();

      const projects = await this.db
        .prepare(
          `SELECT p.* FROM projects p
           JOIN project_members pm ON pm.project_id = p.id
           WHERE pm.user_id = ?
           ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
        )
        .bind(userId, limit.toString(), offset.toString())
        .all<Project>();

      return { projects: projects.results, total: total?.total ?? 0 };
    }

    const total = await this.db.prepare('SELECT COUNT(*) as total FROM projects').first<{ total: number }>();
    const projects = await this.db
      .prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit.toString(), offset.toString())
      .all<Project>();

    return { projects: projects.results, total: total?.total ?? 0 };
  }

  async create(data: {
    name: string;
    description?: string;
    repo_url?: string;
    repo_provider?: string;
    branch: string;
    framework?: string;
    build_command?: string;
    start_command?: string;
    environment?: string;
    company_id?: string;
    created_by: string;
  }) {
    const id = generateId();
    const timestamp = now();

    await this.db
      .prepare(
        `INSERT INTO projects (id, name, description, repo_url, repo_provider, branch, status, framework, build_command, start_command, environment, company_id, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.name,
        data.description ?? null,
        data.repo_url ?? null,
        data.repo_provider ?? null,
        data.branch,
        'creating',
        data.framework ?? null,
        data.build_command ?? null,
        data.start_command ?? null,
        data.environment ?? null,
        data.company_id ?? null,
        data.created_by,
        timestamp,
        timestamp,
      )
      .run();

    const project = await this.findById(id);
    if (!project) throw new NotFoundError('Project not found after creation');
    return project;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      repo_url?: string;
      repo_provider?: string;
      branch?: string;
      status?: Project['status'];
      framework?: string;
      build_command?: string;
      start_command?: string;
      environment?: string;
      tunnel_url?: string;
    },
  ) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError('Project not found');

    const name = data.name ?? existing.name;
    const description = data.description !== undefined ? data.description : existing.description;
    const repo_url = data.repo_url !== undefined ? data.repo_url : existing.repo_url;
    const repo_provider = data.repo_provider !== undefined ? data.repo_provider : existing.repo_provider;
    const branch = data.branch ?? existing.branch;
    const status = data.status ?? existing.status;
    const framework = data.framework !== undefined ? data.framework : existing.framework;
    const build_command = data.build_command !== undefined ? data.build_command : existing.build_command;
    const start_command = data.start_command !== undefined ? data.start_command : existing.start_command;
    const environment = data.environment !== undefined ? data.environment : existing.environment;
    const tunnel_url = data.tunnel_url !== undefined ? data.tunnel_url : existing.tunnel_url;

    await this.db
      .prepare(
        `UPDATE projects SET name = ?, description = ?, repo_url = ?, repo_provider = ?, branch = ?, status = ?, framework = ?, build_command = ?, start_command = ?, environment = ?, tunnel_url = ?, updated_at = ? WHERE id = ?`
      )
      .bind(
        name, description, repo_url, repo_provider, branch, status,
        framework, build_command, start_command, environment, tunnel_url, now(), id,
      )
      .run();

    const project = await this.findById(id);
    if (!project) throw new NotFoundError('Project not found');
    return project;
  }

  async delete(id: string) {
    await this.db.prepare('DELETE FROM project_members WHERE project_id = ?').bind(id).run();
    const result = await this.db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) throw new NotFoundError('Project not found');
  }

  async addMember(projectId: string, userId: string, data: { role: ProjectMember['role']; permissions: string }) {
    await this.db
      .prepare(
        'INSERT INTO project_members (project_id, user_id, role, permissions, joined_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(projectId, userId, data.role, data.permissions, now())
      .run();
  }

  async removeMember(projectId: string, userId: string) {
    const result = await this.db
      .prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
      .bind(projectId, userId)
      .run();
    if (result.meta.changes === 0) throw new NotFoundError('Member not found');
  }

  async getMembers(projectId: string): Promise<MemberWithUser[]> {
    const members = await this.db
      .prepare(
        `SELECT pm.*, u.username, u.name, u.avatar_url, u.email
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         WHERE pm.project_id = ?
         ORDER BY pm.joined_at ASC`
      )
      .bind(projectId)
      .all<MemberWithUser>();

    return members.results;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const projects = await this.db
      .prepare(
        `SELECT p.* FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = ?
         ORDER BY p.created_at DESC`
      )
      .bind(userId)
      .all<Project>();

    return projects.results;
  }

  async updateMember(projectId: string, userId: string, data: { role?: ProjectMember['role']; permissions?: string }) {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (data.role) {
      sets.push('role = ?');
      params.push(data.role);
    }
    if (data.permissions !== undefined) {
      sets.push('permissions = ?');
      params.push(data.permissions);
    }

    if (sets.length === 0) return;

    params.push(projectId, userId);
    const result = await this.db
      .prepare(`UPDATE project_members SET ${sets.join(', ')} WHERE project_id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    if (result.meta.changes === 0) throw new NotFoundError('Member not found');
  }
}
