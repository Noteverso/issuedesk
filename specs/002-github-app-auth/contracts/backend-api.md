# Backend API Contract: GitHub App Authorization

**Feature**: 002-github-app-auth  
**Date**: 2025-11-06  
**Status**: Complete

## Overview

This document defines the REST API endpoints exposed by the Cloudflare Worker for GitHub App authentication.

**Base URL**: `https://auth.issuedesk.workers.dev` (example)  
**Format**: JSON  
**Authentication**: Session tokens in headers  

---

## Endpoints

### 1. Initialize Device Flow

**Endpoint**: `POST /auth/device`  
**Priority**: P1 (US1: Initial Authentication)  
**Authentication**: None (public endpoint)

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{}
```

No request body required - uses server-side GitHub App credentials.

#### Response

**Success (200 OK)**:
```json
{
  "device_code": "e34c1f3a7b2d...",
  "user_code": "ABCD-1234",
  "verification_uri": "https://github.com/login/device",
  "interval": 5,
  "expires_in": 900
}
```

**Response Schema**:
```typescript
interface DeviceFlowResponse {
  device_code: string; // Unique device code for polling
  user_code: string; // 8-char user-friendly code
  verification_uri: string; // GitHub authorization page
  interval: number; // Polling interval in seconds (5)
  expires_in: number; // Seconds until expiration (900 = 15 min)
}
```

**Error Responses**:

| Status | Error Code | Message | Cause |
|--------|------------|---------|-------|
| 500 | `GITHUB_API_ERROR` | "Failed to initiate device flow" | GitHub API down |
| 429 | `RATE_LIMIT` | "Too many requests" | Rate limit exceeded |

---

### 2. Poll for Authorization

**Endpoint**: `POST /auth/poll`  
**Priority**: P1 (US1: Initial Authentication)  
**Authentication**: None (uses device_code)

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "device_code": "e34c1f3a7b2d..."
}
```

**Request Schema**:
```typescript
interface PollRequest {
  device_code: string; // From /auth/device response
}
```

**Validation**:
- `device_code` must be non-empty string
- Must match a device code issued within last 15 minutes

#### Response

**Success (200 OK)** - User authorized:
```json
{
  "session_token": "a1b2c3d4...", // 128-char hex string
  "user": {
    "id": 12345,
    "login": "octocat",
    "name": "The Octocat",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345",
    "email": "octocat@github.com"
  },
  "installations": [
    {
      "id": 67890,
      "account": {
        "login": "octocat",
        "avatar_url": "https://avatars.githubusercontent.com/u/12345",
        "type": "User"
      },
      "repository_selection": "all",
      "permissions": {
        "issues": "write",
        "pull_requests": "write"
      }
    }
  ]
}
```

**Response Schema**:
```typescript
interface PollSuccessResponse {
  session_token: string; // Store in electron-store
  user: User; // See data-model.md
  installations: Installation[];
}
```

**Pending (202 Accepted)** - User has not authorized yet:
```json
{
  "status": "pending",
  "message": "Waiting for user authorization"
}
```

**Error Responses**:

| Status | Error Code | Message | Cause | Retry? |
|--------|------------|---------|-------|--------|
| 400 | `INVALID_DEVICE_CODE` | "Invalid or expired device code" | Bad device_code | No |
| 403 | `ACCESS_DENIED` | "User denied authorization" | User clicked cancel | No |
| 429 | `SLOW_DOWN` | "Polling too fast" | Interval < 5s | Yes, with longer interval |
| 500 | `GITHUB_API_ERROR` | "Failed to complete authorization" | GitHub API error | Yes (3 retries) |

**Polling Logic**:
1. Client calls every `interval` seconds (5s default)
2. If receives 202, continue polling
3. If receives 200, stop polling and store session
4. If receives 429, increase interval by 5 seconds
5. If receives error, stop polling and show error

---

### 3. Get Installation Token

**Endpoint**: `POST /auth/installation-token`  
**Priority**: P2 (US2: Installation Selection)  
**Authentication**: Required (`X-Session-Token` header)

#### Request

**Headers**:
```
Content-Type: application/json
X-Session-Token: a1b2c3d4... // 128-char session token
```

**Body**:
```json
{
  "installation_id": 67890
}
```

