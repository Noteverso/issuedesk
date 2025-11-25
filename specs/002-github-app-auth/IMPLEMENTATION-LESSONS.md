# Implementation Lessons Learned: GitHub App Authentication

**Feature**: 002-github-app-auth  
**Date**: 2025-11-17 to 2025-11-18  
**Status**: Phase 3 (US1 - Initial Authentication) - In Progress

## Overview

This document captures critical lessons learned during the implementation of GitHub App authentication with device flow. These lessons should inform future implementations and debugging sessions.

---

## Implementation Enhancements (2025-11-22)

### Auto-Copy Device Code to Clipboard

**Enhancement**: Device code is automatically copied to clipboard when user clicks "Login with GitHub"

**Implementation**:
```typescript
import { clipboard } from 'electron';

clipboard.writeText(deviceAuth.user_code);
console.log(`[Auth] Device code copied to clipboard: ${deviceAuth.user_code}`);
```

**UX Benefit**: User can simply paste (Ctrl+V / Cmd+V) the code on GitHub's authorization page without manual copying

### Manual Browser Opening

**Change**: Browser no longer opens automatically when clicking "Login with GitHub"

**Rationale**: 
- Gives user control over when to open browser
- Allows user to review device code first
- More predictable UX (user initiates browser action)

**Implementation**: Removed `shell.openExternal()` call from initial login handler; browser opens only when user clicks "Open GitHub" button in DeviceCodeModal

### Automatic Installation Selection

**Enhancement**: First available installation is automatically selected after successful authentication

