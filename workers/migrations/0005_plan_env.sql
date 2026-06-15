-- Add subscription plan to users (default free)
ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- App-level env vars stored and managed in admin panel
CREATE TABLE IF NOT EXISTS env_vars (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  key        TEXT NOT NULL UNIQUE,
  value      TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  is_secret  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_env_vars_key ON env_vars(key);
