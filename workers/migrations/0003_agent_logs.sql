-- 23. AGENT LOGS
CREATE TABLE IF NOT EXISTS agent_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  log TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_agent_logs_project ON agent_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at);

-- 24. COMMAND RESULTS
CREATE TABLE IF NOT EXISTS command_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  command TEXT NOT NULL,
  output TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_command_results_session ON command_results(session_id);
