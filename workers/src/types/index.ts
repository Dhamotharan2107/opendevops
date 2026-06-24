export interface Env {
  DB: D1Database;
  CHAT_DO: DurableObjectNamespace;
  AGENT_DO: DurableObjectNamespace;
  TERMINAL_DO: DurableObjectNamespace;
  NOTIFICATION_DO: DurableObjectNamespace;
  JWT_SECRET: string;
  BACKBLAZE_KEY_ID: string;
  BACKBLAZE_APP_KEY: string;
  BACKBLAZE_BUCKET: string;
  BACKBLAZE_ENDPOINT: string;
  GLM_API_KEY: string;
  GLM_API_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RECAPTCHA_SECRET_KEY: string;
  FRONTEND_URL: string;
}

export interface User {
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
  is_disabled?: number;
  role?: string;
  plan?: string;
  created_at: string;
  updated_at: string;
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

export interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  tech_stack: string;
  created_by: string;
  created_at: string;
}

export interface CompanyMember {
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  repo_url?: string;
  repo_provider?: string;
  branch: string;
  status: 'creating' | 'building' | 'deployed' | 'failed' | 'stopped';
  framework?: string;
  build_command?: string;
  start_command?: string;
  environment?: string;
  tunnel_url?: string;
  created_by: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: 'owner' | 'developer' | 'viewer';
  permissions: string;
  joined_at: string;
}

export interface Deployment {
  id: string;
  project_id: string;
  version: string;
  commit_hash?: string;
  commit_message?: string;
  branch: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  logs?: string;
  created_by: string;
  created_at: string;
}

export interface AgentSession {
  id: string;
  project_id: string;
  status: 'disconnected' | 'connected' | 'busy';
  last_heartbeat: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'testing' | 'done';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface Bug {
  id: string;
  project_id: string;
  title: string;
  description: string;
  screenshot_url?: string;
  video_url?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'testing' | 'fixed' | 'closed';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BugComment {
  id: string;
  bug_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'project';
  name?: string;
  project_id?: string;
  created_by: string;
  created_at: string;
}

export interface ChatMember {
  chat_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  file_url?: string;
  file_type?: string;
  file_name?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'connection' | 'project' | 'deployment' | 'test' | 'bug' | 'message' | 'task';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  project_id?: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface APICollection {
  id: string;
  project_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface APIRequest {
  id: string;
  collection_id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: string;
  body?: string;
  created_at: string;
}

export interface AITestRun {
  id: string;
  project_id: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: string;
  created_by: string;
  created_at: string;
}

export interface ErrorLog {
  id: string;
  project_id: string;
  title: string;
  message: string;
  stack_trace?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  count: number;
  created_at: string;
  updated_at: string;
}