**Request Schema**:
```typescript
interface InstallationTokenRequest {
  installation_id: number; // Must be in user's installation list
}
```

**Validation**:
- Session token must be valid (not expired)
- Installation ID must belong to authenticated user
- Rate limit: 5 requests/minute/user

#### Response

**Success (200 OK)**:
```json
{
  "token": "ghs_abc123...",
  "expires_at": "2025-11-06T15:30:00Z"
}
```

**Response Schema**:
```typescript
interface InstallationTokenResponse {
  token: string; // Installation access token (starts with ghs_)
  expires_at: string; // ISO 8601 timestamp (1 hour from now)
}
```

**Error Responses**:

| Status | Error Code | Message | Cause |
|--------|------------|---------|-------|
| 401 | `UNAUTHORIZED` | "Invalid or expired session" | Bad session token |
| 403 | `FORBIDDEN` | "Installation not accessible" | Installation ID not owned by user |
| 429 | `RATE_LIMIT` | "Too many requests" | >5 requests/minute |
| 500 | `GITHUB_API_ERROR` | "Failed to generate installation token" | GitHub API error |

---

### 4. Refresh Installation Token

**Endpoint**: `POST /auth/refresh-installation-token`  
**Priority**: P3 (US4: Auto Token Refresh)  
**Authentication**: Required (`X-Session-Token` header)

#### Request

**Headers**:
```
Content-Type: application/json
X-Session-Token: a1b2c3d4...
```

**Body**:
```json
{
  "installation_id": 67890
}
```

**Request Schema**:
```typescript
interface RefreshInstallationTokenRequest {
  installation_id: number;
}
```

**Validation**: Same as `/auth/installation-token`

#### Response

**Success (200 OK)**:
```json
{
  "token": "ghs_xyz789...",
  "expires_at": "2025-11-06T16:30:00Z"
}
```

**Response Schema**: Same as `InstallationTokenResponse`

**Error Responses**: Same as `/auth/installation-token`

**Note**: This endpoint is functionally identical to `/auth/installation-token`. Separate endpoint for semantic clarity and potential future differentiation (e.g., logging, analytics).

---

### 5. Get Installations

**Endpoint**: `POST /auth/installations`  
**Priority**: P2 (US2: Installation Selection)  
**Authentication**: Required (`X-Session-Token` header)

#### Request

**Headers**:
```
Content-Type: application/json
X-Session-Token: a1b2c3d4...
```

**Body**:
```json
{}
```

No body required - uses session token to identify user.

#### Response

**Success (200 OK)**:
```json
{
  "installations": [
    {
      "id": 67890,
      "account": {
        "login": "octocat",
        "avatar_url": "https://avatars.githubusercontent.com/u/12345",
        "type": "User"
      },
      "repository_selection": "all",
      "permissions": {
        "issues": "write",
        "pull_requests": "write"
      }
    }
  ]
}
```

**Response Schema**:
```typescript
interface InstallationsResponse {
  installations: Installation[];
}
```

**Error Responses**:

| Status | Error Code | Message | Cause |
|--------|------------|---------|-------|
| 401 | `UNAUTHORIZED` | "Invalid or expired session" | Bad session token |
| 500 | `GITHUB_API_ERROR` | "Failed to fetch installations" | GitHub API error |

**Use Case**: Refresh installation list if user adds/removes installations after login.

---

### 6. Logout

**Endpoint**: `POST /auth/logout`  
**Priority**: P1 (US5: Security Controls)  
**Authentication**: Required (`X-Session-Token` header)

#### Request

**Headers**:
```
Content-Type: application/json
X-Session-Token: a1b2c3d4...
```

**Body**:
```json
{}
```

#### Response

**Success (200 OK)**:
```json
{
  "success": true
}
```

**Response Schema**:
```typescript
interface LogoutResponse {
  success: boolean;
}
```

**Backend Actions**:
1. Delete session from Cloudflare KV (`session:${token}`)
2. Delete rate limit state from KV (`ratelimit:${userId}`)
3. Return success

**Error Responses**:

| Status | Error Code | Message | Cause |
|--------|------------|---------|-------|
| 401 | `UNAUTHORIZED` | "Invalid session" | Token not found (already logged out) |

