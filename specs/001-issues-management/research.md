# Research: GitHub Issues Management App

**Feature**: 001-issues-management  
**Date**: 2025-10-26  
**Status**: Complete

## Overview

This document captures research findings and technology decisions for implementing the GitHub Issues Management desktop application.

## Research Tasks

### 1. IPC Contract Testing Strategy

**Decision**: Use Vitest for unit tests + Playwright for E2E IPC validation

**Rationale**:
- **Vitest**: Fast, TypeScript-native, Vite-compatible test runner for unit testing IPC handlers, database layer, and React components
- **Playwright**: Electron-compatible E2E testing framework that can test actual IPC communication between main and renderer processes
- **Type-safe contracts**: Define IPC API surface in `@issuedesk/shared` types, validate at runtime with Zod schemas

**Alternatives Considered**:
- **Jest**: Slower than Vitest, requires additional config for ESM/TypeScript in Electron context
- **Spectron** (deprecated): Official Electron testing tool, but archived in favor of Playwright
- **Manual testing only**: Risky for IPC contracts; automated tests prevent regressions

**Implementation Approach**:
```typescript
// packages/shared/src/types/ipc.ts
export interface IpcApi {
  issues: {
    list: (filter: IssueFilter) => Promise<Issue[]>;
    create: (data: CreateIssueInput) => Promise<Issue>;
    update: (id: string, data: UpdateIssueInput) => Promise<Issue>;
    delete: (id: string) => Promise<void>;
  };
  // ... other namespaces
}

// tests/contract/ipc.spec.ts
describe('IPC Contract', () => {
  it('issues.list returns valid Issue array', async () => {
    const result = await window.api.issues.list({});
    expect(result).toBeInstanceOf(Array);
    result.forEach(issue => {
      expect(() => IssueSchema.parse(issue)).not.toThrow();
    });
  });
});
```

---

### 2. SQLite Multi-Repository Cache Management

**Decision**: One SQLite file per repository with centralized DatabaseManager

**Rationale**:
- **Isolation**: Each repository's data is completely isolated, preventing cross-contamination
- **Scalability**: Adding new repositories doesn't slow down existing ones (no table bloat)
- **Backup/Migration**: Users can easily backup individual repository caches
- **Conflict-free**: No need for complex repository_id foreign keys everywhere

**Alternatives Considered**:
- **Single database with repository_id column**: Simpler but scales poorly, requires complex indexes, harder to backup
- **In-memory databases**: Fast but requires persistence strategy, loses offline capability
- **JSON files per repository**: Simple but no query capability, no transactions, data integrity issues

**Implementation Pattern**:
```typescript
// apps/desktop/src/main/database/manager.ts
class DatabaseManager {
  private connections: Map<string, Database> = new Map();
  
  getDatabase(repoId: string): Database {
    if (!this.connections.has(repoId)) {
      const dbPath = path.join(app.getPath('userData'), 'repositories', `${repoId}.db`);
      const db = new Database(dbPath);
      this.runMigrations(db);
      this.connections.set(repoId, db);
    }
    return this.connections.get(repoId)!;
  }
  
  closeDatabase(repoId: string): void {
    this.connections.get(repoId)?.close();
    this.connections.delete(repoId);
  }
}
```

**Database Schema** (per repository):
```sql
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
  remote_updated_at INTEGER
);

CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  issue_count INTEGER DEFAULT 0
);

CREATE TABLE issue_labels (
  issue_id TEXT NOT NULL,
  label_id TEXT NOT NULL,
  PRIMARY KEY (issue_id, label_id),
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT CHECK(entity_type IN ('issue', 'label')) NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT CHECK(operation IN ('create', 'update', 'delete')) NOT NULL,
  payload TEXT, -- JSON
  created_at INTEGER NOT NULL,
  retry_after INTEGER, -- Unix timestamp for rate-limited operations
  error TEXT
);

CREATE INDEX idx_issues_state ON issues(state);
CREATE INDEX idx_issues_sync_status ON issues(sync_status);
CREATE INDEX idx_sync_queue_retry ON sync_queue(retry_after);
```

---

### 3. GitHub Token Storage via OS Keychain

**Decision**: Use electron-store with encryption for cross-platform keychain access