**Implementation**:
```typescript
if (authData.installations && authData.installations.length > 0) {
  const firstInstallation = authData.installations[0];
  // Exchange for installation token automatically
  const tokenResponse = await fetch(`${BACKEND_URL}/auth/installation-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': authData.session_token,
    },
    body: JSON.stringify({ installation_id: firstInstallation.id }),
  });
  // Store token in session for immediate API access
}
```

**Benefit**: User can start using the app immediately without manual installation selection

### GitHub API Client Token Integration

**Critical Fix**: GitHub API calls now use installation tokens instead of PAT

**Problem**: Original implementation from Phase 1 (001-issues-management) used Personal Access Tokens. Phase 3 (002-github-app-auth) created installation tokens but didn't integrate them with the API client.

**Solution**: Updated `getGitHubClient()` in `issues.ts` and `labels.ts`:
```typescript
function getGitHubClient(): GitHubClient | null {
  // Try GitHub App installation token first
  const session = getStoredSession();
  if (session?.installationToken?.token) {
    return new GitHubClient(session.installationToken.token);
  }
  
  // Fallback to PAT for backwards compatibility
  const token = getKeychainManager().getToken();
  if (token) {
    return new GitHubClient(token);
  }
  
  return null;
}
```

**Files Modified**:
- `apps/desktop/src/main/ipc/issues.ts`
- `apps/desktop/src/main/ipc/labels.ts`
- `apps/desktop/src/main/ipc/auth.ts` (implemented T046 - select-installation handler)

**Session Structure**:
```typescript
interface UserSession {
  userToken: string;                      // Backend session token
  user: User;                             // GitHub user profile
  currentInstallation: Installation | null; // Selected installation
  installationToken: InstallationToken | null; // GitHub API token
}
```

---

## Critical Issues Encountered & Resolutions

### 1. GitHub API User-Agent Requirement ⚠️ **CRITICAL**

**Issue**: All GitHub API requests were returning 403 Forbidden with message:
```
Request forbidden by administrative rules. Please make sure your request has a 
User-Agent header (https://docs.github.com/en/rest/overview/resources-in-the-rest-api#user-agent-required)
```

**Root Cause**: 
- GitHub's REST API requires a `User-Agent` header on ALL requests
- `fetch()` API does not automatically include this header (unlike `curl` which does)
- This is a mandatory GitHub API requirement, not optional

**Solution**:
```typescript
// Add to all GitHub API requests
const USER_AGENT = 'IssueDesk/1.0.0'; // App name + version

headers: {
  'User-Agent': USER_AGENT,
  // ... other headers
}
```

**Affected Endpoints**:
- ✅ `POST https://github.com/login/device/code` (device flow initiation)
- ✅ `POST https://github.com/login/oauth/access_token` (device flow polling)
- ✅ `GET https://api.github.com/user` (user profile)
- ✅ `GET https://api.github.com/user/installations` (installations list)
- ✅ `POST https://api.github.com/app/installations/{id}/access_tokens` (token exchange)

**Files Modified**:
- `workers/auth/src/auth/github.ts` - Added `USER_AGENT` constant and header to all requests

**Prevention**: 
- Always include `User-Agent` header in GitHub API client base configuration
- Add to API client documentation/examples
- Consider creating a base `fetch` wrapper that includes it automatically

---

### 2. GitHub Device Flow URL Endpoints

**Issue**: Initial implementation used wrong base URL for device flow endpoints

**Incorrect URLs**:
```typescript
// ❌ WRONG
'https://api.github.com/login/device/code'
'https://api.github.com/login/oauth/access_token'
```

**Correct URLs**:
```typescript
// ✅ CORRECT
'https://github.com/login/device/code'
'https://github.com/login/oauth/access_token'
```

**Key Difference**:
- Device flow authentication endpoints use `github.com` (not `api.github.com`)
- Standard REST API endpoints use `api.github.com`
- This is a GitHub-specific quirk, not documented prominently

**Documentation Reference**: 
https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#using-the-device-flow-to-generate-a-user-access-token

---

### 3. OAuth Scope for Installation Access

**Issue**: Access token couldn't access `/user/installations` endpoint (403 error)

**Root Cause**: Missing OAuth scope in device flow initiation

**Solution**:
```typescript
// Device flow initiation requires empty scope for GitHub Apps
body: JSON.stringify({
  client_id: this.env.GITHUB_CLIENT_ID,
  scope: '', // ✅ REQUIRED: Empty string grants installation access
})
```

**Key Insight**:
- For GitHub Apps using device flow, installation access is granted through app permissions, not OAuth scopes
- However, the `scope` parameter MUST still be included (with empty string value)
- This tells GitHub to grant access based on the app's configured permissions
- Without this parameter, the access token lacks installation permissions

**Contrast with OAuth Apps**:
- OAuth Apps require explicit scopes like `read:org`, `read:user`, etc.
- GitHub Apps use installation-based permissions instead

---

### 4. TypeScript Type Configuration Conflicts

**Issue**: 90+ TypeScript errors when compiling Cloudflare Worker code

**Root Cause**: Type conflict between `@types/node` and `@cloudflare/workers-types`

**Error Example**:
```typescript
// Both type libraries define 'fetch', 'Request', 'Response', etc.
// Node.js types conflict with Web standard types used by Workers
```

**Solution**:
```json
// tsconfig.json for Cloudflare Worker
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"], // ✅ Remove "node"
    "skipLibCheck": true, // Skip type checking in node_modules
  }
}
```

**Key Takeaway**:
- Cloudflare Workers use Web standard APIs (Web Crypto, fetch, etc.)
- Node.js types should NOT be included in Worker TypeScript config
- Use `skipLibCheck: true` to avoid conflicts in hoisted node_modules

---

### 5. GitHub API Response Type Modeling

**Issue**: `pollDeviceFlow()` method initially returned simplified `{ access_token: string }`

**Problem**: 
- Lost type information about error states (authorization_pending, slow_down, etc.)
- Couldn't handle optional fields (refresh_token, expires_in)
- Not accurately representing GitHub's API contract

**Solution**: Created discriminated union type matching actual GitHub response:

```typescript
// packages/shared/src/types/github.ts
export type GitHubDeviceFlowResponse = 
  | {
      // Success response
      access_token: string;
      token_type: 'bearer';
      scope: string;
      expires_in?: number;
      refresh_token?: string;
      refresh_token_expires_in?: number;
    }
  | {
      // Error response
      error: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied';
      error_description?: string;
      error_uri?: string;
      interval?: number; // Returned with slow_down
    };
```

**Benefits**:
- Type-safe error handling with discriminated union
- Complete representation of GitHub API contract
- Compiler enforces checking for error states
- Easy to extend if GitHub adds new fields

**Design Principle**: 
- **API response types should live in separate files from domain types**
- `types/github.ts` - Raw GitHub API responses
- `types/auth.ts` - Application domain models (UserSession, Installation, etc.)
- This separation makes it clear what's external API contract vs. internal model

---

### 6. Authorization Header Format

**Issue**: Initial confusion about correct authorization header format

**Testing Process**:
```typescript
// ❌ Tried: 'Authorization': 'token ${accessToken}'
// ❌ Tried: 'Authorization': 'Bearer ${accessToken}'
// ✅ Works: 'Authorization': `Bearer ${accessToken}`
```

**Correct Format**:
```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`, // OAuth 2.0 Bearer token format
}
```

**Note**: GitHub documentation uses "token" in examples, but standard OAuth 2.0 format is "Bearer"

---

## Environment Configuration

### Development Environment Setup

**File**: `workers/auth/.dev.vars` (local development only, NOT committed)

```bash
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_CLIENT_ID=Iv1.abcdef123456
GITHUB_CLIENT_SECRET=ghp_abc123def456...
```

**Key Format Requirements**:
- Private key must be in PKCS8 format (not PKCS1)
- Newlines must be escaped as `\n` in environment variables
- Quotes around private key are required if it contains spaces/newlines

**Validation Script**: 
```bash
node workers/auth/scripts/validate-env.cjs
```

Checks for:
- ✅ All required variables present
- ✅ No placeholder values (e.g., "your-app-id-here")
- ✅ Private key format (PKCS8 header detection)

---

## Type Safety Best Practices

### 1. Shared Type Organization

**Structure**:
```
packages/shared/src/types/
├── auth.ts     # Application domain types (UserSession, Installation)
├── github.ts   # GitHub API response types (GitHubDeviceFlowResponse)
└── index.ts    # Re-exports
```

**Rationale**:
- **auth.ts**: Internal application models (how we represent auth state)
- **github.ts**: External API contracts (how GitHub sends data)
- Separation prevents mixing concerns and makes API changes easier to track

### 2. Discriminated Unions for API Responses

**Pattern**:
```typescript
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Usage forces error handling
const response = await api.call();
if (response.success) {
  // TypeScript knows response.data exists
  console.log(response.data);
} else {
  // TypeScript knows response.error exists
  console.error(response.error);
}
```

**Benefits**:
- Compiler enforces error checking
- No runtime surprises
- Self-documenting code

---

## Testing Strategies

### Manual Testing with curl

**Test Installation Access**:
```bash
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Authorization: Bearer <access_token>" \
  https://api.github.com/user/installations