**Note**: 401 error is non-critical - client should still clear local session.

---

## Global Error Format

All error responses follow this schema:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: any; // Optional additional context
  };
}
```

**Example**:
```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests. Try again in 60 seconds.",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

## Authentication Flow

### Session Token Usage

All authenticated endpoints require `X-Session-Token` header:

```
X-Session-Token: a1b2c3d4e5f6... (128-char hex string)
```

**Backend Validation**:
1. Extract token from header
2. Look up session in KV: `session:${token}`
3. If not found → 401 Unauthorized
4. If found → update `lastAccessedAt` and proceed
5. Check rate limit: `ratelimit:${userId}`
6. If exceeded → 429 Too Many Requests

---

## Rate Limiting

**Strategy**: Per-user sliding window (60 seconds)

**Limits**:
- `/auth/device`: 10 requests/minute (global, all users)
- `/auth/poll`: No limit (controlled by `interval`)
- `/auth/installation-token`: 5 requests/minute/user
- `/auth/refresh-installation-token`: 5 requests/minute/user
- `/auth/installations`: 5 requests/minute/user
- `/auth/logout`: 1 request/minute/user

**Headers** (included in all responses):
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1699283400 (Unix timestamp)
```

**429 Response**:
```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests",
    "details": {
      "retry_after": 60
    }
  }
}
```

---

## Security

### CORS

```
Access-Control-Allow-Origin: electron://issuedesk (production)
Access-Control-Allow-Origin: http://localhost:* (development)
Access-Control-Allow-Methods: POST
Access-Control-Allow-Headers: Content-Type, X-Session-Token
```

### Secrets Management

**Environment Variables** (Cloudflare Worker):
```
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.abc123
GITHUB_CLIENT_SECRET=secret_xyz (Cloudflare secret)
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY----- (Cloudflare secret)
```

**Never Exposed**:
- Private key (backend only, for JWT signing)
- Client secret (backend only, for device flow)
- User OAuth tokens (stored in KV, never sent to client)

**Sent to Client**:
- Session tokens (128-char random, no sensitive data)
- Installation tokens (GitHub-issued, short-lived)

---

## Performance

**Target Latency** (P95):
- `/auth/device`: <500ms
- `/auth/poll`: <500ms
- `/auth/installation-token`: <500ms
- `/auth/refresh-installation-token`: <500ms
- `/auth/installations`: <500ms
- `/auth/logout`: <100ms

**Cold Start**: <3s (Cloudflare Workers target)

---

## Monitoring

**Metrics to Track**:
1. Request count per endpoint
2. Error rate by error code
3. P95/P99 latency per endpoint
4. Rate limit hit rate
5. Session creation rate
6. Active sessions (KV key count)
7. GitHub API quota usage

**Logging**:
- All requests: timestamp, endpoint, user ID, response status
- Errors: full stack trace, request context
- Security events: failed auth attempts, rate limit violations

---

## OpenAPI Specification

**File**: `workers/auth/openapi.yaml`

```yaml
openapi: 3.0.0
info:
  title: IssueDesk GitHub App Auth API
  version: 1.0.0
  description: Backend API for GitHub App device flow authentication

servers:
  - url: https://auth.issuedesk.workers.dev
    description: Production
  - url: http://localhost:8787
    description: Local development

paths:
  /auth/device:
    post:
      summary: Initialize device flow
      operationId: initiateDeviceFlow
      responses:
        '200':
          description: Device code generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DeviceFlowResponse'
        '429':
          $ref: '#/components/responses/RateLimitError'
        '500':
          $ref: '#/components/responses/ServerError'

  /auth/poll:
    post:
      summary: Poll for user authorization
      operationId: pollAuthorization
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PollRequest'
      responses:
        '200':
          description: User authorized
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PollSuccessResponse'
        '202':
          description: Pending authorization
        '400':
          $ref: '#/components/responses/BadRequest'
        '403':
          $ref: '#/components/responses/AccessDenied'
        '429':
          $ref: '#/components/responses/SlowDown'

  /auth/installation-token:
    post:
      summary: Get installation access token
      operationId: getInstallationToken
      security:
        - SessionToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/InstallationTokenRequest'
      responses:
        '200':
          description: Installation token generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InstallationTokenResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '429':
          $ref: '#/components/responses/RateLimitError'

  /auth/refresh-installation-token:
    post:
      summary: Refresh installation access token
      operationId: refreshInstallationToken
      security:
        - SessionToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RefreshInstallationTokenRequest'
      responses:
        '200':
          description: Token refreshed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InstallationTokenResponse'

  /auth/installations:
    post:
      summary: Get user's installations
      operationId: getInstallations
      security:
        - SessionToken: []
      responses:
        '200':
          description: Installations retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InstallationsResponse'

  /auth/logout:
    post:
      summary: Invalidate session
      operationId: logout
      security:
        - SessionToken: []
      responses:
        '200':
          description: Logged out
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LogoutResponse'

