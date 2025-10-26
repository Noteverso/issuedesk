# IPC API Contract

**Feature**: 001-issues-management  
**Date**: 2025-10-26  
**Version**: 1.0.0

## Overview

This document defines the type-safe IPC (Inter-Process Communication) API between Electron's main process and renderer process. All communication flows through the preload script context bridge.

**Security Requirements**:
- `nodeIntegration: false`
- `contextIsolation: true`
- All IPC calls validated with Zod schemas
- No direct access to Node.js APIs from renderer

---

## API Surface

The `window.api` object exposed to renderer process:

```typescript
declare global {
  interface Window {
    api: {
      issues: IssuesAPI;
      labels: LabelsAPI;
      sync: SyncAPI;
      settings: SettingsAPI;
      analytics: AnalyticsAPI;
      system: SystemAPI;
    };
  }
}
```

---

## 1. Issues API

### `issues.list`

List issues with optional filtering.

**Request**:
```typescript
interface IssueListRequest {
  filter?: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[]; // Label names
    search?: string; // Search in title
  };
  page?: number; // Default: 1
  perPage?: number; // Default: 50, max: 100
}
```

**Response**:
```typescript
interface IssueListResponse {
  issues: Issue[];
  totalCount: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
```

**Example**:
```typescript
const { issues } = await window.api.issues.list({
  filter: { state: 'open', labels: ['bug'] },
  page: 1,
  perPage: 50,
});
```

---

### `issues.get`

Get a single issue by ID.

**Request**:
```typescript
interface IssueGetRequest {
  id: string; // UUID
}
```

**Response**:
```typescript
interface IssueGetResponse {
  issue: Issue | null;
}
```

**Example**:
```typescript
const { issue } = await window.api.issues.get({ id: 'uuid-here' });
```

---

### `issues.create`

Create a new issue (local-first, queued for sync).

**Request**:
```typescript
interface IssueCreateRequest {
  title: string; // Max 256 chars
  body?: string; // Markdown
  labels?: string[]; // Label IDs
}
```

**Response**:
```typescript
interface IssueCreateResponse {
  issue: Issue; // With sync_status: 'pending_create'
}
```

**Example**:
```typescript
const { issue } = await window.api.issues.create({
  title: 'Fix bug in UI',
  body: 'Description here',
  labels: ['label-uuid-1'],
});
```

---

### `issues.update`

Update an existing issue (local-first, queued for sync).

**Request**:
```typescript
interface IssueUpdateRequest {
  id: string; // UUID
  data: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[]; // Replace all labels
  };
}
```

**Response**:
```typescript
interface IssueUpdateResponse {
  issue: Issue; // With sync_status: 'pending_update'
}
```

**Example**:
```typescript
const { issue } = await window.api.issues.update({
  id: 'uuid-here',
  data: { title: 'Updated title', state: 'closed' },
});
```

---

### `issues.delete`

Delete an issue (local-first, queued for sync).

**Request**:
```typescript
interface IssueDeleteRequest {
  id: string; // UUID
}
```

**Response**:
```typescript
interface IssueDeleteResponse {
  success: boolean;
}
```

**Example**:
```typescript
await window.api.issues.delete({ id: 'uuid-here' });
```

---

## 2. Labels API

### `labels.list`

List all labels for active repository.

**Request**: None

**Response**:
```typescript
interface LabelsListResponse {
  labels: Label[];
}
```

**Example**:
```typescript
const { labels } = await window.api.labels.list();
```

---

### `labels.create`

Create a new label (local-first, queued for sync).

**Request**:
```typescript
interface LabelCreateRequest {
  name: string; // Max 50 chars, unique
  color: string; // Hex color (6 chars, no #)
  description?: string; // Max 100 chars
}
```

**Response**:
```typescript
interface LabelCreateResponse {
  label: Label;
}
```

**Example**:
```typescript
const { label } = await window.api.labels.create({
  name: 'bug',
  color: 'd73a4a',
  description: 'Something is broken',
});
```

---

### `labels.update`

Update an existing label (local-first, queued for sync).

**Request**:
```typescript
interface LabelUpdateRequest {
  id: string; // UUID
  data: {
    name?: string;
    color?: string;
    description?: string;
  };
}
```

**Response**:
```typescript
interface LabelUpdateResponse {
  label: Label;
}
```

**Example**:
```typescript
const { label } = await window.api.labels.update({
  id: 'uuid-here',
  data: { color: 'ff0000' },
});
```

---

### `labels.delete`

Delete a label (also removes from all issues, queued for sync).

**Request**:
```typescript
interface LabelDeleteRequest {
  id: string; // UUID
}
```

**Response**:
```typescript
interface LabelDeleteResponse {
  success: boolean;
}
```

**Example**:
```typescript
await window.api.labels.delete({ id: 'uuid-here' });
```

---

## 3. Sync API

### `sync.start`

Manually trigger sync with GitHub.

