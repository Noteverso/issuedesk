# API Contracts: IssueDesk Mobile App

**Feature**: 004-mobile-app  
**Date**: 2026-02-01

## Overview

The mobile app interacts with two API surfaces:

1. **Auth Backend** (Cloudflare Worker) - Authentication and token management
2. **GitHub API** - Issue, label, and comment operations (via @issuedesk/github-api)

This document defines the expected request/response contracts for the mobile app.

---

## Auth Backend API

Base URL: `https://issuedesk-auth.workers.dev` (production)

### POST /auth/device/code

Initiate device flow authentication.

**Request**:
```typescript
// No body required
```

**Response (200)**:
```typescript
interface DeviceCodeResponse {
  device_code: string;      // For polling
  user_code: string;        // Display to user
  verification_uri: string; // GitHub auth URL
  expires_in: number;       // Seconds until expiration
  interval: number;         // Polling interval (seconds)
}
```

**Errors**:
- 429: Rate limited
- 500: Server error

---

### POST /auth/device/token

Poll for access token after user authorizes.

**Request**:
```typescript
interface DeviceTokenRequest {
  device_code: string;
}
```

**Response (200)** - Authorization complete:
```typescript
interface DeviceTokenResponse {
  session_token: string;    // Backend session token
  user: {
    id: number;
    login: string;
    avatar_url: string;
  };
  installations: Array<{
    id: number;
    account: {
      login: string;
      type: 'User' | 'Organization';
      avatar_url: string;
    };
  }>;
}
```

**Response (202)** - Authorization pending:
```typescript
interface DeviceTokenPending {
  error: 'authorization_pending';
  error_description: string;
}
```

**Errors**:
- 400: `{ error: 'expired_token' }` - Device code expired
- 400: `{ error: 'access_denied' }` - User denied authorization
- 429: Rate limited (slow_down)

---

### POST /auth/token/refresh

Get new installation access token.

**Request**:
```typescript
interface TokenRefreshRequest {
  installation_id: number;
}
```

**Headers**:
```
Authorization: Bearer <session_token>
```

**Response (200)**:
```typescript
interface TokenRefreshResponse {
  access_token: string;
  expires_at: string;       // ISO timestamp
  installation_id: number;
}
```

**Errors**:
- 401: Invalid or expired session
- 403: Installation not accessible
- 404: Installation not found

---

### POST /auth/installations

Refresh installations list (for users who installed app after auth).

**Headers**:
```
Authorization: Bearer <session_token>
```

**Response (200)**:
```typescript
interface InstallationsResponse {
  installations: Array<{
    id: number;
    account: {
      login: string;
      type: 'User' | 'Organization';
      avatar_url: string;
    };
  }>;
}
```

---

### POST /auth/logout

End session and clear backend state.

**Headers**:
```
Authorization: Bearer <session_token>
```

**Response (200)**:
```typescript
interface LogoutResponse {
  success: boolean;
}
```

---

## GitHub API Operations

All GitHub API calls use `@issuedesk/github-api` package. The mobile app wraps these with React hooks.

### Issues

#### List Issues

```typescript
// Hook: useIssues()
interface IssueListParams {
  state?: 'open' | 'closed' | 'all';
  labels?: string;        // Comma-separated
  sort?: 'created' | 'updated' | 'comments';
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

interface IssueListResult {
  success: boolean;
  data?: Issue[];
  message?: string;
}
```

#### Get Issue

```typescript
interface IssueGetParams {
  issue_number: number;
}

interface IssueGetResult {
  success: boolean;
  data?: Issue;
  message?: string;
}
```

#### Create Issue

```typescript
interface IssueCreateParams {
  title: string;
  body?: string;
  labels?: string[];
}

interface IssueCreateResult {
  success: boolean;
  data?: Issue;
  message?: string;
}
```

#### Update Issue

```typescript
interface IssueUpdateParams {
  issue_number: number;
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
}

interface IssueUpdateResult {
  success: boolean;
  data?: Issue;
  message?: string;
}
```

---

### Labels

#### List Labels

```typescript
// Hook: useLabels()
interface LabelListParams {
  per_page?: number;
  page?: number;
}

interface LabelListResult {
  success: boolean;
  data?: Label[];
  message?: string;
}
```

---

### Comments

#### List Comments

```typescript
// Hook: useComments(issueNumber)
interface CommentListParams {
  issue_number: number;
  per_page?: number;
  page?: number;
}

interface CommentListResult {
  success: boolean;
  data?: Comment[];
  message?: string;
}
```

#### Create Comment

```typescript
interface CommentCreateParams {
  issue_number: number;
  body: string;
}

interface CommentCreateResult {
  success: boolean;
  data?: Comment;
  message?: string;
}
```

---

### Repositories

#### List Installation Repositories

```typescript
// Hook: useRepositories()
interface RepositoryListResult {
  success: boolean;
  data?: Repository[];
  message?: string;
}
```

---

## Error Handling Contract

All API operations should follow this error pattern:

```typescript
interface ApiError {
  success: false;
  message: string;
  code?: string;  // e.g., 'RATE_LIMITED', 'UNAUTHORIZED', 'NOT_FOUND'
  retryable?: boolean;
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| UNAUTHORIZED | Token expired/invalid | Redirect to login |
| RATE_LIMITED | GitHub API rate limit | Show warning, retry after reset |
| NOT_FOUND | Resource doesn't exist | Show error message |
| NETWORK_ERROR | No connectivity | Show offline indicator |
| SERVER_ERROR | Backend error | Show error, allow retry |

---

## Mobile-Specific Considerations

1. **Retry Logic**: All network calls should retry 3x with exponential backoff
2. **Timeout**: 30s timeout for all requests
3. **Cancellation**: Support request cancellation on navigation
4. **Caching**: No client-side caching in MVP (fetch fresh on each screen)
5. **Pagination**: Load 30 items per page, support "Load More"