**Rationale**:
- **electron-store**: Simple API, built on `conf`, supports encryption via `encryptionKey`
- **Cross-platform**: Works on macOS (Keychain), Windows (Credential Vault), Linux (libsecret)
- **Fallback**: If OS keychain unavailable, falls back to encrypted file storage
- **No additional dependencies**: electron-store is already minimal (only `conf` dependency)

**Alternatives Considered**:
- **keytar**: Native keychain library, but deprecated and replaced by `@electron/safeStorage`
- **@electron/safeStorage**: Electron 13+ built-in API, but requires Electron ≥13 and more boilerplate
- **Manual platform-specific code**: Fragile, hard to test cross-platform

**Implementation**:
```typescript
// apps/desktop/src/main/security/keychain.ts
import Store from 'electron-store';
import { safeStorage } from 'electron';

class SecureStore {
  private store: Store;
  
  constructor() {
    this.store = new Store({
      name: 'secure-credentials',
      encryptionKey: safeStorage.isEncryptionAvailable() 
        ? undefined // Use OS keychain
        : 'fallback-key-from-machine-id', // Fallback encryption
      clearInvalidConfig: true,
    });
  }
  
  setToken(token: string): void {
    this.store.set('github.token', token);
  }
  
  getToken(): string | null {
    return this.store.get('github.token', null);
  }
  
  clearToken(): void {
    this.store.delete('github.token');
  }
}
```

---

### 4. Conflict Resolution UI Pattern

**Decision**: Modal dialog with side-by-side diff view (Local | Remote)

**Rationale**:
- **Familiar pattern**: GitHub, VS Code, Git clients all use side-by-side diff
- **Clear choices**: Three buttons: "Keep Local", "Accept Remote", "Manual Merge"
- **Non-blocking**: Conflicts are queued; user can resolve later (sync pauses on conflict)
- **Markdown-aware**: For issue bodies, show markdown diff with syntax highlighting

**Alternatives Considered**:
- **Automatic merge (last-write-wins)**: Users wanted in clarification, but risky for data loss
- **Operational transformation**: Too complex for desktop app, better for collaborative editing
- **Line-by-line cherry-pick**: Too granular for issue metadata (title, labels)

**UI Mockup Pattern**:
```
┌─────────────────────────────────────────────┐
│ Conflict Detected: Issue #42                │
├─────────────────────────────────────────────┤
│ Local Version          │ Remote Version     │
│ ───────────────────────│──────────────────  │
│ Title: Fix bug in UI   │ Title: Fix UI bug  │
│ Updated: 2 mins ago    │ Updated: 5 mins ago│
│                        │                     │
│ Body:                  │ Body:              │
│ This fixes the issue   │ This resolves the  │
│ with button alignment  │ button alignment   │
│                        │                     │
├─────────────────────────────────────────────┤
│ [Keep Local] [Accept Remote] [Manual Merge] │
└─────────────────────────────────────────────┘
```

**Implementation**:
- **Conflict detection**: Compare `local_updated_at` vs `remote_updated_at` timestamps
- **Checksum validation**: Store SHA-256 hash of issue body to detect content changes
- **Queue management**: Store conflicts in `sync_queue` table with error field
- **Notification**: Show toast when conflict detected, link to conflict resolution modal

---

### 5. Markdown Editor (GitHub-Compatible)

**Decision**: Use **Tiptap** for WYSIWYG editing with Markdown storage + `react-markdown` for read-only preview

**Rationale**:
- **Tiptap**: Modern WYSIWYG editor built on ProseMirror, excellent React integration, GitHub-like editing experience
- **GitHub Flavored Markdown support**: Tiptap has extensions for tables, task lists, code blocks, strikethrough
- **Dual mode**: Code mode (raw markdown textarea) + Preview mode (Tiptap WYSIWYG editor)
- **Offline-first**: All editing happens locally, no network dependencies
- **Bundle size**: ~120KB gzipped (Tiptap core + extensions), acceptable for desktop app
- **Active maintenance**: Well-maintained, used by Notion, GitLab, and other major apps

**Alternatives Considered**:
- **react-markdown only**: Read-only, no WYSIWYG editing capability
- **Monaco Editor**: Code-focused, lacks WYSIWYG features, heavier bundle
- **Slate**: More low-level, requires more custom implementation
- **Quill**: Older, less modern API, weaker markdown support

