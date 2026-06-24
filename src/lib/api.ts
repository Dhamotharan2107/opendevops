export const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api';
export const DEMO_TOKEN = 'opendrap-demo-2024';

export function getOAuthUrl(provider: 'google' | 'github') {
  const redirect = encodeURIComponent(`${window.location.origin}/auth/callback`);
  return `${BASE_URL}/auth/${provider}?redirect_uri=${redirect}`;
}

export const DEMO_USER = {
  id: 'demo-1',
  username: 'johndoe',
  name: 'John Doe',
  email: 'john@example.com',
  bio: 'Full-stack developer building with Opendrap',
  skills: ['React', 'Node.js', 'Docker', 'Kubernetes', 'TypeScript'],
  company: 'Opendrap Inc.',
  experience: 'senior',
  website: 'https://johndoe.dev',
  github: 'johndoe',
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

export const DEMO_PROJECTS = [
  {
    id: 'p1', name: 'storefront-web', repo: 'github.com/johndoe/storefront-web',
    branch: 'main', status: 'deployed', lastDeploy: '2h ago',
    url: 'https://storefront.example.io', framework: 'nextjs', visits: '12.4K',
    description: 'E-commerce storefront built with Next.js', members: [], environment: 'production',
  },
  {
    id: 'p2', name: 'api-gateway', repo: 'github.com/johndoe/api-gateway',
    branch: 'main', status: 'deployed', lastDeploy: '5h ago',
    url: 'https://api.example.io', framework: 'express', visits: '87.2K',
    description: 'RESTful API gateway with rate limiting', members: [], environment: 'production',
  },
  {
    id: 'p3', name: 'admin-panel', repo: 'github.com/johndoe/admin-panel',
    branch: 'develop', status: 'building', lastDeploy: '15m ago',
    url: 'https://admin.example.io', framework: 'react', visits: '2.1K',
    description: 'Internal admin dashboard', members: [], environment: 'staging',
  },
  {
    id: 'p4', name: 'ml-pipeline', repo: 'github.com/johndoe/ml-pipeline',
    branch: 'main', status: 'failed', lastDeploy: '3d ago',
    url: '', framework: 'python', visits: '—',
    description: 'Machine learning inference pipeline', members: [], environment: 'production',
  },
  {
    id: 'p5', name: 'mobile-backend', repo: 'github.com/johndoe/mobile-backend',
    branch: 'release/v2', status: 'deployed', lastDeploy: '1d ago',
    url: 'https://mobile-api.example.io', framework: 'fastapi', visits: '41.8K',
    description: 'Backend services for mobile app', members: [], environment: 'production',
  },
  {
    id: 'p6', name: 'docs-site', repo: 'github.com/johndoe/docs-site',
    branch: 'main', status: 'deployed', lastDeploy: '7d ago',
    url: 'https://docs.example.io', framework: 'astro', visits: '5.3K',
    description: 'Public documentation website', members: [], environment: 'production',
  },
];

export const DEMO_DEPLOYMENTS = [
  { id: 'd1', projectId: 'p1', version: 'v1.4.2', commit: 'a3f8b12', branch: 'main', status: 'success', time: '2h ago' },
  { id: 'd2', projectId: 'p3', version: 'v0.9.1', commit: 'c9d1e45', branch: 'develop', status: 'building', time: '15m ago' },
  { id: 'd3', projectId: 'p2', version: 'v2.1.0', commit: '7b4a3f2', branch: 'main', status: 'success', time: '5h ago' },
  { id: 'd4', projectId: 'p4', version: 'v1.2.0', commit: 'e5d8c11', branch: 'main', status: 'failed', time: '3d ago' },
  { id: 'd5', projectId: 'p5', version: 'v2.0.3', commit: 'f2c7a89', branch: 'release/v2', status: 'success', time: '1d ago' },
  { id: 'd6', projectId: 'p6', version: 'v1.0.8', commit: '3a5b6d0', branch: 'main', status: 'success', time: '7d ago' },
  { id: 'd7', projectId: 'p1', version: 'v1.4.1', commit: '8e2f91c', branch: 'main', status: 'success', time: '2d ago' },
];

export const DEMO_ERRORS = [
  { id: 'e1', projectId: 'p4', title: 'ModuleNotFoundError', message: "ModuleNotFoundError: No module named 'torch'", stackTrace: 'Traceback (most recent call last):\n  File "main.py", line 3, in <module>\n    import torch\nModuleNotFoundError: No module named \'torch\'', count: 47, severity: 'critical', lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'open' },
  { id: 'e2', projectId: 'p1', title: 'TypeError: Cannot read properties of undefined', message: "TypeError: Cannot read properties of undefined (reading 'price')", stackTrace: 'TypeError: Cannot read properties of undefined (reading \'price\')\n    at ProductCard (components/ProductCard.tsx:45:28)\n    at renderWithHooks', count: 12, severity: 'high', lastSeen: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), status: 'investigating' },
  { id: 'e3', projectId: 'p2', title: 'RateLimitError', message: 'Too many requests from IP 192.168.1.1', stackTrace: 'RateLimitError: limit exceeded\n    at RateLimiter.check (middleware/rateLimiter.js:23)\n    at Layer.handle', count: 234, severity: 'medium', lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(), status: 'open' },
  { id: 'e4', projectId: 'p5', title: 'DatabaseConnectionTimeout', message: 'Connection to PostgreSQL timed out after 5000ms', stackTrace: 'Error: Connection timeout\n    at Pool.connect (node_modules/pg/lib/pool.js:89)\n    at UserRepository.findById', count: 8, severity: 'high', lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'resolved' },
];

