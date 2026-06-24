const BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api');

// Admin endpoints authenticate with the logged-in user's JWT; the server enforces
// the admin role. No static admin key is shipped in the client bundle anymore.
async function req<T = any>(path: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}/admin${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Request failed');
  return json.data;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email: string;
  auth_provider: string;
  avatar_url?: string;
  bio?: string;
  skills?: string;
  company?: string;
  experience?: string;
  website?: string;
  github?: string;
  role: string;
  plan: string;
  is_disabled: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  users: number;
  disabled_users: number;
  projects: number;
  deployments: number;
  open_bugs: number;
  companies: number;
  plan_free: number;
  plan_pro: number;
  plan_enterprise: number;
}

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  description: string;
  is_secret: number;
  created_at: string;
  updated_at: string;
}

export const adminApi = {
  stats: () => req<AdminStats>('/stats'),

  listUsers: (params?: { q?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return req<{ users: AdminUser[]; total: number; page: number; limit: number }>(`/users?${qs}`);
  },

  getUser: (id: string) =>
    req<{ user: AdminUser; stats: { projects: number; deployments: number } }>(`/users/${id}`),

  updateUser: (id: string, data: { is_disabled?: boolean; role?: string; plan?: string; name?: string }) =>
    req<{ user: AdminUser }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteUser: (id: string) =>
    req<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),

  // Env vars
  env: {
    list: () => req<EnvVar[]>('/env'),
    upsert: (key: string, data: { value: string; description?: string; is_secret?: boolean }) =>
      req<EnvVar>(`/env/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (key: string) =>
      req<{ message: string }>(`/env/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  },
};
