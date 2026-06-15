import type { User } from '../types';

interface CreateUserData {
  id: string;
  username: string;
  name: string;
  email: string;
  password_hash?: string;
  auth_provider: 'email' | 'google' | 'github';
  auth_provider_id?: string;
  avatar_url?: string;
  bio?: string;
  skills: string;
  company?: string;
  experience?: string;
  website?: string;
  github?: string;
  created_at: string;
  updated_at: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  password_hash?: string;
  auth_provider?: 'email' | 'google' | 'github';
  auth_provider_id?: string;
  avatar_url?: string;
  bio?: string;
  skills?: string;
  company?: string;
  experience?: string;
  website?: string;
  github?: string;
  username?: string;
  updated_at?: string;
}

export class UserRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<User | null> {
    return this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.db
      .prepare('SELECT * FROM users WHERE username = ?')
      .bind(username)
      .first<User>();
  }

  async findByAuthProvider(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.db
      .prepare(
        'SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?',
      )
      .bind(provider, providerId)
      .first<User>();
  }

  async create(data: CreateUserData): Promise<User> {
    await this.db
      .prepare(
        `INSERT INTO users (id, username, name, email, password_hash, auth_provider, auth_provider_id, avatar_url, bio, skills, company, experience, website, github, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.id,
        data.username,
        data.name,
        data.email,
        data.password_hash || null,
        data.auth_provider,
        data.auth_provider_id || null,
        data.avatar_url || null,
        data.bio || null,
        data.skills,
        data.company || null,
        data.experience || null,
        data.website || null,
        data.github || null,
        data.created_at,
        data.updated_at,
      )
      .run();

    return (await this.findById(data.id))!;
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.password_hash);
    }
    if (data.auth_provider !== undefined) {
      fields.push('auth_provider = ?');
      values.push(data.auth_provider);
    }
    if (data.auth_provider_id !== undefined) {
      fields.push('auth_provider_id = ?');
      values.push(data.auth_provider_id);
    }
    if (data.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(data.avatar_url);
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?');
      values.push(data.bio);
    }
    if (data.skills !== undefined) {
      fields.push('skills = ?');
      values.push(data.skills);
    }
    if (data.company !== undefined) {
      fields.push('company = ?');
      values.push(data.company);
    }
    if (data.experience !== undefined) {
      fields.push('experience = ?');
      values.push(data.experience);
    }
    if (data.website !== undefined) {
      fields.push('website = ?');
      values.push(data.website);
    }
    if (data.github !== undefined) {
      fields.push('github = ?');
      values.push(data.github);
    }
    if (data.username !== undefined) {
      fields.push('username = ?');
      values.push(data.username);
    }
    fields.push('updated_at = ?');
    values.push(data.updated_at || new Date().toISOString());

    values.push(id);

    await this.db
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
  }

  async search(
    query: string,
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;
    const searchPattern = `%${query}%`;

    const countResult = await this.db
      .prepare(
        `SELECT COUNT(*) as total FROM users
         WHERE name LIKE ? OR username LIKE ? OR skills LIKE ? OR company LIKE ?`,
      )
      .bind(searchPattern, searchPattern, searchPattern, searchPattern)
      .first<{ total: number }>();

    const users = await this.db
      .prepare(
        `SELECT * FROM users
         WHERE name LIKE ? OR username LIKE ? OR skills LIKE ? OR company LIKE ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(searchPattern, searchPattern, searchPattern, searchPattern, limit, offset)
      .all<User>();

    return {
      users: users.results,
      total: countResult?.total ?? 0,
    };
  }
}