function getToken() {
  return localStorage.getItem('token');
}

export function isDemoMode() {
  return getToken() === DEMO_TOKEN;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json() as { success: boolean; data: T; message?: string };
  if (!res.ok || !data.success) {
    throw new Error((data as any).message || (data as any).error || 'Request failed');
  }
  return data.data;
}

export async function apiLogin(email: string, password: string, recaptchaToken?: string) {
  const data = await request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, recaptchaToken }),
  });
  localStorage.setItem('token', data.token);
  return data;
}

export async function apiDemoLogin() {
  localStorage.setItem('token', DEMO_TOKEN);
  return { token: DEMO_TOKEN, user: DEMO_USER };
}

export async function apiRegister(username: string, name: string, email: string, password: string, recaptchaToken?: string) {
  const data = await request<{ token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, name, email, password, recaptchaToken }),
  });
  localStorage.setItem('token', data.token);
  return data;
}

export async function apiMe() {
  if (isDemoMode()) return { user: DEMO_USER };
  return request<{ user: any }>('/auth/me');
}

export async function apiExchangeGoogleCode(code: string) {
  if (isDemoMode()) return { token: DEMO_TOKEN, user: DEMO_USER };
  const data = await request<{ token: string; user: any }>('/auth/google/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  localStorage.setItem('token', data.token);
  return data;
}

export async function apiLogout() {
  await request('/auth/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('token');
}

export async function apiGetProjects(page = 1, limit = 20) {
  if (isDemoMode()) return { projects: DEMO_PROJECTS, total: DEMO_PROJECTS.length };
  return request<{ projects: any[]; total: number }>(`/projects?page=${page}&limit=${limit}`);
}

export async function apiGetDeployments(projectId: string) {
  if (isDemoMode()) return DEMO_DEPLOYMENTS.filter(d => d.projectId === projectId);
  return request<any[]>(`/projects/${projectId}/deployments`);
}

export async function apiGetNotifications() {
  if (isDemoMode()) return { notifications: [] };
  return request<{ notifications: any[] }>('/notifications');
}

export async function apiGetTasks(projectId?: string) {
  if (isDemoMode()) return { tasks: [] };
  const q = projectId ? `?project_id=${projectId}` : '';
  return request<{ tasks: any[] }>(`/tasks${q}`);
}

export async function apiGetBugs(projectId?: string) {
  if (isDemoMode()) return { bugs: [] };
  const q = projectId ? `?project_id=${projectId}` : '';
  return request<{ bugs: any[] }>(`/bugs${q}`);
}

export async function apiGetChats() {
  if (isDemoMode()) return { chats: [] };
  return request<{ chats: any[] }>('/chat');
}

export async function apiGetChatMessages(chatId: string, page = 1) {
  if (isDemoMode()) return { messages: [] };
  return request<{ messages: any[] }>(`/chat/${chatId}/messages?page=${page}&limit=50`);
}

export async function apiSendMessage(chatId: string, text: string) {
  if (isDemoMode()) return { message: { id: Date.now().toString(), chatId, senderId: 'demo-1', text, createdAt: new Date().toISOString() } };
  return request<{ message: any }>(`/chat/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function apiCreateChat(type: string, memberIds: string[], name?: string) {
  if (isDemoMode()) return { id: 'demo-chat-' + Date.now() };
  return request<{ id: string }>('/chat', {
    method: 'POST',
    body: JSON.stringify({ type, member_ids: memberIds, name }),
  });
}

export async function apiGetConnections() {
  if (isDemoMode()) return { connections: [] };
  return request<{ connections: any[] }>('/connections');
}

export async function apiSendConnectionRequest(receiverId: string) {
  if (isDemoMode()) return {};
  return request<any>('/connections/request', {
    method: 'POST',
    body: JSON.stringify({ receiverId }),
  });
}

export async function apiAcceptConnection(connectionId: string) {
  if (isDemoMode()) return {};
  return request<any>('/connections/accept', {
    method: 'POST',
    body: JSON.stringify({ connectionId }),
  });
}

export async function apiRejectConnection(connectionId: string) {
  if (isDemoMode()) return {};
  return request<any>('/connections/reject', {
    method: 'POST',
    body: JSON.stringify({ connectionId }),
  });
}

export async function apiRemoveConnection(id: string) {
  if (isDemoMode()) return {};
  return request<any>(`/connections/${id}`, { method: 'DELETE' });
}

export async function apiGetCompanies() {
  if (isDemoMode()) return { companies: [] };
  return request<{ companies: any[] }>('/companies');
}

export async function apiCreateCompany(data: { name: string; description: string; website: string; tech_stack: string }) {
  if (isDemoMode()) return {};
  return request<any>('/companies', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiJoinCompany(id: string) {
  if (isDemoMode()) return {};
  return request<any>(`/companies/${id}/join`, { method: 'POST' });
}

export async function apiLeaveCompany(id: string) {
  if (isDemoMode()) return {};
  return request<any>(`/companies/${id}/leave`, { method: 'POST' });
}

export async function apiGetTasks2(projectId?: string) {
  return apiGetTasks(projectId);
}

export async function apiCreateTask(data: any) {
  if (isDemoMode()) return { task: { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() } };
  return request<{ task: any }>('/tasks', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateTask(id: string, data: any) {
  if (isDemoMode()) return {};
  return request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiDeleteTask(id: string) {
  if (isDemoMode()) return {};
  return request<any>(`/tasks/${id}`, { method: 'DELETE' });
}

export async function apiGetBugs2(projectId?: string) {
  return apiGetBugs(projectId);
}

export async function apiCreateBug(data: any) {
  if (isDemoMode()) return { bug: { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() } };
  return request<{ bug: any }>('/bugs', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiUpdateBug(id: string, data: any) {
  if (isDemoMode()) return {};
  return request<any>(`/bugs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiDeleteBug(id: string) {
  if (isDemoMode()) return {};
  return request<any>(`/bugs/${id}`, { method: 'DELETE' });
}

export async function apiGetBugComments(bugId: string) {
  if (isDemoMode()) return { comments: [] };
  return request<{ comments: any[] }>(`/bugs/${bugId}`);
}

export async function apiAddBugComment(bugId: string, text: string) {
  if (isDemoMode()) return {};
  return request<any>(`/bugs/${bugId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function apiUpdateProfile(id: string, data: any) {
  if (isDemoMode()) return { user: { ...DEMO_USER, ...data } };
  return request<{ user: any }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export async function apiSearchUsers(q: string) {
  if (isDemoMode()) return { users: [], companies: [], projects: DEMO_PROJECTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase())) };
  return request<{ users: any[]; companies: any[]; projects: any[] }>(`/search?q=${encodeURIComponent(q)}`);
}

export async function apiCreateProject(data: any) {
  if (isDemoMode()) {
    return {
      id: 'p' + Date.now(),
      ...data,
      status: 'building',
      lastDeploy: new Date().toISOString(),
      url: '',
      visits: '0',
      members: [],
    };
  }
  return request<any>('/projects', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiGetProject(id: string) {
  if (isDemoMode()) return DEMO_PROJECTS.find(p => p.id === id) || null;
  return request<any>(`/projects/${id}`);
}

export async function apiGetDashboard() {
  if (isDemoMode()) {
    return {
      user: DEMO_USER,
      stats: {
        totalProjects: DEMO_PROJECTS.length,
        totalDeployments: DEMO_DEPLOYMENTS.length,
        totalErrors: DEMO_ERRORS.length,
        openBugs: 3,
      },
      recentProjects: DEMO_PROJECTS.slice(0, 5),
      recentDeployments: DEMO_DEPLOYMENTS.slice(0, 5),
      recentActivity: [],
      notifications: [],
    };
  }
  return request<any>('/dashboard');
}

export async function apiGetLogs(projectId = 'default', level?: string, search?: string, page = 1, limit = 50) {
  if (isDemoMode()) return { logs: [], total: 0 };
  const q = new URLSearchParams({ projectId, page: String(page), limit: String(limit) });
  if (level) q.set('level', level);
  if (search) q.set('search', search);
  return request<{ logs: any[]; total: number }>(`/logs?${q}`);
}

export async function apiGetErrors(projectId = 'default', severity?: string, status?: string, page = 1, limit = 50) {
  if (isDemoMode()) return { errors: [], total: 0 };
  const q = new URLSearchParams({ projectId, page: String(page), limit: String(limit) });
  if (severity) q.set('severity', severity);
  if (status) q.set('status', status);
  return request<{ errors: any[]; total: number }>(`/errors?${q}`);
}

export async function apiUpdateError(id: string, data: { status?: string; severity?: string; title?: string; message?: string }) {
  if (isDemoMode()) return { error: { id, ...data } };
  return request<any>(`/errors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function hasToken() {
  return !!localStorage.getItem('token');
}

export function getGitHubPat() {
  return localStorage.getItem('github_pat') || '';
}

export function saveGitHubPat(pat: string) {
  localStorage.setItem('github_pat', pat);
}

export function clearGitHubPat() {
  localStorage.removeItem('github_pat');
}

export async function githubFetchRepos(pat: string): Promise<any[]> {
  const res = await fetch(
    'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
    { headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (!res.ok) throw new Error('Invalid token or GitHub API error');
  return res.json();
}

export async function githubFetchBranches(pat: string, fullName: string): Promise<string[]> {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/branches?per_page=100`,
    { headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' } }
  );
  if (!res.ok) throw new Error('Could not fetch branches');
  const data = await res.json();
  return data.map((b: any) => b.name);
}

export async function githubFetchUser(pat: string): Promise<any> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${pat}`, Accept: 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error('Invalid token');
  return res.json();
}