**Implementation**:
```typescript
// apps/desktop/src/renderer/src/components/markdown/MarkdownEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Markdown } from 'tiptap-markdown';

interface MarkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  mode: 'code' | 'preview';
}

function MarkdownEditor({ content, onChange, mode }: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit, // Headings, bold, italic, lists, code blocks, etc.
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Markdown, // Converts between ProseMirror and Markdown
    ],
    content,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
  });

  if (mode === 'code') {
    return (
      <textarea
        className="w-full h-full p-4 font-mono text-sm"
        value={content}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <EditorContent
      editor={editor}
      className="prose prose-github dark:prose-invert max-w-none p-4"
    />
  );
}
```

**Read-Only Preview** (for issue cards, dashboard):
```typescript
// Use react-markdown for lightweight read-only rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      className="markdown-body prose prose-github"
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
}
```

**Tiptap Extensions Needed**:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-task-list \
  @tiptap/extension-task-item @tiptap/extension-table \
  @tiptap/extension-table-row @tiptap/extension-table-cell \
  @tiptap/extension-table-header tiptap-markdown
```

**Styling**: Use Tailwind Typography + GitHub Primer CSS:
```css
/* apps/desktop/src/renderer/src/styles/globals.css */
@import '@primer/css/markdown/index.scss';
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Tiptap editor styling */
.ProseMirror {
  @apply min-h-[200px] outline-none;
}

.ProseMirror > * + * {
  @apply mt-3;
}
```

---

### 6. Rate Limit Tracking

**Decision**: Store rate limit in-memory + electron-store, display in status bar

**Rationale**:
- **GitHub API headers**: Every response includes `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Proactive warning**: Warn at 20% (1000/5000 for authenticated) to prevent hitting limit
- **Queue retry**: Store `retry_after` timestamp in `sync_queue` table
- **Persistent state**: Save to electron-store so rate limit survives app restart

**Implementation**:
```typescript
// apps/desktop/src/main/sync/rate-limit.ts
import Store from 'electron-store';

interface RateLimitState {
  remaining: number;
  limit: number;
  reset: number; // Unix timestamp
}

class RateLimitTracker {
  private store = new Store<{ rateLimit: RateLimitState }>();
  
  update(headers: Record<string, string>): void {
    const state: RateLimitState = {
      remaining: parseInt(headers['x-ratelimit-remaining'], 10),
      limit: parseInt(headers['x-ratelimit-limit'], 10),
      reset: parseInt(headers['x-ratelimit-reset'], 10),
    };
    
    this.store.set('rateLimit', state);
    
    if (state.remaining < state.limit * 0.2) {
      this.sendWarning(state);
    }
  }
  
  canMakeRequest(): boolean {
    const state = this.store.get('rateLimit');
    if (!state) return true;
    
    if (state.remaining === 0) {
      return Date.now() / 1000 > state.reset;
    }
    return true;
  }
  
  private sendWarning(state: RateLimitState): void {
    const resetTime = new Date(state.reset * 1000);
    // Send IPC notification to renderer
    BrowserWindow.getAllWindows()[0]?.webContents.send('rate-limit-warning', {
      remaining: state.remaining,
      resetTime,
    });
  }
}
```

**UI Display** (status bar):
```
API: 4200/5000 remaining (resets in 42 mins)
```

---

### 7. Dashboard Analytics Implementation

**Decision**: Recharts for trend/distribution charts + SQLite aggregate queries

**Rationale**:
- **Recharts**: React charting library, small bundle (~80KB), composable, responsive
- **SQLite aggregation**: Fast local queries for counts, GROUP BY label, date ranges
- **No external analytics**: All computed locally from SQLite data
- **7/30 day trends**: Query `created_at` timestamp, group by day, fill gaps with 0

**Alternatives Considered**:
- **Chart.js**: Canvas-based, not React-friendly, requires wrapper
- **D3.js**: Powerful but heavy (~250KB), overkill for simple charts
- **Victory**: Similar to Recharts but larger bundle size

