# Data Model: GitHub App Authorization

**Feature**: 002-github-app-auth  
**Date**: 2025-11-06  
**Status**: Complete

## Overview

This document defines all data entities, their attributes, validation rules, and relationships for the GitHub App authorization feature.

---

## Entity Definitions

### 1. User Session (Client-Side)

Stored in Electron app using `electron-store` with encryption.

**Entity**: `UserSession`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `userToken` | string | Yes | 64-char hex string | Backend session token for re-authentication |
| `user` | User | Yes | Valid User object | GitHub user profile information |
| `currentInstallation` | Installation \| null | No | Valid Installation object | Currently selected installation (null if none selected) |
| `installationToken` | InstallationToken \| null | No | Valid token object | Current installation access token |

**Zod Schema**:
```typescript
const UserSessionSchema = z.object({
  userToken: z.string().length(128), // 64 bytes = 128 hex chars
  user: UserSchema,
  currentInstallation: InstallationSchema.nullable(),
  installationToken: InstallationTokenSchema.nullable()
});
```

**Lifecycle**:
- Created: After successful device flow authentication
- Updated: When selecting installation, refreshing token
- Deleted: On explicit logout

---

### 2. User

GitHub user profile information.

**Entity**: `User`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | number | Yes | Positive integer | GitHub user ID |
| `login` | string | Yes | 1-39 chars, alphanumeric + hyphen | GitHub username |
| `name` | string | Yes | Non-empty string | User's display name |
| `avatar_url` | string | Yes | Valid HTTPS URL | User's avatar image URL |
| `email` | string | No | Valid email or null | User's primary email (if public) |

**Zod Schema**:
```typescript
const UserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1).max(39).regex(/^[a-zA-Z0-9-]+$/),
  name: z.string().min(1),
  avatar_url: z.string().url().startsWith('https://'),
  email: z.string().email().optional().nullable()
});
```

**Source**: GitHub API `/user` endpoint response

---

### 3. Installation

Represents a GitHub App installation on a user's account or organization.

**Entity**: `Installation`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `id` | number | Yes | Positive integer | Installation ID |
| `account` | Account | Yes | Valid Account object | Account where app is installed |
| `repository_selection` | string | Yes | "all" or "selected" | Repository access scope |
| `permissions` | Record<string, string> | Yes | Non-empty object | Granted permissions (e.g., issues: write) |

**Zod Schema**:
```typescript
const InstallationSchema = z.object({
  id: z.number().int().positive(),
  account: AccountSchema,
  repository_selection: z.enum(['all', 'selected']),
  permissions: z.record(z.string(), z.string()).min(1)
});
```

**Source**: GitHub API `/user/installations` endpoint response

---

### 4. Account

GitHub account (user or organization) where the app is installed.

**Entity**: `Account`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `login` | string | Yes | 1-39 chars, alphanumeric + hyphen | Account username/org name |
| `avatar_url` | string | Yes | Valid HTTPS URL | Account avatar image URL |
| `type` | string | Yes | "User" or "Organization" | Account type |

**Zod Schema**:
```typescript
const AccountSchema = z.object({
  login: z.string().min(1).max(39).regex(/^[a-zA-Z0-9-]+$/),
  avatar_url: z.string().url().startsWith('https://'),
  type: z.enum(['User', 'Organization'])
});
```

---

### 5. Installation Token

Short-lived (1-hour) access token for a specific installation.

**Entity**: `InstallationToken`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `token` | string | Yes | Starts with "ghs_" | GitHub installation access token |
| `expires_at` | string | Yes | ISO 8601 datetime | Token expiration timestamp |

**Zod Schema**:
```typescript
const InstallationTokenSchema = z.object({
  token: z.string().startsWith('ghs_'),
  expires_at: z.string().datetime() // ISO 8601 format
});
```

**Validation Rules**:
- Token must be checked for expiry before each API call
- If `expires_at` is within 5 minutes of now, trigger refresh
- Store encrypted using electron-store

**Lifecycle**:
- Created: When user selects an installation
- Updated: On automatic refresh (every 55 minutes)
- Deleted: On logout or installation switch

---

### 6. Device Authorization (Transient)

Temporary state during device flow authentication.

**Entity**: `DeviceAuthorization`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `device_code` | string | Yes | Non-empty string | Unique device code for polling |
| `user_code` | string | Yes | 8 chars, uppercase alphanumeric | User-friendly code to display |
| `verification_uri` | string | Yes | Valid HTTPS URL | GitHub authorization page URL |
| `interval` | number | Yes | 1-60 seconds | Polling interval |
| `expires_at` | number | Yes | Unix timestamp | When device code expires |

**Zod Schema**:
```typescript
const DeviceAuthorizationSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().length(8).regex(/^[A-Z0-9-]+$/),
  verification_uri: z.string().url().startsWith('https://github.com/'),
  interval: z.number().int().min(1).max(60),
  expires_at: z.number().int().positive()
});
```

**Lifecycle**:
- Created: When user clicks "Login with GitHub"
- Used: During polling loop (every `interval` seconds)
- Deleted: After successful authorization or expiration (15 minutes)

