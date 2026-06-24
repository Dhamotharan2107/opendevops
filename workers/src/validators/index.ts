import { z } from 'zod';

// Auth
export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  recaptchaToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  recaptchaToken: z.string().optional(),
});

// Users
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  skills: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  experience: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  github: z.string().max(100).optional(),
});

// Companies
export const createCompanySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  tech_stack: z.string().max(500).optional(),
});

// Connections
export const sendConnectionSchema = z.object({
  receiver_id: z.string().uuid(),
});

// Projects
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  repo_url: z.string().url().optional().or(z.literal('')),
  repo_provider: z.string().max(50).optional(),
  branch: z.string().max(100).optional(),
  framework: z.string().max(50).optional(),
  build_command: z.string().max(500).optional(),
  start_command: z.string().max(500).optional(),
  environment: z.string().max(500).optional(),
  company_id: z.string().uuid().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  repo_url: z.string().url().optional().or(z.literal('')),
  repo_provider: z.string().max(50).optional(),
  branch: z.string().max(100).optional(),
  status: z.enum(['creating', 'building', 'deployed', 'failed', 'stopped']).optional(),
  framework: z.string().max(50).optional(),
  build_command: z.string().max(500).optional(),
  start_command: z.string().max(500).optional(),
  environment: z.string().max(500).optional(),
  tunnel_url: z.string().optional(),
});

// Tasks
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in-progress', 'testing', 'done']).optional(),
});

// Bugs
export const createBugSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  screenshot_url: z.string().url().optional().or(z.literal('')),
  video_url: z.string().url().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigned_to: z.string().uuid().optional(),
});

export const updateBugSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  screenshot_url: z.string().url().optional().or(z.literal('')),
  video_url: z.string().url().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in-progress', 'testing', 'fixed', 'closed']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

// Chat
export const createChatSchema = z.object({
  type: z.enum(['private', 'group', 'project']),
  name: z.string().min(1).max(100).optional(),
  project_id: z.string().uuid().optional(),
  member_ids: z.array(z.string().uuid()).min(1),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(10000),
  file_url: z.string().url().optional().or(z.literal('')),
  file_type: z.string().max(50).optional(),
  file_name: z.string().max(255).optional(),
});

// Search
export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  type: z.enum(['users', 'projects', 'tasks', 'bugs', 'all']).optional().default('all'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const searchQuerySchema = searchSchema;

// AI
export const runAITestSchema = z.object({
  prompt: z.string().min(1).max(5000),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type SendConnectionInput = z.infer<typeof sendConnectionSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateBugInput = z.infer<typeof createBugSchema>;
export type UpdateBugInput = z.infer<typeof updateBugSchema>;
export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type RunAITestInput = z.infer<typeof runAITestSchema>;
