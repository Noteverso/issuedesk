# IPC Contract: GitHub App Authorization

**Feature**: 002-github-app-auth  
**Date**: 2025-11-06  
**Status**: Complete

## Overview

This document defines all IPC (Inter-Process Communication) channels between the Electron renderer (React UI) and main process for GitHub App authentication.

**Security Pattern**: All channels use `contextBridge` with explicit allow-list. No direct Node.js access from renderer.

---

## Channel Definitions

### 1. Initiate GitHub Login

**Channel**: `auth:github-login`  
**Direction**: Renderer → Main → Backend → Renderer (event)  
**Priority**: P1 (US1: Initial Authentication)

#### Request

```typescript
interface GitHubLoginRequest {
  // No parameters - uses app-level GitHub App credentials
}
```

**Trigger**: User clicks "Login with GitHub" button

**Main Process Actions**:
1. Call backend `POST /auth/device` to get device code
2. Open external browser to `verification_uri`
3. Start polling backend `POST /auth/poll` every `interval` seconds
4. Emit `auth:user-code` event with user code (for UI display)
5. On successful poll, emit `auth:login-success` event
6. On poll failure/timeout, emit `auth:login-error` event

#### Response (via Events)

**Success Event**: `auth:user-code`
```typescript
interface UserCodeEvent {
  userCode: string; // 8-char display code (e.g., "ABCD-1234")
  verificationUri: string; // GitHub authorization URL
  expiresIn: number; // Seconds until code expires (900 = 15 min)
}
```

**Success Event**: `auth:login-success`
```typescript
interface LoginSuccessEvent {
  user: User; // See data-model.md
  installations: Installation[]; // Available installations
}
```

**Error Event**: `auth:login-error`
```typescript
interface LoginErrorEvent {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'ACCESS_DENIED' | 'RATE_LIMIT' | 'UNKNOWN';
  message: string; // Human-readable error
  retryable: boolean; // Can user retry?
}
```

#### Error Handling

| Error Code | HTTP Status | Retry Strategy | User Message |
|------------|-------------|----------------|--------------|
| `NETWORK_ERROR` | N/A | 3 retries (1s, 2s, 4s backoff) | "Network error. Retrying..." |
| `TIMEOUT` | N/A | No retry | "Login timed out. Please try again." |
| `ACCESS_DENIED` | 403 | No retry | "Access denied. Check app permissions." |
| `RATE_LIMIT` | 429 | No retry | "Too many requests. Wait 1 minute." |
| `UNKNOWN` | Any | No retry | "Login failed. Please try again." |

---

### 2. Get Current Session

**Channel**: `auth:get-session`  
**Direction**: Renderer → Main (invoke)  
**Priority**: P2 (US3: Session Persistence)

#### Request

```typescript
interface GetSessionRequest {
  // No parameters
}
```

**Trigger**: App startup, after login, before making API calls

**Main Process Actions**:
1. Read `UserSession` from electron-store
2. If exists and valid, return session
3. If expired or invalid, return `null`

#### Response

```typescript
type GetSessionResponse = UserSession | null;

interface UserSession {
  user: User;
  currentInstallation: Installation | null;
  installationToken: InstallationToken | null;
}
```

**Performance**: <10ms (local storage read)

---

### 3. Select Installation

**Channel**: `auth:select-installation`  
**Direction**: Renderer → Main → Backend  
**Priority**: P2 (US2: Installation Selection)

#### Request

```typescript
interface SelectInstallationRequest {
  installationId: number; // ID of selected installation
}
```

**Validation**:
- `installationId` must exist in user's installation list
- User must be authenticated

**Main Process Actions**:
1. Validate `installationId` against stored installations
2. Call backend `POST /auth/installation-token` with installation ID
3. Store returned `InstallationToken` in electron-store
4. Update `UserSession.currentInstallation`

#### Response

```typescript
interface SelectInstallationResponse {
  installation: Installation;
  token: InstallationToken;
}
```