**Storage**: Not persisted; only in-memory during auth flow

---

### 7. Backend Session (Server-Side)

Stored in Cloudflare KV with 30-day TTL.

**Entity**: `BackendSession`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `userId` | number | Yes | Positive integer | GitHub user ID |
| `userLogin` | string | Yes | 1-39 chars | GitHub username |
| `accessToken` | string | Yes | OAuth token | User's GitHub OAuth access token |
| `installations` | Installation[] | Yes | Array of installations | User's GitHub App installations |
| `createdAt` | number | Yes | Unix timestamp | Session creation time |
| `lastAccessedAt` | number | Yes | Unix timestamp | Last request using this session |

**Zod Schema**:
```typescript
const BackendSessionSchema = z.object({
  userId: z.number().int().positive(),
  userLogin: z.string().min(1).max(39),
  accessToken: z.string().min(1),
  installations: z.array(InstallationSchema),
  createdAt: z.number().int().positive(),
  lastAccessedAt: z.number().int().positive()
});
```

**Storage Key**: `session:${sessionToken}` where `sessionToken` is 128-char hex string

**TTL**: 30 days (2,592,000 seconds)

**Lifecycle**:
- Created: After successful device flow authorization
- Updated: `lastAccessedAt` on every request
- Deleted: After 30 days (automatic KV expiration) or on explicit logout

---

### 8. Rate Limit State (Server-Side)

Stored in Cloudflare KV for per-user rate limiting.

**Entity**: `RateLimitState`

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `timestamps` | number[] | Yes | Array of Unix timestamps | Request timestamps within current window |

**Zod Schema**:
```typescript
const RateLimitStateSchema = z.object({
  timestamps: z.array(z.number().int().positive()).max(5)
});
```

**Storage Key**: `ratelimit:${userId}`

**TTL**: 120 seconds (2 minutes = 2x window duration)

**Logic**:
- Filter timestamps to only those within last 60 seconds
- If count ≥ 5, reject request with HTTP 429
- Otherwise, append current timestamp and save

---

## Relationships

```
UserSession (client)
├── user: User
├── currentInstallation: Installation?
│   └── account: Account
└── installationToken: InstallationToken?

BackendSession (server)
├── userId → User.id
├── installations: Installation[]
└── accessToken: string (GitHub OAuth token)

DeviceAuthorization (transient)
└── (no relationships, deleted after auth)

RateLimitState (server)
└── indexed by userId
```

---

## State Transitions

### Authentication Flow

```
[No Session] 
  → (User clicks login)
  → DeviceAuthorization created
  → (User authorizes on GitHub)
  → BackendSession created (KV, 30-day TTL)
  → UserSession created (electron-store)
  → [Authenticated]
```

### Installation Selection

```
[Authenticated, no installation]
  → (User selects installation)
  → Backend exchanges installation_id for token
  → InstallationToken created/updated
  → currentInstallation updated
  → [Ready for API calls]
```

### Token Refresh

```
[Token expires in <5 minutes]
  → (Automatic check before API call)
  → Backend re-exchanges installation_id for new token
  → InstallationToken updated with new expiry
  → [Token refreshed, API call proceeds]
```

### Logout

```
[Authenticated]
  → (User clicks logout)
  → BackendSession deleted from KV
  → UserSession cleared from electron-store
  → [No Session]
```

---

## Validation Rules Summary

1. **User tokens (session tokens)**: 128-char hex string (cryptographically random)
2. **GitHub usernames**: 1-39 chars, alphanumeric + hyphen only
3. **Installation tokens**: Must start with "ghs_", valid ISO 8601 expiry
4. **Device codes**: Non-empty string, expires after 15 minutes
5. **User codes**: 8 uppercase alphanumeric chars (e.g., "ABCD-1234")
6. **Rate limits**: Max 5 requests per user per 60-second window
7. **Session expiry**: 30 days from creation (KV TTL)
8. **Token refresh trigger**: When expires_at is within 5 minutes of now

---

## Storage Locations

| Entity | Storage | Encryption | TTL/Lifecycle |
|--------|---------|------------|---------------|
| UserSession | electron-store (client) | Yes (platform keychain) | Until logout |
| BackendSession | Cloudflare KV (server) | At rest (KV default) | 30 days |
| DeviceAuthorization | In-memory (client) | N/A | 15 minutes |
| RateLimitState | Cloudflare KV (server) | At rest (KV default) | 2 minutes |

---

## Security Considerations

1. **Never store private keys on client**: Backend-only
2. **Encrypt all tokens on client**: Use electron-store encryption
3. **Validate all inputs**: Use Zod schemas at IPC and API boundaries
4. **Short-lived installation tokens**: 1-hour expiry minimizes risk
5. **Secure session tokens**: 64-byte random (128 hex chars) prevents guessing
6. **Rate limiting**: Prevent token generation abuse
7. **Audit logging**: Log all auth events on backend

---

**Next**: Define API contracts (IPC and REST)