```

**Test User Profile**:
```bash
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Authorization: Bearer <access_token>" \
  https://api.github.com/user
```

**Key Insight**: curl automatically sends `User-Agent` header, which is why it worked when our code didn't

---

## GitHub App Configuration Requirements

### Required GitHub App Settings

1. **Device Flow**: Must be enabled in GitHub App settings
   - Settings → General → Enable Device Flow ✅
   
2. **Permissions**: 
   - Repository permissions: Issues (Read & Write)
   - Organization permissions: Members (Read) - if needed
   
3. **Installation**:
   - App must be installed on at least one account/organization
   - Users need to accept installation during device flow

**Common Error**: "Device flow is not enabled for this app"
- **Solution**: Enable in GitHub App settings under "Device Flow"

---

## Debugging Tips

### 1. Add Strategic Logging

**Pattern**:
```typescript
async getUserInstallations(accessToken: string): Promise<Installation[]> {
  console.log('[getUserInstallations] Token:', accessToken.substring(0, 10) + '...');
  console.log('[getUserInstallations] URL:', `${GITHUB_API_BASE}/user/installations`);
  
  const response = await fetch(/* ... */);
  
  console.log('[getUserInstallations] Response status:', response.status);
  console.log('[getUserInstallations] Response ok:', response.ok);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[getUserInstallations] Error response:', errorText);
  }
}
```

**Logging Best Practices**:
- Prefix with method name: `[getUserInstallations]`
- Log inputs (masked if sensitive): `Token: ghu_abc...`
- Log HTTP status before checking: `Response status: 403`
- Log error bodies for debugging: `Error response: {...}`

### 2. Test Incrementally

**Approach**:
1. ✅ Device flow initiation (get device code)
2. ✅ User authorization (manual step on GitHub)
3. ✅ Device flow polling (get access token)
4. ✅ Get user installations (with access token)
5. ⏸️ Installation token exchange (not yet tested)

**Benefit**: Isolate failures to specific steps rather than debugging entire flow

---

## Performance Considerations

### Token Polling Strategy

**Implementation**:
```typescript
// Poll every 5 seconds (GitHub's recommended interval)
const POLL_INTERVAL = 5000;
const MAX_POLL_ATTEMPTS = 180; // 15 minutes total