**Error Codes**:
- `INVALID_INSTALLATION`: Installation ID not found
- `NETWORK_ERROR`: Backend unreachable
- `UNAUTHORIZED`: Session expired

---

### 4. Refresh Installation Token

**Channel**: `auth:refresh-installation-token`  
**Direction**: Main → Backend (automatic, no renderer call)  
**Priority**: P3 (US4: Auto Token Refresh)

#### Trigger

**Automatic**: When `InstallationToken.expires_at` is within 5 minutes of now

**Manual**: Before any GitHub API call requiring installation token

#### Request

```typescript
interface RefreshInstallationTokenRequest {
  installationId: number; // Current installation ID
}
```

**Main Process Actions**:
1. Call backend `POST /auth/refresh-installation-token`
2. Update `InstallationToken` in electron-store
3. Emit `auth:token-refreshed` event (optional, for UI notification)

#### Response

```typescript
interface RefreshInstallationTokenResponse {
  token: InstallationToken;
}
```

**Error Handling**:
- If refresh fails, log user out and emit `auth:session-expired` event
- UI should show "Session expired. Please log in again."

---

### 5. Logout

**Channel**: `auth:logout`  
**Direction**: Renderer → Main → Backend  
**Priority**: P1 (US5: Security Controls)

#### Request

```typescript
interface LogoutRequest {
  // No parameters
}
```

**Trigger**: User clicks "Logout" button

**Main Process Actions**:
1. Call backend `POST /auth/logout` to invalidate session
2. Delete `UserSession` from electron-store
3. **Clear TokenCache** (all installation tokens, FR-013b)
4. Clear any in-memory auth state
5. Emit `auth:logout-success` event

#### Response

```typescript
interface LogoutResponse {
  success: boolean;
}
```

**Error Handling**:
- Even if backend call fails, still clear local session and token cache
- Always emit `auth:logout-success`

---

### 6. Check Offline Status **NEW (2025-11-20)**

**Channel**: `auth:check-offline-status`  
**Direction**: Renderer → Main  
**Priority**: P3 (FR-029b/c)

#### Request

```typescript
interface CheckOfflineStatusRequest {
  // No parameters
}
```

**Trigger**: UI component needs to check current connectivity status

**Main Process Actions**:
1. Return current backend connectivity state
2. Include cached token expiration if in offline mode

#### Response

```typescript
interface CheckOfflineStatusResponse {
  isOffline: boolean;
  reason?: 'BACKEND_UNREACHABLE' | 'NETWORK_ERROR';
  cachedTokenExpiresAt?: string; // Present if offline mode active
  lastSuccessfulConnection?: string; // ISO 8601 timestamp
}
```

---

## Event Subscriptions

Renderer can subscribe to these events:

```typescript
// User code displayed during login
window.electron.auth.on('user-code', (event: UserCodeEvent) => void);

// Login successful
window.electron.auth.on('login-success', (event: LoginSuccessEvent) => void);

// Login failed
window.electron.auth.on('login-error', (event: LoginErrorEvent) => void);

// Token refreshed (optional UI notification)
window.electron.auth.on('token-refreshed', (event: TokenRefreshedEvent) => void);

// Session expired (force re-login)
window.electron.auth.on('session-expired', () => void);

// Logout successful
window.electron.auth.on('logout-success', () => void);

// **NEW (2025-11-20)**: Offline mode enabled (backend unreachable, FR-029b/c)
window.electron.auth.on('offline-mode-enabled', (event: OfflineModeEvent) => void);

// **NEW (2025-11-20)**: Offline mode disabled (backend reconnected)
window.electron.auth.on('offline-mode-disabled', () => void);

// **NEW (2025-11-20)**: Device code expired (15-minute timeout, FR-004a)
window.electron.auth.on('device-code-expired', (event: DeviceCodeExpiredEvent) => void);

// **NEW (2025-11-20)**: Installation token cached (instant switch ready, FR-013a)
window.electron.auth.on('installation-token-cached', (event: TokenCachedEvent) => void);
```