**Example Queries**:
```sql
-- Total counts
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN state = 'open' THEN 1 ELSE 0 END) as open,
  SUM(CASE WHEN state = 'closed' THEN 1 ELSE 0 END) as closed
FROM issues;

-- Label distribution
SELECT 
  l.name,
  l.color,
  COUNT(il.issue_id) as count
FROM labels l
LEFT JOIN issue_labels il ON l.id = il.label_id
GROUP BY l.id
ORDER BY count DESC;

-- 7-day trend (created issues)
SELECT 
  DATE(created_at / 1000, 'unixepoch') as date,
  COUNT(*) as count
FROM issues
WHERE created_at >= (strftime('%s', 'now') - 7*24*60*60) * 1000
GROUP BY date
ORDER BY date;
```

**Chart Components**:
```typescript
import { LineChart, Line, PieChart, Pie, BarChart, Bar } from 'recharts';

function TrendChart({ data }: { data: Array<{ date: string; count: number }> }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <Line type="monotone" dataKey="count" stroke="#8884d8" />
      {/* ... axes, tooltips */}
    </LineChart>
  );
}
```

---

### 8. HTML Comment Metadata Parsing for GitHub Comments

**Decision**: Embed metadata as HTML comments in markdown body, parse with regex patterns

**Rationale**:
- **GitHub compatibility**: HTML comments are valid markdown and GitHub renders them invisibly
- **Backwards compatibility**: Comments without metadata display normally (graceful degradation)
- **No GitHub API limitations**: GitHub's comment API only supports markdown body, no custom fields
- **Local enhancement**: Metadata is local-first feature, enriches app UX without GitHub dependency
- **Simple parsing**: Regex extraction is fast and reliable for controlled HTML comment format

**Alternatives Considered**:
- **GitHub API issue metadata**: Only works for issues, not comments; limited to predefined fields
- **Separate metadata table**: Requires linking strategy, loses data if comment re-synced from GitHub
- **JSON in markdown code block**: Visible in GitHub, clutters comment body
- **Issue body footnotes**: Not scalable, breaks with multiple comments

**HTML Comment Format**:
```html
<!-- title: Comment Title Here -->
<!-- description: Brief description of the comment -->
<!-- tags: tag1, tag2, tag3 -->

Regular markdown content of the comment body...
```

**Parsing Implementation**:
```typescript
// packages/shared/src/utils/comment-metadata.ts
interface CommentMetadata {
  title?: string;
  description?: string;
  tags: string[];
}

export function parseCommentMetadata(markdown: string): { metadata: CommentMetadata; body: string } {
  const titleMatch = markdown.match(/<!--\s*title:\s*(.+?)\s*-->/);
  const descMatch = markdown.match(/<!--\s*description:\s*(.+?)\s*-->/);
  const tagsMatch = markdown.match(/<!--\s*tags:\s*(.+?)\s*-->/);
  
  const metadata: CommentMetadata = {
    title: titleMatch?.[1] || '',
    description: descMatch?.[1] || '',
    tags: tagsMatch?.[1]?.split(',').map(t => t.trim()).filter(Boolean) || [],
  };
  
  // Remove HTML comments from body for display
  const body = markdown
    .replace(/<!--\s*title:.*?-->\s*/g, '')
    .replace(/<!--\s*description:.*?-->\s*/g, '')
    .replace(/<!--\s*tags:.*?-->\s*/g, '')
    .trim();
  
  return { metadata, body };
}

export function embedCommentMetadata(body: string, metadata: CommentMetadata): string {
  const lines: string[] = [];
  
  if (metadata.title) {
    lines.push(`<!-- title: ${metadata.title} -->`);
  }
  if (metadata.description) {
    lines.push(`<!-- description: ${metadata.description} -->`);
  }
  if (metadata.tags.length > 0) {
    // Enforce maximum 20 tags, truncate if exceeded
    const limitedTags = metadata.tags.slice(0, 20);
    lines.push(`<!-- tags: ${limitedTags.join(', ')} -->`);
  }
  
  lines.push(''); // Blank line separator
  lines.push(body);
  
  return lines.join('\n');
}
```

**Duplicate Handling**:
- Parser uses first occurrence of each metadata tag (`title`, `description`, `tags`)
- Subsequent duplicates are ignored (predictable behavior)
- Malformed HTML comments (missing closing `-->`) are skipped

**Validation Rules**:
- Title: max 100 chars
- Description: max 200 chars  
- Tags: max 20 tags, each tag max 30 chars
- Truncation: silently truncate exceeding limits when saving

---

### 9. Comment Filtering and Tag Search

