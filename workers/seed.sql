-- Seed data for Opendrap DevOps Platform
INSERT OR IGNORE INTO users (id, username, name, email, password_hash, auth_provider, avatar_url, bio, skills, company, experience, created_at, updated_at, plan, role)
VALUES (
  'demo-user-001',
  'demo',
  'Demo User',
  'demo@opendrap.dev',
  'd2b000ce0875cad8615dd8cf34f788635c959a0ce2b8a977e22caab745380b06',
  'email',
  'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff',
  'Demo account for Opendrap DevOps Platform',
  'Full Stack, DevOps',
  'Opendrap',
  '5 years',
  datetime('now'),
  datetime('now'),
  'pro',
  'user'
);

INSERT OR IGNORE INTO projects (id, name, description, repo_url, repo_provider, branch, status, framework, build_command, start_command, environment, created_by, company_id, created_at, updated_at)
VALUES (
  'demo-proj-001',
  'opendrap-frontend',
  'Opendrap DevOps AI Platform - Frontend application built with React, TypeScript, and Vite',
  'https://github.com/opendrap/frontend',
  'github',
  'main',
  'deployed',
  'React',
  'npm run build',
  'npm run dev',
  'production',
  'demo-user-001',
  NULL,
  datetime('now', '-7 days'),
  datetime('now', '-1 hours')
);

INSERT OR IGNORE INTO projects (id, name, description, repo_url, repo_provider, branch, status, framework, build_command, start_command, environment, created_by, company_id, created_at, updated_at)
VALUES (
  'demo-proj-002',
  'opendrap-api',
  'Opendrap DevOps AI Platform - Cloudflare Worker API with Hono framework',
  'https://github.com/opendrap/api',
  'github',
  'main',
  'deployed',
  'Hono',
  'npm run build',
  'npm run dev',
  'production',
  'demo-user-001',
  NULL,
  datetime('now', '-5 days'),
  datetime('now', '-3 hours')
);

INSERT OR IGNORE INTO projects (id, name, description, repo_url, repo_provider, branch, status, framework, build_command, start_command, environment, created_by, company_id, created_at, updated_at)
VALUES (
  'demo-proj-003',
  'opendrap-agent',
  'Opendrap DevOps AI Platform - Agent script for Cloud Shell integration',
  'https://github.com/opendrap/agent',
  'github',
  'main',
  'building',
  'Python',
  'pip install -r requirements.txt',
  'python agent.py',
  'staging',
  'demo-user-001',
  NULL,
  datetime('now', '-1 days'),
  datetime('now', '-30 minutes')
);

INSERT OR IGNORE INTO deployments (id, project_id, version, commit_hash, commit_message, branch, status, logs, created_by, created_at)
VALUES (
  'demo-dep-001',
  'demo-proj-001',
  'v2.1.0',
  'a1b2c3d4e5f6',
  'feat: add real-time agent terminal with auto-reconnect',
  'main',
  'success',
  'Build successful in 47s\nDeployed to Cloudflare Pages\nURL: https://opendevops.pages.dev',
  'demo-user-001',
  datetime('now', '-2 hours')
);

INSERT OR IGNORE INTO deployments (id, project_id, version, commit_hash, commit_message, branch, status, logs, created_by, created_at)
VALUES (
  'demo-dep-002',
  'demo-proj-001',
  'v2.0.0',
  'b2c3d4e5f6a7',
  'feat: AWS/GCP-style dashboard redesign',
  'main',
  'success',
  'Build successful in 52s\nDeployed to Cloudflare Pages',
  'demo-user-001',
  datetime('now', '-1 days')
);

INSERT OR IGNORE INTO deployments (id, project_id, version, commit_hash, commit_message, branch, status, logs, created_by, created_at)
VALUES (
  'demo-dep-003',
  'demo-proj-002',
  'v1.5.0',
  'c3d4e5f6a7b8',
  'fix: correct D1 column names in dashboard controller',
  'main',
  'success',
  'Build successful in 12s\nDeployed to Cloudflare Workers',
  'demo-user-001',
  datetime('now', '-3 hours')
);