components:
  securitySchemes:
    SessionToken:
      type: apiKey
      in: header
      name: X-Session-Token

  schemas:
    DeviceFlowResponse:
      type: object
      required: [device_code, user_code, verification_uri, interval, expires_in]
      properties:
        device_code: { type: string }
        user_code: { type: string, pattern: '^[A-Z0-9-]{8}$' }
        verification_uri: { type: string, format: uri }
        interval: { type: integer, minimum: 1, maximum: 60 }
        expires_in: { type: integer, minimum: 1 }

    PollRequest:
      type: object
      required: [device_code]
      properties:
        device_code: { type: string }

    PollSuccessResponse:
      type: object
      required: [session_token, user, installations]
      properties:
        session_token: { type: string, minLength: 128, maxLength: 128 }
        user: { $ref: '#/components/schemas/User' }
        installations:
          type: array
          items: { $ref: '#/components/schemas/Installation' }

    User:
      type: object
      required: [id, login, name, avatar_url]
      properties:
        id: { type: integer }
        login: { type: string }
        name: { type: string }
        avatar_url: { type: string, format: uri }
        email: { type: string, format: email, nullable: true }

    Installation:
      type: object
      required: [id, account, repository_selection, permissions]
      properties:
        id: { type: integer }
        account: { $ref: '#/components/schemas/Account' }
        repository_selection: { type: string, enum: [all, selected] }
        permissions: { type: object }

    Account:
      type: object
      required: [login, avatar_url, type]
      properties:
        login: { type: string }
        avatar_url: { type: string, format: uri }
        type: { type: string, enum: [User, Organization] }

    InstallationTokenRequest:
      type: object
      required: [installation_id]
      properties:
        installation_id: { type: integer }

    RefreshInstallationTokenRequest:
      type: object
      required: [installation_id]
      properties:
        installation_id: { type: integer }

    InstallationTokenResponse:
      type: object
      required: [token, expires_at]
      properties:
        token: { type: string, pattern: '^ghs_' }
        expires_at: { type: string, format: date-time }

    InstallationsResponse:
      type: object
      required: [installations]
      properties:
        installations:
          type: array
          items: { $ref: '#/components/schemas/Installation' }

    LogoutResponse:
      type: object
      required: [success]
      properties:
        success: { type: boolean }

    ErrorResponse:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: object }

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    
    Unauthorized:
      description: Invalid or expired session
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    
    Forbidden:
      description: Access denied
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    
    AccessDenied:
      description: User denied authorization
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    
    RateLimitError:
      description: Too many requests
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    
    SlowDown:
      description: Polling too fast
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
    
    ServerError:
      description: Internal server error
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ErrorResponse' }
```

---

## Testing

**File**: `tests/contract/backend-api.spec.ts`

```typescript
describe('Backend API Contracts', () => {
  describe('POST /auth/device', () => {
    it('should return device code with valid format');
    it('should return 429 when rate limit exceeded');
  });

  describe('POST /auth/poll', () => {
    it('should return 202 when pending');
    it('should return 200 with session when authorized');
    it('should return 403 when access denied');
    it('should return 400 for invalid device code');
  });

  describe('POST /auth/installation-token', () => {
    it('should return token for valid installation');
    it('should return 401 for invalid session');
    it('should return 403 for inaccessible installation');
  });

  describe('POST /auth/logout', () => {
    it('should delete session from KV');
    it('should return success even if session not found');
  });
});
```

---

**Next**: Create quickstart.md