// Exponential backoff for rate limiting
if (error === 'slow_down') {
  interval *= 2; // Double the interval
}
```

**Optimization Opportunities**:
- Use WebSocket for real-time authorization notification (future)
- Implement client-side timeout to stop polling early
- Show elapsed time in UI during polling

---

## Security Notes

### Secrets Management

**NEVER store in client**:
- ❌ GitHub App Private Key
- ❌ GitHub Client Secret
- ❌ JWT tokens (GitHub App authentication)

**Safe to store in client (encrypted)**:
- ✅ User access tokens (1-hour expiry)
- ✅ User session tokens (backend reference)
- ✅ Installation IDs (public information)

**Encryption**:
```typescript
// Electron secure storage
import Store from 'electron-store';

const store = new Store({
  encryptionKey: 'your-secret-key', // From Electron's safeStorage
});

store.set('session', { userToken, installationToken });
```

---

## Next Steps & Remaining Work

### Phase 3 Status: In Progress

**Completed**:
- ✅ Device flow initiation (backend + IPC + UI)
- ✅ Device flow polling (backend + IPC + UI)
- ✅ User installations retrieval
- ✅ User-Agent header fix
- ✅ OAuth scope configuration
- ✅ Type safety improvements (GitHubDeviceFlowResponse)

**Remaining**:
- ⏸️ Session creation in KV storage
- ⏸️ Installation token exchange
- ⏸️ End-to-end authentication flow test
- ⏸️ Error handling UI polish

**Blockers**: None currently

---

## Recommendations for Future Features

### 1. API Client Abstraction

Consider creating a base GitHub API client:

```typescript
class GitHubAPIClient {
  private readonly baseURL = 'https://api.github.com';
  private readonly userAgent = 'IssueDesk/1.0.0';
  
  async fetch(endpoint: string, options?: RequestInit): Promise<Response> {
    return fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...options?.headers,
      },
    });
  }
}
```

**Benefits**:
- Centralized User-Agent header
- Consistent API version header
- Easy to add retry logic, rate limiting, etc.

### 2. Error Type System

Consider creating a structured error system:

```typescript
class GitHubAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

// Usage
if (!response.ok) {
  const error = await response.json();
  throw new GitHubAPIError(
    response.status,
    error.error || 'UNKNOWN_ERROR',
    error.message || response.statusText,
    error
  );
}
```

### 3. Monitoring & Observability

Add structured logging for production:

```typescript
interface LogContext {
  userId?: number;
  installationId?: number;
  operation: string;
  duration?: number;
  error?: Error;
}

function log(level: 'info' | 'error', message: string, context: LogContext) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }));
}
```

---

## Documentation Updates Needed

1. **Update `quickstart.md`**:
   - Add User-Agent requirement
   - Add device flow URL clarification
   - Add OAuth scope explanation

2. **Update `contracts/backend-api.md`**:
   - Document all required headers (including User-Agent)
   - Update response types to match GitHubDeviceFlowResponse

3. **Update `research.md`**:
   - Add GitHub API quirks section
   - Document Cloudflare Worker type configuration

4. **Create `TROUBLESHOOTING.md`**:
   - Common errors and solutions
   - Debugging checklist
   - Test procedures

---

## Conclusion

The most critical lesson: **Always include User-Agent header for GitHub API requests**. This single issue blocked progress for hours because the error message was misleading (mentioned "administrative rules" rather than explicitly stating "User-Agent required").

Other key takeaways:
- Model API responses accurately with discriminated unions
- Separate external API types from internal domain types
- Test incrementally and log strategically
- Document quirks and gotchas as you discover them

This document should serve as a reference for future debugging sessions and prevent repeated mistakes.
