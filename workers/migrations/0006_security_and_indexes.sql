-- 0006_security_and_indexes.sql
-- (1) Index the foreign keys that cascade on user deletion / are filtered "by user".
-- (2) Index time-ordered list tables that sort by created_at.
-- (3) Drop indexes that merely duplicate a UNIQUE constraint.
-- (4) Seed a real admin account (role-based admin replaces the old hardcoded key).

-- (1) Foreign-key indexes ------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_created_by          ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_bugs_created_by           ON bugs(created_by);
CREATE INDEX IF NOT EXISTS idx_task_comments_user        ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_comments_user         ON bug_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender           ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_by          ON chats(created_by);
CREATE INDEX IF NOT EXISTS idx_deployments_created_by    ON deployments(created_by);
CREATE INDEX IF NOT EXISTS idx_api_collections_created_by ON api_collections(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_test_runs_created_by   ON ai_test_runs(created_by);
CREATE INDEX IF NOT EXISTS idx_test_runs_created_by      ON test_runs(created_by);
CREATE INDEX IF NOT EXISTS idx_command_results_created   ON command_results(created_at);

-- (2) Composite (project/owner, created_at) indexes for "latest N" list queries --
CREATE INDEX IF NOT EXISTS idx_deployments_proj_created  ON deployments(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bugs_proj_created         ON bugs(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_proj_created        ON tasks(project_id, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_proj_created   ON error_logs(project_id, created_at);

-- (3) Drop indexes that duplicate an existing UNIQUE constraint -----------------
DROP INDEX IF EXISTS idx_env_vars_key;   -- env_vars.key is UNIQUE
DROP INDEX IF EXISTS idx_users_email;    -- users.email is UNIQUE
DROP INDEX IF EXISTS idx_users_username; -- users.username is UNIQUE

-- (4) Seed admin user ----------------------------------------------------------
-- Password: ChangeMe!Admin2026  (PBKDF2-HMAC-SHA256, 210000 iters) — CHANGE IT after first login.
INSERT OR IGNORE INTO users (id, username, name, email, password_hash, auth_provider, skills, created_at, updated_at, plan, role)
VALUES (
  'admin-user-001',
  'admin',
  'Platform Admin',
  'admin@opendrap.dev',
  'pbkdf2$210000$c1b7a0ca8ed91c39c59e62a7782bccc5$042b71d9e5169e224394a4b68f7f5415e4bddff05ff0446ea2e0bcfa67e0645e',
  'email',
  '',
  datetime('now'),
  datetime('now'),
  'enterprise',
  'admin'
);