---

## TypeScript Definitions

**File**: `apps/desktop/src/renderer/types/ipc.ts`

```typescript
// Request/Response types
export interface GitHubLoginRequest {}
export interface GetSessionRequest {}
export interface SelectInstallationRequest {
  installationId: number;
}
export interface RefreshInstallationTokenRequest {
  installationId: number;
}
export interface LogoutRequest {}

export type GetSessionResponse = UserSession | null;
export interface SelectInstallationResponse {
  installation: Installation;
  token: InstallationToken;
}
export interface RefreshInstallationTokenResponse {
  token: InstallationToken;
}
export interface LogoutResponse {
  success: boolean;
}

// Event types
export interface UserCodeEvent {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
}

export interface LoginSuccessEvent {
  user: User;
  installations: Installation[];
}

export interface LoginErrorEvent {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'ACCESS_DENIED' | 'RATE_LIMIT' | 'UNKNOWN';
  message: string;
  retryable: boolean;
}

export interface TokenRefreshedEvent {
  expiresAt: string;
  // **NEW (2025-11-20)**: Indicates if deduplication occurred
  deduplicated?: boolean;
}

// **NEW (2025-11-20)**: Offline mode event (FR-029b/c)
export interface OfflineModeEvent {
  reason: 'BACKEND_UNREACHABLE' | 'NETWORK_ERROR';
  message: string;
  cachedTokenExpiresAt: string; // When cached token expires
}

// **NEW (2025-11-20)**: Device code timeout event (FR-004a)
export interface DeviceCodeExpiredEvent {
  message: string;
  canRetry: true; // Always true - user can generate new code
}

// **NEW (2025-11-20)**: Token cached event (FR-013a)
export interface TokenCachedEvent {
  installationId: number;
  accountLogin: string;
  expiresAt: string;
}

// Preload API surface
export interface AuthAPI {
  // Invoke methods
  githubLogin: () => Promise<void>;
  getSession: () => Promise<GetSessionResponse>;
  selectInstallation: (req: SelectInstallationRequest) => Promise<SelectInstallationResponse>;
  logout: () => Promise<LogoutResponse>;
  
  // Event listeners
  on: (
    channel: 'user-code' | 'login-success' | 'login-error' | 'token-refreshed' | 'session-expired' | 'logout-success',
    listener: (event: any) => void
  ) => void;
  
  off: (
    channel: string,
    listener: (event: any) => void
  ) => void;
}

declare global {
  interface Window {
    electron: {
      auth: AuthAPI;
    };
  }
}
```

---

## Security Constraints

1. **No secrets in renderer**: Private keys, client secrets stay in backend
2. **Token validation**: Main process validates all tokens before exposing to renderer
3. **Input sanitization**: All renderer inputs validated with Zod schemas in main process
4. **Rate limiting**: Main process enforces max 1 login attempt per 10 seconds
5. **Session encryption**: electron-store uses platform keychain for token storage

---

## Performance Requirements

| Channel | Max Latency (P95) | Notes |
|---------|-------------------|-------|
| `auth:github-login` | <3s (cold start) | Includes backend device code request |
| `auth:get-session` | <10ms | Local storage read |
| `auth:select-installation` | <500ms | Backend token exchange |
| `auth:refresh-installation-token` | <500ms | Background operation |
| `auth:logout` | <100ms | Local cleanup (backend call non-blocking) |

---

## Testing

**File**: `tests/contract/auth.spec.ts`

```typescript
describe('Auth IPC Contracts', () => {
  it('should validate GitHubLoginRequest schema');
  it('should validate SelectInstallationRequest schema');
  it('should emit user-code event during login');
  it('should emit login-success on successful auth');
  it('should emit login-error on failure');
  it('should return null for getSession when no session exists');
  it('should refresh token automatically when near expiry');
  it('should clear session on logout');
});
```

---

**Next**: Define backend API contracts (REST)
