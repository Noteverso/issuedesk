# Data Model: GitHub Issues Management App

**Feature**: 001-issues-management  
**Date**: 2025-10-26  
**Status**: Draft

## Overview

This document defines the data model for the GitHub Issues Management desktop application. The application uses **SQLite** for per-repository storage (offline-first) and **electron-store** for global app settings.

## Storage Architecture

### Multi-Repository Cache Strategy

Each GitHub repository gets its own isolated SQLite database file:

```
~/Library/Application Support/IssueDesk/repositories/
├── github-octocat-hello-world.db
├── microsoft-vscode.db
└── facebook-react.db
```

**Naming Convention**: `{owner}-{repo}.db` (sanitized for filesystem)

**Benefits**:
- Complete data isolation between repositories
- Easy backup/restore per repository
- No cross-repository query complexity
- Scales indefinitely (adding repos doesn't slow existing ones)

### Global Settings Storage

electron-store is used for app-wide settings:

```
~/Library/Application Support/IssueDesk/config.json (encrypted)
```

**Contents**:
- Active repository ID
- GitHub token (encrypted via OS keychain)
- Theme preference (light/dark)
- Editor mode preference (code/preview)
- View preferences (list/card)
- Rate limit state

---

## Entities

### 1. Issue

Represents a GitHub issue with local sync state.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 generated locally |
| `number` | INTEGER | UNIQUE, NOT NULL | GitHub issue number (auto-increment by GitHub) |
| `title` | TEXT | NOT NULL | Issue title (max 256 chars) |
| `body` | TEXT | NULLABLE | Markdown content |
| `state` | TEXT | CHECK IN ('open', 'closed') | Issue state |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (milliseconds) when issue created on GitHub |
| `updated_at` | INTEGER | NOT NULL | Unix timestamp (ms) when issue last updated on GitHub |
| `github_url` | TEXT | NOT NULL | Full URL to issue on GitHub (e.g., `https://github.com/owner/repo/issues/42`) |
| `sync_status` | TEXT | CHECK IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict') | Sync state |
| `local_updated_at` | INTEGER | NOT NULL | Unix timestamp (ms) of last local modification |
| `remote_updated_at` | INTEGER | NULLABLE | Unix timestamp (ms) from GitHub API (used for conflict detection) |
| `body_checksum` | TEXT | NULLABLE | SHA-256 hash of body content (for conflict detection) |

**Indexes**:
```sql
CREATE INDEX idx_issues_state ON issues(state);
CREATE INDEX idx_issues_sync_status ON issues(sync_status);
CREATE INDEX idx_issues_created_at ON issues(created_at); -- For analytics
```

**Relationships**:
- Many-to-Many with `Label` via `issue_labels`

**Validation Rules** (Zod schema):
```typescript
const IssueSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  title: z.string().min(1).max(256),
  body: z.string().nullable(),
  state: z.enum(['open', 'closed']),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  github_url: z.string().url(),
  sync_status: z.enum(['synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict']),
  local_updated_at: z.number().int().positive(),
  remote_updated_at: z.number().int().positive().nullable(),
  body_checksum: z.string().nullable(),
});
```

**State Transitions**:
```
[Create Locally] → pending_create → [Sync Success] → synced
                                  → [Sync Fail] → pending_create (retry)

synced → [Edit Locally] → pending_update → [Sync Success] → synced
                                         → [Sync Conflict] → conflict

synced → [Delete Locally] → pending_delete → [Sync Success] → (removed from DB)
                                           → [Sync Fail] → pending_delete (retry)

conflict → [User Resolves] → pending_update → synced
```

---

### 2. Label

Represents a GitHub label with usage statistics.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 generated locally |
| `name` | TEXT | UNIQUE, NOT NULL | Label name (e.g., "bug", "enhancement") |
| `color` | TEXT | NOT NULL | Hex color without `#` (e.g., "d73a4a") |
| `description` | TEXT | NULLABLE | Optional label description |
| `issue_count` | INTEGER | DEFAULT 0 | Cached count of issues with this label (updated on sync) |

**Indexes**:
```sql
CREATE INDEX idx_labels_name ON labels(name); -- For filtering
```

**Relationships**:
- Many-to-Many with `Issue` via `issue_labels`

**Validation Rules**:
```typescript
const LabelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/), // Hex color
  description: z.string().max(100).nullable(),
  issue_count: z.number().int().nonnegative(),
});
```

---

### 3. IssueLabel (Junction Table)

Links issues to labels (many-to-many relationship).

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `issue_id` | TEXT | FOREIGN KEY → issues(id), NOT NULL | Issue ID |
| `label_id` | TEXT | FOREIGN KEY → labels(id), NOT NULL | Label ID |

**Primary Key**: `(issue_id, label_id)`

**Constraints**:
```sql
PRIMARY KEY (issue_id, label_id),
FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
```

**Indexes**:
```sql
CREATE INDEX idx_issue_labels_issue ON issue_labels(issue_id);
CREATE INDEX idx_issue_labels_label ON issue_labels(label_id);
```

---

### 4. SyncQueue

Tracks pending operations to sync with GitHub.

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Queue entry ID |
| `entity_type` | TEXT | CHECK IN ('issue', 'label'), NOT NULL | Type of entity |
| `entity_id` | TEXT | NOT NULL | ID of entity (issue.id or label.id) |
| `operation` | TEXT | CHECK IN ('create', 'update', 'delete'), NOT NULL | Operation to perform |
| `payload` | TEXT | NULLABLE | JSON-serialized data for operation |
| `created_at` | INTEGER | NOT NULL | Unix timestamp (ms) when queued |
| `retry_after` | INTEGER | NULLABLE | Unix timestamp (ms) to retry after (for rate-limited ops) |
| `error` | TEXT | NULLABLE | Last error message (if sync failed) |
| `attempts` | INTEGER | DEFAULT 0 | Retry attempt counter |

**Indexes**:
```sql
CREATE INDEX idx_sync_queue_retry ON sync_queue(retry_after);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
```

**Processing Logic**:
1. On reconnect or rate limit reset, query `sync_queue` WHERE `retry_after IS NULL OR retry_after <= NOW()`
2. Process in FIFO order (`ORDER BY created_at ASC`)
3. On success: DELETE entry
4. On conflict: UPDATE entity `sync_status = 'conflict'`, DELETE queue entry, notify user
5. On rate limit: UPDATE `retry_after` to `X-RateLimit-Reset` timestamp
6. On other error: INCREMENT `attempts`, UPDATE `error` field, retry with exponential backoff

---

### 5. Repository (Metadata)

Stored per SQLite database (embedded in `_meta` table).

**Attributes**:

| Field | Type | Description |
|-------|------|-------------|
| `owner` | TEXT | GitHub repository owner (e.g., "octocat") |
| `name` | TEXT | Repository name (e.g., "hello-world") |
| `full_name` | TEXT | Combined "owner/name" |
| `last_sync_at` | INTEGER | Unix timestamp (ms) of last successful sync |
| `database_version` | INTEGER | Schema version for migrations |

**Storage**:
```sql
CREATE TABLE _meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Example rows:
-- ('owner', 'octocat')
-- ('name', 'hello-world')
-- ('last_sync_at', '1698765432000')
-- ('database_version', '1')
```

---

### 6. Settings (Global)

Stored in electron-store (not SQLite).

**TypeScript Interface**:
```typescript
interface AppSettings {
  activeRepositoryId: string | null; // e.g., "github-octocat-hello-world"
  repositories: RepositoryConfig[]; // List of configured repos
  theme: 'light' | 'dark';
  editorMode: 'code' | 'preview';
  viewPreferences: {
    issues: 'list' | 'card';
    labels: 'list' | 'card';
  };
  rateLimit: {
    remaining: number;
    limit: number;
    reset: number; // Unix timestamp
  } | null;
}

interface RepositoryConfig {
  id: string; // e.g., "github-octocat-hello-world"
  owner: string;
  name: string;
  dbPath: string; // Absolute path to SQLite file
  lastSyncAt: number | null;
}
```

**Validation** (Zod):
```typescript
const SettingsSchema = z.object({
  activeRepositoryId: z.string().nullable(),
  repositories: z.array(z.object({
    id: z.string(),
    owner: z.string(),
    name: z.string(),
    dbPath: z.string(),
    lastSyncAt: z.number().nullable(),
  })),
  theme: z.enum(['light', 'dark']),
  editorMode: z.enum(['code', 'preview']),
  viewPreferences: z.object({
    issues: z.enum(['list', 'card']),
    labels: z.enum(['list', 'card']),
  }),
  rateLimit: z.object({
    remaining: z.number(),
    limit: z.number(),
    reset: z.number(),
  }).nullable(),
});
```

---

## Complete SQLite Schema

```sql
-- Enable WAL mode for crash recovery
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Metadata table
CREATE TABLE _meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Issues table
CREATE TABLE issues (
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

CREATE INDEX idx_issues_state ON issues(state);
CREATE INDEX idx_issues_sync_status ON issues(sync_status);
CREATE INDEX idx_issues_created_at ON issues(created_at);

-- Labels table
CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  issue_count INTEGER DEFAULT 0
);

CREATE INDEX idx_labels_name ON labels(name);

-- Issue-Label junction table
CREATE TABLE issue_labels (
  issue_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (issue_id, label_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE INDEX idx_issue_labels_issue ON issue_labels(issue_id);
CREATE INDEX idx_issue_labels_label ON issue_labels(label_id);

-- Sync queue table
CREATE TABLE sync_queue (
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

CREATE INDEX idx_sync_queue_retry ON sync_queue(retry_after);
CREATE INDEX idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
```

---

## Data Access Patterns

### Common Queries

**1. List all open issues with labels**:
```sql
SELECT 
  i.*,
  GROUP_CONCAT(l.name) as label_names,
  GROUP_CONCAT(l.color) as label_colors
FROM issues i
LEFT JOIN issue_labels il ON i.id = il.issue_id
LEFT JOIN labels l ON il.label_id = l.id
WHERE i.state = 'open'
GROUP BY i.id
ORDER BY i.created_at DESC;
```

**2. Filter issues by label**:
```sql
SELECT DISTINCT i.*
FROM issues i
INNER JOIN issue_labels il ON i.id = il.issue_id
INNER JOIN labels l ON il.label_id = l.id
WHERE l.name = ?
ORDER BY i.created_at DESC;
```

**3. Search issues by title**:
```sql
SELECT * FROM issues
WHERE title LIKE '%' || ? || '%'
ORDER BY created_at DESC;
```

**4. Get pending sync operations**:
```sql
SELECT * FROM sync_queue
WHERE retry_after IS NULL OR retry_after <= ?
ORDER BY created_at ASC;
```

**5. Dashboard analytics - 7-day trend**:
```sql
SELECT 
  DATE(created_at / 1000, 'unixepoch') as date,
  COUNT(*) as count
FROM issues
WHERE created_at >= (strftime('%s', 'now') - 7*24*60*60) * 1000
GROUP BY date
ORDER BY date;
```

---

## Migration Strategy

**Version 1 (Initial)**:
- Create all tables as defined above
- Insert metadata: `('database_version', '1')`

**Future Migrations**:
- Track version in `_meta` table
- Run migration scripts on database open if `database_version < CURRENT_VERSION`
- Use transaction-wrapped ALTER TABLE statements

**Example Migration Flow**:
```typescript
function runMigrations(db: Database): void {
  const currentVersion = parseInt(db.prepare("SELECT value FROM _meta WHERE key = 'database_version'").get()?.value || '0', 10);
  
  if (currentVersion < 1) {
    // Initial schema (already created)
    db.exec(INITIAL_SCHEMA);
    db.prepare("INSERT INTO _meta (key, value) VALUES ('database_version', '1')").run();
  }
  
  // Future: if (currentVersion < 2) { ... }
}
```

---

## Conflict Detection Algorithm

**On Sync**:
1. Fetch issue from GitHub API (includes `updated_at` timestamp)
2. Compare with local `remote_updated_at`:
   - If `remote_updated_at` is NULL: First sync, no conflict
   - If `remote_updated_at === github.updated_at`: No remote changes, safe to push local
   - If `remote_updated_at !== github.updated_at` AND `sync_status !== 'synced'`: **CONFLICT**
3. If conflict:
   - Update `sync_status = 'conflict'`
   - Store both versions in temporary conflict table
   - Send IPC notification to renderer to show conflict UI
4. User resolves conflict:
   - "Keep Local": Push local to GitHub, update `remote_updated_at`
   - "Accept Remote": Overwrite local with GitHub data, set `sync_status = 'synced'`
   - "Manual Merge": User edits in conflict modal, then push merged version

---

## Performance Considerations

- **Indexes**: Created on frequently filtered columns (state, sync_status, created_at, label names)
- **WAL mode**: Enables concurrent reads while writing (important for UI responsiveness)
- **Prepared statements**: Reuse compiled SQL for repeated queries
- **Transaction batching**: Bulk inserts/updates in single transaction for sync operations
- **Lazy loading**: Fetch issues in pages (50 per page) for large repositories
- **Label count caching**: Denormalized `issue_count` to avoid expensive JOINs on every label list

---

## Next Steps

1. Generate IPC contracts (`/contracts/ipc.yaml`) defining API surface between main/renderer
2. Create `quickstart.md` for setting up development database
3. Implement database repository classes in `apps/desktop/src/main/database/repositories/`