INSERT OR IGNORE INTO deployments (id, project_id, version, commit_hash, commit_message, branch, status, logs, created_by, created_at)
VALUES (
  'demo-dep-004',
  'demo-proj-002',
  'v1.4.0',
  'd4e5f6a7b8c9',
  'feat: add agent install script endpoint',
  'main',
  'success',
  'Build successful in 11s\nDeployed to Cloudflare Workers',
  'demo-user-001',
  datetime('now', '-2 days')
);

INSERT OR IGNORE INTO deployments (id, project_id, version, commit_hash, commit_message, branch, status, logs, created_by, created_at)
VALUES (
  'demo-dep-005',
  'demo-proj-003',
  'v0.1.0',
  'e5f6a7b8c9d0',
  'Initial agent implementation with auto-reconnect',
  'main',
  'pending',
  '',
  'demo-user-001',
  datetime('now', '-30 minutes')
);

INSERT OR IGNORE INTO bugs (id, project_id, title, description, priority, status, assigned_to, created_by, created_at, updated_at)
VALUES (
  'demo-bug-001',
  'demo-proj-001',
  'Terminal WebSocket URL incorrect in production',
  'When deployed to Cloudflare Pages, the terminal tries to connect to ws://127.0.0.1:8787 instead of using the production WebSocket URL.',
  'critical',
  'fixed',
  'demo-user-001',
  'demo-user-001',
  datetime('now', '-3 days'),
  datetime('now', '-1 days')
);

INSERT OR IGNORE INTO bugs (id, project_id, title, description, priority, status, assigned_to, created_by, created_at, updated_at)
VALUES (
  'demo-bug-002',
  'demo-proj-001',
  'Dashboard shows zero for all stats',
  'The dashboard controller uses user_id column but the actual schema uses created_by. This causes all counts to return 0.',
  'high',
  'fixed',
  'demo-user-001',
  'demo-user-001',
  datetime('now', '-2 days'),
  datetime('now', '-6 hours')
);

INSERT OR IGNORE INTO bugs (id, project_id, title, description, priority, status, assigned_to, created_by, created_at, updated_at)
VALUES (
  'demo-bug-003',
  'demo-proj-002',
  'Agent auto-reconnect not working after Cloud Shell timeout',
  'The agent script exits on error due to set -e. Need to remove it and add exponential backoff.',
  'high',
  'fixed',
  'demo-user-001',
  'demo-user-001',
  datetime('now', '-1 days'),
  datetime('now', '-12 hours')
);

INSERT OR IGNORE INTO error_logs (id, project_id, title, message, stack_trace, severity, status, count, created_at, updated_at)
VALUES (
  'demo-err-001',
  'demo-proj-001',
  'WebSocket connection refused',
  'Failed to connect to ws://127.0.0.1:8787/terminal/ws - Connection refused',
  'WebSocket @ terminal.ts:42',
  'critical',
  'resolved',
  47,
  datetime('now', '-3 days'),
  datetime('now', '-1 days')
);

INSERT OR IGNORE INTO error_logs (id, project_id, title, message, stack_trace, severity, status, count, created_at, updated_at)
VALUES (
  'demo-err-002',
  'demo-proj-002',
  'D1 SQL column not found: user_id',
  'SQLITE_ERROR: no such column: user_id in statement SELECT COUNT(*) as count FROM projects WHERE user_id = ?',
  'DashboardController.getDashboard @ dashboard.ts:11',
  'high',
  'resolved',
  23,
  datetime('now', '-2 days'),
  datetime('now', '-6 hours')
);

INSERT OR IGNORE INTO error_logs (id, project_id, title, message, stack_trace, severity, status, count, created_at, updated_at)
VALUES (
  'demo-err-003',
  'demo-proj-002',
  'Agent token not found in environment',
  'OPENDRAP_AGENT_TOKEN not set when agent starts from .bashrc',
  'agent.py:156',
  'medium',
  'resolved',
  12,
  datetime('now', '-1 days'),
  datetime('now', '-6 hours')
);