**Request**: None

**Response**:
```typescript
interface SyncStartResponse {
  syncId: string; // Unique sync session ID
}
```

**Example**:
```typescript
const { syncId } = await window.api.sync.start();
```

---

### `sync.getStatus`

Get current sync status.

**Request**: None

**Response**:
```typescript
interface SyncStatusResponse {
  status: 'idle' | 'syncing' | 'conflict' | 'error';
  progress?: {
    total: number; // Total operations in queue
    completed: number;
    failed: number;
  };
  lastSyncAt: number | null; // Unix timestamp (ms)
  conflicts: ConflictSummary[]; // If status === 'conflict'
  error?: string; // If status === 'error'
}

interface ConflictSummary {
  issueId: string;
  issueNumber: number;
  issueTitle: string;
}
```

**Example**:
```typescript
const { status, conflicts } = await window.api.sync.getStatus();
```

---

### `sync.resolveConflict`

Resolve a sync conflict.

**Request**:
```typescript
interface ConflictResolveRequest {
  issueId: string;
  resolution: 'local' | 'remote' | 'merged';
  mergedData?: { // Required if resolution === 'merged'
    title: string;
    body: string;
    labels: string[];
  };
}
```

**Response**:
```typescript
interface ConflictResolveResponse {
  success: boolean;
}
```

**Example**:
```typescript
await window.api.sync.resolveConflict({
  issueId: 'uuid-here',
  resolution: 'local',
});
```

---

## 4. Settings API

### `settings.get`

Get all app settings.

**Request**: None

**Response**:
```typescript
interface SettingsGetResponse {
  settings: AppSettings; // See data-model.md
}
```

**Example**:
```typescript
const { settings } = await window.api.settings.get();
```

---

### `settings.update`

Update app settings (partial update).

**Request**:
```typescript
interface SettingsUpdateRequest {
  theme?: 'light' | 'dark';
  editorMode?: 'code' | 'preview';
  viewPreferences?: {
    issues?: 'list' | 'card';
    labels?: 'list' | 'card';
  };
}
```

**Response**:
```typescript
interface SettingsUpdateResponse {
  settings: AppSettings;
}
```

**Example**:
```typescript
const { settings } = await window.api.settings.update({ theme: 'dark' });
```

---

### `settings.setRepository`

Configure a GitHub repository (creates new cache or switches active).

**Request**:
```typescript
interface SetRepositoryRequest {
  owner: string; // GitHub username or org
  name: string; // Repository name
  token?: string; // GitHub PAT (only on first connect)
}
```

**Response**:
```typescript
interface SetRepositoryResponse {
  repositoryId: string; // e.g., "github-octocat-hello-world"
  isNew: boolean; // true if newly created cache
}
```

**Example**:
```typescript
const { repositoryId } = await window.api.settings.setRepository({
  owner: 'octocat',
  name: 'hello-world',
  token: 'ghp_xxxxx',
});
```

---

### `settings.switchRepository`

Switch to a different configured repository.

**Request**:
```typescript
interface SwitchRepositoryRequest {
  repositoryId: string;
}
```

**Response**:
```typescript
interface SwitchRepositoryResponse {
  success: boolean;
}
```

**Example**:
```typescript
await window.api.settings.switchRepository({ repositoryId: 'github-facebook-react' });
```

---

### `settings.getToken`

Get stored GitHub token (for verification UI, not for API calls).

**Request**: None

**Response**:
```typescript
interface GetTokenResponse {
  hasToken: boolean; // true if token exists
  tokenPreview?: string; // First 8 chars (e.g., "ghp_abcd...")
}
```

**Example**:
```typescript
const { hasToken } = await window.api.settings.getToken();
```

---

### `settings.setToken`

Update GitHub token (stored in OS keychain).

**Request**:
```typescript
interface SetTokenRequest {
  token: string; // GitHub PAT
}
```

**Response**:
```typescript
interface SetTokenResponse {
  success: boolean;
}
```

**Example**:
```typescript
await window.api.settings.setToken({ token: 'ghp_xxxxx' });
```

---

## 5. Analytics API

### `analytics.getDashboard`

Get all dashboard analytics data.

**Request**: None

**Response**:
```typescript
interface DashboardAnalyticsResponse {
  summary: {
    total: number;
    open: number;
    closed: number;
  };
  labelDistribution: Array<{
    labelName: string;
    labelColor: string;
    count: number;
  }>;
  trend7Days: Array<{
    date: string; // YYYY-MM-DD
    created: number;
    closed: number;
  }>;
  trend30Days: Array<{
    date: string;
    created: number;
    closed: number;
  }>;
}
```

**Example**:
```typescript
const analytics = await window.api.analytics.getDashboard();
```

---

## 6. System API

### `system.openExternal`

Open URL in default browser (for GitHub issue links).

**Request**:
```typescript
interface OpenExternalRequest {
  url: string;
}
```