**Decision**: SQLite FTS5 (Full-Text Search) for tag search + compound WHERE clauses

**Rationale**:
- **FTS5 advantages**: Built into SQLite, fast text search, supports prefix matching
- **Tag search**: Store tags as JSON array in SQLite, query with `json_each()` function
- **Multi-tag AND logic**: Filter comments that contain ALL selected tags (intersection)
- **Performance**: Index on `issue_id` for fast per-issue comment loading

**Alternatives Considered**:
- **Separate tags table with M:M relationship**: More complex schema, overkill for 20 tags max
- **String LIKE queries**: Slow for tag matching, false positives (e.g., "bug" matches "debug")
- **Client-side filtering**: Requires loading all comments, defeats SQLite index benefits

**Schema Extension for Comments**:
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  github_id INTEGER UNIQUE, -- GitHub comment ID
  body TEXT NOT NULL,
  title TEXT, -- Parsed from HTML comment
  description TEXT, -- Parsed from HTML comment
  tags TEXT, -- JSON array: ["bug", "frontend", "urgent"]
  author TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  sync_status TEXT CHECK(sync_status IN ('synced', 'pending_create', 'pending_update', 'pending_delete', 'conflict')) NOT NULL,
  local_updated_at INTEGER NOT NULL,
  remote_updated_at INTEGER,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_issue_id ON comments(issue_id);
CREATE INDEX idx_comments_created_at ON comments(created_at); -- For newest-first display order and since filtering
```

**Tag Filtering Query**:
```typescript
// Find comments with ALL of these tags: ["bug", "urgent"]
const query = `
  SELECT * FROM comments
  WHERE issue_id = ?
  AND (
    SELECT COUNT(DISTINCT value)
    FROM json_each(tags)
    WHERE value IN (${tags.map(() => '?').join(',')})
  ) = ?
  ORDER BY created_at DESC
`;
// Params: [issueId, ...tags, tags.length]
```

**Display Order & Filtering**:
- Default: newest first (DESC on `created_at`) - natural GitHub API order
- Since filtering: uses GitHub API 'since' parameter for server-side filtering by timestamp

---

## Technology Stack Summary

| Category | Technology | Justification |
|----------|-----------|---------------|
| **Desktop Framework** | Electron 33+ | Constitution requirement, native desktop patterns |
| **UI Framework** | React 18 + TypeScript | Constitution requirement, component reusability |
| **Styling** | Tailwind CSS 3 + @primer/css | Constitution requirement, GitHub-inspired utility classes |
| **Local Storage** | better-sqlite3 | Synchronous API for main process, battle-tested, fast |
| **Settings Storage** | electron-store | Cross-platform, encrypted, persistent settings |
| **GitHub API Client** | Octokit (@octokit/rest) | Official GitHub SDK, well-maintained |
| **Runtime Validation** | Zod | Type-safe schemas, runtime safety, error messages |
| **Markdown Editor** | Tiptap (WYSIWYG) | Modern ProseMirror-based editor, GitHub-like UX, dual code/preview modes |
| **Markdown Preview** | react-markdown + remark-gfm | Lightweight read-only rendering for issue cards |
| **Charts** | Recharts | Lightweight, composable, responsive |
| **Testing** | Vitest + Playwright | Fast, Electron-compatible, type-safe |
| **Build** | electron-builder | Cross-platform packaging, auto-updates |

**Total Bundle Size Estimate**: ~90MB installed (Electron 60MB + React 2MB + Tiptap 3MB + Dependencies 25MB) ✅ Under 100MB constitution limit

---

## Implementation Risks

| Risk | Mitigation |
|------|-----------|
| **SQLite file corruption** | Regular backups to user Documents folder, WAL mode for crash recovery |
| **IPC type safety drift** | Contract tests validate IPC surface matches types, CI enforcement |
| **GitHub API changes** | Use Octokit (handles versioning), monitor GitHub API deprecations |
| **Cross-platform keychain issues** | Fallback to encrypted electron-store if OS keychain unavailable |
| **Rate limit blocking user** | Proactive warnings, queue operations, allow offline work |

---

## Next Steps (Phase 1)

1. Generate `data-model.md` with SQLite schemas and entity relationships
2. Generate IPC contracts in `/contracts/ipc.yaml`
3. Create `quickstart.md` for development setup
4. Update Copilot agent context with technology decisions
