# Data Model: IssueDesk Mobile App

**Feature**: 004-mobile-app  
**Date**: 2026-02-01  
**Source**: [spec.md](./spec.md) Key Entities section

## Entity Definitions

### UserSession

Authenticated user's session state.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | ✓ | GitHub user ID |
| username | string | ✓ | GitHub username |
| avatarUrl | string | ✓ | User avatar URL |
| sessionToken | string | ✓ | Backend session token for re-authentication |
| selectedInstallationId | number | ✓ | Currently selected GitHub App installation |
| installations | Installation[] | ✓ | Available GitHub App installations |

**Storage**: expo-secure-store (encrypted)

**State Transitions**:
- `null` → `authenticated` (after device flow completes)
- `authenticated` → `null` (logout or session expiration)

---

### Installation

GitHub App installation representing an organization or user account.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | Installation ID |
| accountLogin | string | ✓ | Organization or user name |
| accountType | 'User' \| 'Organization' | ✓ | Account type |
| avatarUrl | string | ✓ | Account avatar URL |

**Storage**: Part of UserSession (secure storage)

---

### AccessToken

Temporary GitHub API access token for the selected installation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | ✓ | GitHub installation access token |
| expiresAt | number | ✓ | Expiration timestamp (Unix ms) |
| installationId | number | ✓ | Associated installation ID |

**Storage**: expo-secure-store (encrypted)

**Validation Rules**:
- Refresh when `expiresAt - now < 5 minutes`
- Clear on logout

---

### Repository

GitHub repository selected for issue management.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | GitHub repository ID |
| owner | string | ✓ | Repository owner (user or org) |
| name | string | ✓ | Repository name |
| fullName | string | ✓ | Full name (owner/name) |
| description | string \| null | | Repository description |
| isPrivate | boolean | ✓ | Private repository flag |

**Storage**: AsyncStorage (non-sensitive preference)

**Note**: Reuses type from @issuedesk/shared

---

### Issue

GitHub issue with metadata for display.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | GitHub issue ID |
| number | number | ✓ | Issue number in repository |
| title | string | ✓ | Issue title |
| body | string \| null | | Markdown body content |
| state | 'open' \| 'closed' | ✓ | Issue state |
| labels | Label[] | ✓ | Attached labels |
| user | { login: string, avatarUrl: string } | ✓ | Issue author |
| createdAt | string | ✓ | ISO timestamp |
| updatedAt | string | ✓ | ISO timestamp |
| commentsCount | number | ✓ | Number of comments |
| htmlUrl | string | ✓ | GitHub web URL |

**Storage**: In-memory (fetched from API)

**Note**: Reuses type from @issuedesk/shared

---

### Label

Repository label for categorizing issues.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | GitHub label ID |
| name | string | ✓ | Label name |
| color | string | ✓ | Hex color code (without #) |
| description | string \| null | | Label description |

**Storage**: In-memory (fetched from API)

**Note**: Reuses type from @issuedesk/shared

---

### Comment

Issue comment with author and content.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | number | ✓ | GitHub comment ID |
| body | string | ✓ | Markdown body content |
| user | { login: string, avatarUrl: string } | ✓ | Comment author |
| createdAt | string | ✓ | ISO timestamp |
| updatedAt | string | ✓ | ISO timestamp |

**Storage**: In-memory (fetched from API)

**Note**: Reuses type from @issuedesk/shared

---

### DeviceAuthorization

Temporary state during device flow authentication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| deviceCode | string | ✓ | Code for polling backend |
| userCode | string | ✓ | Code displayed to user |
| verificationUri | string | ✓ | GitHub authorization URL |
| expiresAt | number | ✓ | Expiration timestamp |
| interval | number | ✓ | Polling interval (seconds) |

**Storage**: In-memory only (transient during login)

---

### AppPreferences

User preferences persisted locally.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| theme | 'light' \| 'dark' \| 'system' | ✓ | Theme preference |
| selectedRepositoryId | number \| null | | Last selected repository |

**Storage**: AsyncStorage (non-sensitive)

---

## Entity Relationships

```
UserSession
├── has many → Installation
├── has one  → AccessToken (for selected installation)
└── has one  → Repository (selected)

Repository
├── has many → Issue
└── has many → Label

Issue
├── has many → Label (through issue_labels)
├── has many → Comment
└── has one  → User (author)

Comment
└── has one  → User (author)
```

## Storage Strategy

| Entity | Storage Location | Encryption | Persistence |
|--------|-----------------|------------|-------------|
| UserSession | expo-secure-store | ✓ | Permanent until logout |
| AccessToken | expo-secure-store | ✓ | Until expiration |
| AppPreferences | AsyncStorage | ✗ | Permanent |
| Repository (selected) | AsyncStorage | ✗ | Permanent |
| Issues, Labels, Comments | In-memory | N/A | Per-session (refetch on app launch) |
| DeviceAuthorization | In-memory | N/A | Transient (login only) |

## Type Reuse from @issuedesk/shared

The following types can be directly imported from the shared package:

- `Issue` - Core issue type
- `Label` - Label type with color
- `Comment` - Comment type (may need adaptation for mobile)
- `Repository` / `RepositoryConfig` - Repository configuration
- `ThemeMode` - Theme type ('light' | 'dark')

Mobile-specific types (UserSession, DeviceAuthorization, AppPreferences) will be defined in `apps/mobile/src/types/`.
