-- IssueDesk SQLite Schema - Version 1
-- One database per repository for complete data isolation

-- Enable WAL mode for crash recovery and concurrent reads
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Metadata table
CREATE TABLE IF NOT EXISTS _meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert initial metadata
INSERT OR IGNORE INTO _meta (key, value) VALUES ('database_version', '1');

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT CHECK(state IN ('open', 'closed')) NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  github_url TEXT NOT NULL,
  sync_status TEXT CHECK(sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')) NOT NULL,
  local_updated_at INTEGER NOT NULL,
  remote_updated_at INTEGER,
  body_checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_issues_state ON issues(state);
CREATE INDEX IF NOT EXISTS idx_issues_sync_status ON issues(sync_status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  issue_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(name);

-- Issue-Label junction table
CREATE TABLE IF NOT EXISTS issue_labels (
  issue_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (issue_id, label_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_issue_labels_issue ON issue_labels(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_labels_label ON issue_labels(label_id);

-- Sync queue table
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT CHECK(entity_type IN ('issue', 'label')) NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT CHECK(operation IN ('create', 'update', 'delete')) NOT NULL,
  payload TEXT,
  created_at INTEGER NOT NULL,
  retry_after INTEGER,
  error TEXT,
  attempts INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_retry ON sync_queue(retry_after);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