INSERT OR IGNORE INTO error_logs (id, project_id, title, message, stack_trace, severity, status, count, created_at, updated_at)
VALUES (
  'demo-err-004',
  'demo-proj-001',
  'Failed to deploy frontend - Pages API timeout',
  'Cloudflare Pages API returned 504 Gateway Timeout during deployment',
  'deploy.yml:34',
  'low',
  'open',
  3,
  datetime('now', '-4 hours'),
  datetime('now', '-4 hours')
);

INSERT OR IGNORE INTO activity_logs (id, user_id, project_id, action, details, created_at)
SELECT 'demo-act-001', 'demo-user-001', 'demo-proj-001', 'deployment_success', 'Deployed opendrap-frontend v2.1.0 to production', datetime('now', '-2 hours')
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE id = 'demo-act-001');

INSERT OR IGNORE INTO activity_logs (id, user_id, project_id, action, details, created_at)
SELECT 'demo-act-002', 'demo-user-001', 'demo-proj-002', 'deployment_success', 'Deployed opendrap-api v1.5.0 to production', datetime('now', '-3 hours')
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE id = 'demo-act-002');

INSERT OR IGNORE INTO activity_logs (id, user_id, project_id, action, details, created_at)
SELECT 'demo-act-003', 'demo-user-001', 'demo-proj-003', 'project_created', 'Created project opendrap-agent', datetime('now', '-1 days')
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE id = 'demo-act-003');

INSERT OR IGNORE INTO activity_logs (id, user_id, project_id, action, details, created_at)
SELECT 'demo-act-004', 'demo-user-001', 'demo-proj-001', 'bug_fixed', 'Fixed: Terminal WebSocket URL incorrect in production', datetime('now', '-1 days')
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE id = 'demo-act-004');

INSERT OR IGNORE INTO activity_logs (id, user_id, project_id, action, details, created_at)
SELECT 'demo-act-005', 'demo-user-001', 'demo-proj-002', 'bug_fixed', 'Fixed: Dashboard shows zero for all stats', datetime('now', '-6 hours')
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE id = 'demo-act-005');

INSERT OR IGNORE INTO activity_logs (id, user_id, project_id, action, details, created_at)
SELECT 'demo-act-006', 'demo-user-001', NULL, 'user_login', 'User logged in from dashboard', datetime('now', '-5 minutes')
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE id = 'demo-act-006');

INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, link, read, created_at)
SELECT 'demo-not-001', 'demo-user-001', 'deployment', 'Deployment Successful', 'opendrap-frontend v2.1.0 deployed to production', '/dashboard/projects/demo-proj-001', 1, datetime('now', '-2 hours')
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = 'demo-not-001');

INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, link, read, created_at)
SELECT 'demo-not-002', 'demo-user-001', 'bug', 'Bug Fixed', 'Critical bug "Terminal WebSocket URL" has been fixed', '/dashboard/bugs/demo-bug-001', 1, datetime('now', '-1 days')
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = 'demo-not-002');

INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, link, read, created_at)
SELECT 'demo-not-003', 'demo-user-001', 'project', 'New Project Created', 'Project "opendrap-agent" created successfully', '/dashboard/projects/demo-proj-003', 0, datetime('now', '-1 days')
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = 'demo-not-003');

INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, link, read, created_at)
SELECT 'demo-not-004', 'demo-user-001', 'deployment', 'Deployment Pending', 'opendrap-agent v0.1.0 is waiting to be deployed', '/dashboard/projects/demo-proj-003', 0, datetime('now', '-30 minutes')
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = 'demo-not-004');

INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, link, read, created_at)
SELECT 'demo-not-005', 'demo-user-001', 'deployment', 'Deployment Successful', 'opendrap-api v1.5.0 deployed to production', '/dashboard/projects/demo-proj-002', 0, datetime('now', '-3 hours')
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = 'demo-not-005');

INSERT OR IGNORE INTO agent_sessions (id, project_id, status, last_heartbeat, created_at)
SELECT 'demo-agent-001', 'demo-proj-001', 'connected', datetime('now'), datetime('now', '-1 hours')
WHERE NOT EXISTS (SELECT 1 FROM agent_sessions WHERE id = 'demo-agent-001');
