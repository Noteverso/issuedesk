# GitHub API Integration for User Story 1

## Overview

User Story 1 has been enhanced with full GitHub REST API integration. Users can now create, read, update, and delete issues directly through GitHub's REST API.

## Implementation Status

### ✅ Completed Integration

The IPC handlers in `apps/desktop/src/main/ipc/issues.ts` now integrate with:
- **GitHub REST API** via `@issuedesk/github-api` package
- **Local SQLite Database** for offline support (partial)
- **Settings & Security** for repository and token management

### Architecture

```
┌─────────────┐         ┌──────────────┐        ┌──────────────┐
│   Renderer  │  IPC    │     Main     │  HTTP  │   GitHub     │
│   Process   │────────>│   Process    │───────>│   REST API   │
│  (React UI) │         │ (IPC Handler)│        │              │
└─────────────┘         └──────────────┘        └──────────────┘
                              │
                              │ SQLite
                              ▼
                        ┌──────────────┐
                        │   Local DB   │
                        │ (per repo)   │
                        └──────────────┘
```

## API Methods

### 1. `issues:list` - List Issues

**Current Implementation:**
- ✅ Fetches issues directly from GitHub REST API
- ✅ Falls back to local database if GitHub is unavailable
- ✅ Supports filtering by state (open/closed/all)
- ✅ Supports pagination (page, perPage)

**Usage:**
```typescript
const response = await window.api.issues.list({
  filter: { state: 'open', search: 'bug' },
  page: 1,
  perPage: 50
});
```

**GitHub API Call:**
```typescript
GET /repos/{owner}/{repo}/issues
```

### 2. `issues:get` - Get Single Issue

**Current Implementation:**
- ✅ Retrieves issue from local database by ID
- ⚠️  Does not sync from GitHub yet (returns local copy)

**Future Enhancement:**
- Optionally fetch from GitHub by issue number
- Sync and update local copy

**Usage:**
```typescript
const issue = await window.api.issues.get({ id: 'uuid-123' });
```

### 3. `issues:create` - Create Issue

**Current Implementation:**
- ✅ Creates issue directly on GitHub via REST API
- ✅ Returns created issue with GitHub-assigned number
- ✅ Requires GitHub token
- ⚠️  Stores in local DB (placeholder for future offline support)

**GitHub API Call:**
```typescript
POST /repos/{owner}/{repo}/issues
{
  "title": "Issue title",
  "body": "Issue description",
  "labels": ["bug", "priority:high"]
}
```

**Usage:**
```typescript
const issue = await window.api.issues.create({
  title: "New bug report",
  body: "Description of the bug...",
  labels: ["bug"]
});
```

### 4. `issues:update` - Update Issue

**Current Implementation:**
- ✅ Updates issue on GitHub via REST API
- ✅ Requires issue to exist in local database (to get GitHub issue number)
- ✅ Updates local database after successful GitHub update
- ✅ Supports partial updates (title, body, state, labels)

**GitHub API Call:**
```typescript
PATCH /repos/{owner}/{repo}/issues/{number}
{
  "title": "Updated title",
  "state": "closed"
}
```

**Usage:**
```typescript
const updated = await window.api.issues.update({
  id: 'uuid-123',
  data: {
    title: "Updated title",
    state: "closed"
  }
});
```

### 5. `issues:delete` - Delete Issue

