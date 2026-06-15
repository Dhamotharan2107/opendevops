-- 22. TEST RUNS
CREATE TABLE IF NOT EXISTS test_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','completed','failed')),
  test_results TEXT,
  screenshots TEXT,
  video_url TEXT,
  duration INTEGER,
  config TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_test_runs_project ON test_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_status ON test_runs(status);
