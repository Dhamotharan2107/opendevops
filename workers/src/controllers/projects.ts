import type { Context } from 'hono';
import { ProjectRepository } from '../repositories/project';
import { successResponse } from '../utils/helpers';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { createProjectSchema, updateProjectSchema } from '../validators';
import type { Env, ProjectMember } from '../types';

export async function createProject(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const body = await c.req.json();

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
  }

  const repo = new ProjectRepository(c.env.DB);
  const project = await repo.create({
    name: parsed.data.name,
    description: parsed.data.description,
    repo_url: parsed.data.repo_url,
    repo_provider: parsed.data.repo_provider,
    branch: parsed.data.branch ?? 'main',
    framework: parsed.data.framework,
    build_command: parsed.data.build_command,
    start_command: parsed.data.start_command,
    environment: parsed.data.environment,
    company_id: parsed.data.company_id,
    created_by: userId,
  });

  await repo.addMember(project.id, userId, { role: 'owner', permissions: 'all' });

  return c.json(successResponse(project, 'Project created'), 201);
}

export async function listProjects(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const repo = new ProjectRepository(c.env.DB);
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);

  const result = await repo.findAll(userId, page, limit);
  return c.json(successResponse(result));
}

export async function getProject(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')!;
  const repo = new ProjectRepository(c.env.DB);

  const project = await repo.findById(id);
  if (!project) throw new NotFoundError('Project not found');

  const members = await repo.getMembers(id);
  return c.json(successResponse({ ...project, members }));
}

export async function updateProject(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;
  const body = await c.req.json();

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
  }

  const repo = new ProjectRepository(c.env.DB);
  const project = await repo.findById(id);
  if (!project) throw new NotFoundError('Project not found');

  const members = await repo.getMembers(id);
  const currentMember = members.find((m) => m.user_id === userId);
  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'developer')) {
    throw new UnauthorizedError('Not authorized to update this project');
  }

  const updated = await repo.update(id, parsed.data);
  return c.json(successResponse(updated, 'Project updated'));
}

export async function deleteProject(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;

  const repo = new ProjectRepository(c.env.DB);
  const project = await repo.findById(id);
  if (!project) throw new NotFoundError('Project not found');

  if (project.created_by !== userId) {
    throw new UnauthorizedError('Only the owner can delete the project');
  }

  await repo.delete(id);
  return c.json(successResponse({ message: 'Project deleted' }));
}

export async function addMember(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const projectId = c.req.param('id')!;
  const body = await c.req.json<{ userId: string; role?: ProjectMember['role']; permissions?: string }>();

  if (!body.userId) throw new ValidationError('userId is required');

  const repo = new ProjectRepository(c.env.DB);
  const project = await repo.findById(projectId);
  if (!project) throw new NotFoundError('Project not found');

  const members = await repo.getMembers(projectId);
  const currentMember = members.find((m) => m.user_id === userId);
  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'developer')) {
    throw new UnauthorizedError('Not authorized to add members');
  }

  if (members.some((m) => m.user_id === body.userId)) {
    throw new ValidationError('User is already a member');
  }

  await repo.addMember(projectId, body.userId, {
    role: body.role ?? 'developer',
    permissions: body.permissions ?? 'read,write',
  });

  const updatedMembers = await repo.getMembers(projectId);
  return c.json(successResponse(updatedMembers, 'Member added'), 201);
}

export async function removeMember(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const projectId = c.req.param('id')!;
  const targetUserId = c.req.param('userId');

  const repo = new ProjectRepository(c.env.DB);
  const project = await repo.findById(projectId);
  if (!project) throw new NotFoundError('Project not found');

  const members = await repo.getMembers(projectId);
  const currentMember = members.find((m) => m.user_id === userId);
  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'developer')) {
    throw new UnauthorizedError('Not authorized to remove members');
  }

  if (targetUserId === project.created_by) {
    throw new ValidationError('Cannot remove the project owner');
  }

  await repo.removeMember(projectId, targetUserId);
  return c.json(successResponse({ message: 'Member removed' }));
}

export async function updateMember(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const projectId = c.req.param('id')!;
  const targetUserId = c.req.param('userId');
  const body = await c.req.json<{ role?: ProjectMember['role']; permissions?: string }>();

  const repo = new ProjectRepository(c.env.DB);
  const project = await repo.findById(projectId);
  if (!project) throw new NotFoundError('Project not found');

  const members = await repo.getMembers(projectId);
  const currentMember = members.find((m) => m.user_id === userId);
  if (!currentMember || currentMember.role !== 'owner') {
    throw new UnauthorizedError('Only the owner can update member roles');
  }

  if (targetUserId === project.created_by && body.role !== 'owner') {
    throw new ValidationError('Cannot change the owner role');
  }

  await repo.updateMember(projectId, targetUserId, body);
  const updatedMembers = await repo.getMembers(projectId);
  return c.json(successResponse(updatedMembers, 'Member updated'));
}