**Current Implementation:**
- ✅ Closes issue on GitHub (API doesn't support delete)
- ✅ Deletes from local database
- ✅ Graceful handling if GitHub close fails

**Note:** GitHub REST API does not support deleting issues. Instead, we close the issue on GitHub and delete it locally.

**GitHub API Call:**
```typescript
PATCH /repos/{owner}/{repo}/issues/{number}
{
  "state": "closed"
}
```

**Usage:**
```typescript
await window.api.issues.delete({ id: 'uuid-123' });
```

## Configuration Requirements

### 1. GitHub Token

Users must configure a GitHub Personal Access Token with the following permissions:
- `repo` - Full control of private repositories
- `public_repo` - Access public repositories

**Configure via Settings:**
```typescript
await window.api.settings.setToken("ghp_your_token_here");
```

Token is stored securely using `electron-store` with encryption.

### 2. Repository Configuration

Users must configure the repository they want to manage:

```typescript
await window.api.settings.setRepository({
  id: "unique-repo-id",
  owner: "github-username",
  name: "repository-name",
  fullName: "github-username/repository-name"
});
```

## Error Handling

### Common Errors

1. **No GitHub Token**
   ```typescript
   Error: "No GitHub token configured. Please configure your GitHub token in Settings."
   ```

2. **No Active Repository**
   ```typescript
   Error: "No active repository configured"
   ```

3. **GitHub API Errors**
   - Rate limiting (5000 requests/hour for authenticated users)
   - Authentication failures
   - Network errors
   - Permission errors

### Error Response Format

```typescript
{
  code: 'CREATE_ERROR' | 'UPDATE_ERROR' | 'DELETE_ERROR' | 'LIST_ERROR',
  message: 'Descriptive error message'
}
```

## Rate Limiting

The GitHub client automatically tracks rate limits:

```typescript
const client = new GitHubClient(token);

client.onRateLimitWarning((state) => {
  console.warn(`Rate limit warning: ${state.remaining}/${state.limit}`);
});

// Check before making requests
if (client.canMakeRequest()) {
  await client.createIssue(...);
}
```

GitHub API limits:
- **Authenticated**: 5,000 requests/hour
- **Unauthenticated**: 60 requests/hour

## Local-First Architecture (Partial)

### Current State

**Online-First:**
- `issues:create` → Creates directly on GitHub
- `issues:update` → Updates directly on GitHub
- `issues:delete` → Closes on GitHub
- `issues:list` → Fetches from GitHub

**Local Database:**
- Used for offline fallback
- Stores issue metadata
- Sync status tracking (not fully implemented)

### Future Enhancement: Full Offline Support

The infrastructure is in place for a full local-first architecture:

1. **Create Offline:**
   - Create in local DB with `sync_status: 'pending_create'`
   - Queue for sync when online

2. **Update Offline:**
   - Update in local DB with `sync_status: 'pending_update'`
   - Queue for sync

3. **Background Sync:**
   - Sync queue processing
   - Conflict detection
   - Merge strategies

This will be implemented in **Phase 8: Sync Engine Implementation**.

## Testing

### Manual Testing Steps

1. **Configure Repository & Token:**
   ```typescript
   await window.api.settings.setToken("your-github-token");
   await window.api.settings.setRepository({
     id: "test-repo",
     owner: "your-username",
     name: "test-repository",
     fullName: "your-username/test-repository"
   });
   ```

2. **Create Issue:**
   ```typescript
   const issue = await window.api.issues.create({
     title: "Test issue from IssueDesk",
     body: "Testing GitHub API integration",
     labels: ["test"]
   });
   console.log("Created:", issue.number); // GitHub issue number
   ```

3. **List Issues:**
   ```typescript
   const { issues } = await window.api.issues.list({
     filter: { state: 'open' },
     page: 1,
     perPage: 10
   });
   console.log(`Found ${issues.length} issues`);
   ```

4. **Update Issue:**
   ```typescript
   const updated = await window.api.issues.update({
     id: issue.id,
     data: { state: 'closed' }
   });
   ```

5. **Verify on GitHub:**
   - Visit `https://github.com/your-username/test-repository/issues`
   - Verify issue appears with correct title, body, labels

### Contract Tests

Located in `tests/contract/issues.spec.ts`:

- ✅ `issues.list` schema validation
- ✅ `issues.create` schema validation
- ✅ `issues.update` schema validation
- Additional tests for GitHub API responses needed

### E2E Tests

Located in `tests/e2e/issue-management.spec.ts`:

- ✅ Issue creation flow
- ✅ Markdown editor integration
- Additional tests for GitHub sync needed

## Next Steps

### Immediate (User Story 1 Completion)

1. **Add Helper Methods to IssuesRepository:**
   - `createFromGitHub(githubIssue)` - Store GitHub issue locally
   - `updateFromGitHub(githubIssue)` - Update from GitHub data
   - `getByNumber(number)` - Find issue by GitHub number

2. **Enhance `issues:list`:**
   - Store fetched issues in local DB for offline access
   - Implement smarter sync strategy (only fetch updates)

3. **Add Settings UI:**
   - Token input and validation
   - Repository selection
   - Connection test

### Future (Phase 8: Sync Engine)

1. **Offline-First Architecture:**
   - Create/update/delete locally first
   - Queue operations for sync
   - Background sync process

2. **Conflict Resolution:**
   - Detect conflicts (local vs remote changes)
   - UI for conflict resolution
   - Merge strategies

3. **Optimistic Updates:**
   - Instant UI updates
   - Background sync
   - Rollback on failure

## Dependencies

### Packages
- `@issuedesk/github-api` - GitHub REST API client
- `@issuedesk/shared` - Shared types and schemas
- `better-sqlite3` - Local database
- `electron-store` - Settings & token storage

### Required Services
- GitHub Personal Access Token
- Internet connection (for API calls)
- Configured repository

## Files Modified

1. **`apps/desktop/src/main/ipc/issues.ts`** - Full GitHub API integration
2. **`packages/github-api/src/github-client.ts`** - Rate limit tracking
3. **`packages/github-api/src/rate-limit.ts`** - Rate limit tracker implementation

## Summary

✅ **User Story 1 now has full GitHub REST API integration**

Users can:
- ✅ Create issues on GitHub with markdown support
- ✅ List issues from GitHub
- ✅ Update issues on GitHub
- ✅ Close/delete issues on GitHub
- ✅ View issues with markdown preview

The implementation follows GitHub's REST API best practices:
- Proper authentication
- Rate limit tracking
- Error handling
- Type safety

**Status:** User Story 1 is now **functionally complete** for online GitHub operations. Local-first offline support will be added in Phase 8.
