export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  company?: string;
  experience?: string;
  website?: string;
  github?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  role?: string;
  is_disabled?: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  repo: string;
  branch: string;
  status: 'deployed' | 'building' | 'failed' | 'stopped';
  lastDeploy: string;
  url: string;
  framework: string;
  visits: string;
  description?: string;
  members?: ProjectMember[];
  environment?: string;
}

export interface ProjectMember {
  userId: string;
  role: 'owner' | 'developer' | 'viewer';
  permissions: Permission[];
}

export interface Permission {
  deploy: boolean;
  viewLogs: boolean;
  terminalAccess: boolean;
  aiTesting: boolean;
  taskManagement: boolean;
  chatAccess: boolean;
}

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  user?: User;
}

export interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  techStack: string[];
  members: string[];
  projects: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'testing' | 'done';
  createdAt: string;
}

export interface Bug {
  id: string;
  projectId: string;
  title: string;
  description: string;
  screenshot?: string;
  video?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'testing' | 'fixed' | 'closed';
  assignedTo?: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'project';
  name?: string;
  participants: string[];
  projectId?: string;
  lastMessage?: Message;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  file?: { name: string; url: string; type: string };
  createdAt: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  version: string;
  commit: string;
  branch: string;
  status: 'success' | 'failed' | 'building';
  time: string;
}

export interface LogEntry {
  id: string;
  projectId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface ErrorRecord {
  id: string;
  projectId: string;
  title: string;
  message: string;
  stackTrace: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  lastSeen: string;
  status: 'open' | 'investigating' | 'resolved';
}

export interface AITestResult {
  id: string;
  projectId: string;
  prompt: string;
  results: AITest[];
  createdAt: string;
}

export interface AITest {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  duration: string;
  screenshot?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'connection' | 'project' | 'deployment' | 'test' | 'bug' | 'message' | 'task';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface APICollection {
  id: string;
  name: string;
  requests: APIRequest[];
}

export interface APIRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    body: string;
  };
}
