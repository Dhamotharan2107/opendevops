import type { Context } from 'hono';
import { CompanyRepository } from '../repositories/company';
import { successResponse } from '../utils/helpers';
import { ValidationError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { createCompanySchema } from '../validators';
import type { Env } from '../types';

export async function createCompany(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const body = await c.req.json();

  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
  }

  const repo = new CompanyRepository(c.env.DB);
  const company = await repo.create({
    name: parsed.data.name,
    description: parsed.data.description,
    website: parsed.data.website,
    tech_stack: parsed.data.tech_stack ?? '',
    created_by: userId,
  });

  await repo.addMember(company.id, userId, 'owner');

  return c.json(successResponse(company, 'Company created'), 201);
}

export async function listCompanies(c: Context<{ Bindings: Env }>) {
  const repo = new CompanyRepository(c.env.DB);
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const search = c.req.query('search');

  let result: { companies: unknown[]; total: number };

  if (search) {
    result = await repo.search(search, page, limit);
  } else {
    result = await repo.findAll(page, limit);
  }

  return c.json(successResponse(result));
}

export async function getCompany(c: Context<{ Bindings: Env }>) {
  const id = c.req.param('id')!;
  const repo = new CompanyRepository(c.env.DB);

  const company = await repo.findById(id);
  if (!company) throw new NotFoundError('Company not found');

  const members = await repo.getMembers(id);

  return c.json(successResponse({ ...company, members }));
}

export async function updateCompany(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;
  const body = await c.req.json<{ name?: string; description?: string; website?: string; tech_stack?: string }>();

  const repo = new CompanyRepository(c.env.DB);
  const company = await repo.findById(id);
  if (!company) throw new NotFoundError('Company not found');

  if (company.created_by !== userId) {
    throw new UnauthorizedError('Only the owner can update the company');
  }

  const updated = await repo.update(id, body);
  return c.json(successResponse(updated, 'Company updated'));
}

export async function deleteCompany(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;

  const repo = new CompanyRepository(c.env.DB);
  const company = await repo.findById(id);
  if (!company) throw new NotFoundError('Company not found');

  if (company.created_by !== userId) {
    throw new UnauthorizedError('Only the owner can delete the company');
  }

  await repo.delete(id);
  return c.json(successResponse({ message: 'Company deleted' }));
}

export async function joinCompany(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;

  const repo = new CompanyRepository(c.env.DB);
  const company = await repo.findById(id);
  if (!company) throw new NotFoundError('Company not found');

  const members = await repo.getMembers(id);
  if (members.some((m) => m.user_id === userId)) {
    throw new ValidationError('Already a member of this company');
  }

  await repo.addMember(id, userId, 'member');
  return c.json(successResponse({ message: 'Joined company' }), 201);
}

export async function leaveCompany(c: Context<{ Bindings: Env }>) {
  const userId = c.get('userId') as string;
  const id = c.req.param('id')!;

  const repo = new CompanyRepository(c.env.DB);
  const company = await repo.findById(id);
  if (!company) throw new NotFoundError('Company not found');

  if (company.created_by === userId) {
    throw new ValidationError('Owner cannot leave the company. Transfer ownership or delete the company.');
  }

  await repo.removeMember(id, userId);
  return c.json(successResponse({ message: 'Left company' }));
}
