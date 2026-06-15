-- Admin columns for user management
ALTER TABLE users ADD COLUMN is_disabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
CREATE INDEX IF NOT EXISTS idx_users_is_disabled ON users(is_disabled);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
