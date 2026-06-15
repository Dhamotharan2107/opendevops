import type { D1Database } from '@cloudflare/workers-types';
import type { Company, CompanyMember } from '../types';
import { NotFoundError } from '../utils/errors';
import { generateId, now } from '../utils/helpers';

interface MemberWithUser extends CompanyMember {
  username: string;
  name: string;
  avatar_url?: string;
  email: string;
}

export class CompanyRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<Company | null> {
    return this.db.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first<Company>();
  }

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const total = await this.db.prepare('SELECT COUNT(*) as total FROM companies').first<{ total: number }>();
    const companies = await this.db
      .prepare('SELECT * FROM companies ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit.toString(), offset.toString())
      .all<Company>();

    return { companies: companies.results, total: total?.total ?? 0 };
  }

  async search(query: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;

    const total = await this.db
      .prepare('SELECT COUNT(*) as total FROM companies WHERE name LIKE ? OR description LIKE ? OR tech_stack LIKE ?')
      .bind(searchPattern, searchPattern, searchPattern)
      .first<{ total: number }>();

    const companies = await this.db
      .prepare(
        'SELECT * FROM companies WHERE name LIKE ? OR description LIKE ? OR tech_stack LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .bind(searchPattern, searchPattern, searchPattern, limit.toString(), offset.toString())
      .all<Company>();

    return { companies: companies.results, total: total?.total ?? 0 };
  }

  async create(data: { name: string; description?: string; website?: string; tech_stack: string; created_by: string }) {
    const id = generateId();
    const timestamp = now();

    await this.db
      .prepare(
        'INSERT INTO companies (id, name, description, website, tech_stack, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(id, data.name, data.description ?? null, data.website ?? null, data.tech_stack, data.created_by, timestamp)
      .run();

    const company = await this.findById(id);
    if (!company) throw new NotFoundError('Company not found after creation');
    return company;
  }

  async update(id: string, data: { name?: string; description?: string; website?: string; tech_stack?: string }) {
    const existing = await this.findById(id);
    if (!existing) throw new NotFoundError('Company not found');

    const name = data.name ?? existing.name;
    const description = data.description !== undefined ? data.description : existing.description;
    const website = data.website !== undefined ? data.website : existing.website;
    const tech_stack = data.tech_stack ?? existing.tech_stack;

    await this.db
      .prepare('UPDATE companies SET name = ?, description = ?, website = ?, tech_stack = ? WHERE id = ?')
      .bind(name, description, website, tech_stack, id)
      .run();

    const company = await this.findById(id);
    if (!company) throw new NotFoundError('Company not found');
    return company;
  }

  async addMember(companyId: string, userId: string, role: CompanyMember['role']) {
    await this.db
      .prepare('INSERT INTO company_members (company_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)')
      .bind(companyId, userId, role, now())
      .run();
  }

  async removeMember(companyId: string, userId: string) {
    const result = await this.db
      .prepare('DELETE FROM company_members WHERE company_id = ? AND user_id = ?')
      .bind(companyId, userId)
      .run();
    if (result.meta.changes === 0) throw new NotFoundError('Member not found');
  }

  async getMembers(companyId: string): Promise<MemberWithUser[]> {
    const members = await this.db
      .prepare(
        `SELECT cm.*, u.username, u.name, u.avatar_url, u.email
         FROM company_members cm
         JOIN users u ON u.id = cm.user_id
         WHERE cm.company_id = ?
         ORDER BY cm.joined_at ASC`
      )
      .bind(companyId)
      .all<MemberWithUser>();

    return members.results;
  }

  async getUserCompanies(userId: string): Promise<Company[]> {
    const companies = await this.db
      .prepare(
        `SELECT c.* FROM companies c
         JOIN company_members cm ON cm.company_id = c.id
         WHERE cm.user_id = ?
         ORDER BY c.created_at DESC`
      )
      .bind(userId)
      .all<Company>();

    return companies.results;
  }

  async delete(id: string) {
    await this.db.prepare('DELETE FROM company_members WHERE company_id = ?').bind(id).run();
    const result = await this.db.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
    if (result.meta.changes === 0) throw new NotFoundError('Company not found');
  }
}