**Response**:
```typescript
interface OpenExternalResponse {
  success: boolean;
}
```

**Example**:
```typescript
await window.api.system.openExternal({ url: 'https://github.com/owner/repo/issues/42' });
```

---

### `system.getVersion`

Get app version info.

**Request**: None

**Response**:
```typescript
interface GetVersionResponse {
  version: string; // e.g., "1.0.0"
  electronVersion: string;
  nodeVersion: string;
}
```

**Example**:
```typescript
const { version } = await window.api.system.getVersion();
```

---

## Event Listeners (Main → Renderer)

Some events are pushed from main process to renderer:

### `sync:progress`

Emitted during sync operations.

**Payload**:
```typescript
interface SyncProgressEvent {
  total: number;
  completed: number;
  currentOperation: string; // e.g., "Syncing issue #42"
}
```

**Usage**:
```typescript
window.api.on('sync:progress', (event) => {
  console.log(`Progress: ${event.completed}/${event.total}`);
});
```

---

### `sync:conflict`

Emitted when a conflict is detected.

**Payload**:
```typescript
interface SyncConflictEvent {
  issueId: string;
  issueNumber: number;
  issueTitle: string;
}
```

**Usage**:
```typescript
window.api.on('sync:conflict', (event) => {
  showConflictModal(event);
});
```

---

### `rate-limit:warning`

Emitted when rate limit falls below 20%.

**Payload**:
```typescript
interface RateLimitWarningEvent {
  remaining: number;
  limit: number;
  resetAt: number; // Unix timestamp (ms)
}
```

**Usage**:
```typescript
window.api.on('rate-limit:warning', (event) => {
  showToast(`Rate limit low: ${event.remaining} requests remaining`);
});
```

---

### `token:invalid`

Emitted when GitHub token is invalid or expired.

**Payload**:
```typescript
interface TokenInvalidEvent {
  reason: string; // e.g., "401 Unauthorized"
}
```

**Usage**:
```typescript
window.api.on('token:invalid', (event) => {
  navigateToSettings();
});
```

---

## Error Handling

All IPC calls return a standardized error format on failure:

```typescript
interface IpcError {
  code: string; // e.g., "VALIDATION_ERROR", "NETWORK_ERROR", "NOT_FOUND"
  message: string; // Human-readable error message
  details?: any; // Additional context (validation errors, stack trace in dev)
}
```

**Example Error**:
```typescript
try {
  await window.api.issues.create({ title: '' }); // Empty title
} catch (error) {
  console.error(error);
  // {
  //   code: "VALIDATION_ERROR",
  //   message: "Title is required",
  //   details: { field: "title", constraint: "min 1 char" }
  // }
}
```

---

## Implementation Notes

### Preload Script (apps/desktop/src/preload/index.ts)

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from '@issuedesk/shared';

const api: IpcApi = {
  issues: {
    list: (req) => ipcRenderer.invoke('issues:list', req),
    get: (req) => ipcRenderer.invoke('issues:get', req),
    create: (req) => ipcRenderer.invoke('issues:create', req),
    update: (req) => ipcRenderer.invoke('issues:update', req),
    delete: (req) => ipcRenderer.invoke('issues:delete', req),
  },
  // ... other APIs
  
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
};

contextBridge.exposeInMainWorld('api', api);
```

### Main Process Handler (apps/desktop/src/main/ipc/issues.ts)

```typescript
import { ipcMain } from 'electron';
import { IssueListRequestSchema } from '@issuedesk/shared';
import { issuesRepository } from '../database/repositories/issues';

ipcMain.handle('issues:list', async (event, req) => {
  try {
    const validatedReq = IssueListRequestSchema.parse(req);
    const result = await issuesRepository.list(validatedReq);
    return result;
  } catch (error) {
    return {
      code: error instanceof ZodError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
      message: error.message,
      details: error instanceof ZodError ? error.errors : undefined,
    };
  }
});
```

---

## Contract Testing

All IPC contracts MUST have automated tests:

```typescript
// tests/contract/issues.spec.ts
import { test, expect } from '@playwright/test';

test('issues.list returns valid Issue array', async ({ page }) => {
  const result = await page.evaluate(() => window.api.issues.list({}));
  expect(result.issues).toBeInstanceOf(Array);
  expect(result.totalCount).toBeGreaterThanOrEqual(0);
});

test('issues.create validates required fields', async ({ page }) => {
  await expect(
    page.evaluate(() => window.api.issues.create({ title: '' }))
  ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
});
```

---

## Versioning

- **Version**: 1.0.0 (initial)
- **Breaking changes**: Increment major version, update contract tests
- **Additive changes**: Increment minor version, maintain backward compatibility
- **Bug fixes**: Increment patch version

---

## Next Steps

1. Implement preload script with full type-safe IPC bridge
2. Implement IPC handlers in main process for all endpoints
3. Write contract tests for all APIs
4. Document in `quickstart.md` how to test IPC locally
