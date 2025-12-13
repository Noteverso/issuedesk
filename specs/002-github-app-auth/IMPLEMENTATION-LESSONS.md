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

---

## Repository Selection Implementation (2025-12-09)

### Problem: Full-Screen Repository Selector Prevented Logout

**Issue**: Initial implementation showed RepositorySelector as a full-screen overlay that replaced the entire app UI, preventing users from accessing logout button or navigation.

**Root Cause**: RepositorySelector was rendered at the App.tsx level as a return statement, completely replacing the Layout component.

**Solution**: Integrated RepositorySelector into the main Layout component:

```typescript
// App.tsx - Pass state to Layout via props
<Layout 
  needsRepositorySelection={!!(isAuthenticated && session?.installationToken && !settings?.activeRepositoryId)}
  installationToken={session?.installationToken?.token}
  onRepositorySelected={handleRepositorySelected}
/>

// Layout.tsx - Conditionally render in main content area
<main className="flex-1 overflow-auto">
  <div className="h-full">
    {needsRepositorySelection && installationToken && onRepositorySelected ? (
      <RepositorySelector
        installationToken={installationToken}
        onRepositorySelected={onRepositorySelected}
      />
    ) : (
      <Outlet />
    )}
  </div>
</main>
```

**Key Changes**:
- Changed from `min-h-screen bg-background` to `h-full overflow-auto` in RepositorySelector
- Component now fits within Layout's main content area
- Header with logout button remains visible and functional

**Lesson**: Critical UI components (like logout) should remain accessible during all user flows, even onboarding/setup flows.

---

### GitHub API Endpoint for Installation Repositories

**Challenge**: Using `/installation/repositories` endpoint required proper method abstraction.

**Solution**: Created dedicated `getInstallationRepositories()` method following the pattern of existing methods like `getIssues()`:

```typescript
// packages/github-api/src/github-client.ts
async getInstallationRepositories(
  options: {
    per_page?: number;
    page?: number;
  } = {}
): Promise<ApiResponse<Repository[]>> {
  try {
    const params = new URLSearchParams();
    if (options.per_page) params.append('per_page', options.per_page.toString());
    if (options.page) params.append('page', options.page.toString());

    const url = params.toString() 
      ? `/installation/repositories?${params.toString()}`
      : '/installation/repositories';

    const response: AxiosResponse<{ repositories: Repository[] }> = await this.client.get(url);
    return {
      data: response.data.repositories,
      success: true,
    };
  } catch (error) {
    return {
      data: [],
      success: false,
      message: (error as ApiError).message,
    };
  }
}
```

**Benefits**:
- Consistent API pattern across all GitHub operations
- Proper error handling and type safety
- Extracts `repositories` array from response automatically
- Single source of truth for endpoint structure

**Usage**:
```typescript
// apps/desktop/src/main/ipc/settings.ts
const client = new GitHubClient(token);
const result = await client.getInstallationRepositories({ per_page: 100 });
```

**Lesson**: When adding new GitHub API operations, follow existing patterns in GitHubClient rather than using raw `client.request()` calls. This ensures consistency, proper typing, and easier maintenance.

---

### Type Confusion: Repository vs GitHubRepository

**Issue**: RepositorySelector was using wrong `Repository` type (internal app type) instead of `GitHubRepository` (GitHub API response type).

**Root Cause**: Two different types with similar names:
- `Repository` from `types/repository.ts` - Internal app type with `fullName`, `databaseVersion`
- `GitHubRepository` from `types/ipc.ts` - GitHub API response type with `full_name`, `owner.login`

**Solution**: 
```typescript
import { GitHubRepository } from '@issuedesk/shared';

export function RepositorySelector({ installationToken, onRepositorySelected }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  // ...
}
```

**Lesson**: Be explicit about which type you're using when dealing with external APIs vs internal domain models. Consider prefixing external types (e.g., `GitHubRepository`) to avoid confusion.

---

### Logout Implementation: Backend + Client Coordination

**Date**: 2025-12-11  
**Tasks**: T073-T075 (Phase 8 - Logout Functionality)

**Challenge**: Implement robust logout that clears both backend session (KV storage) and client session (electron-store), with graceful degradation when backend is unreachable.

**Key Decisions**:

1. **Backend Session Deletion**:
   - Created `POST /auth/logout` endpoint in Worker
   - Validates `X-Session-Token` header format (128 hex chars)
   - Uses existing `deleteSession()` from `storage/sessions.ts`
   - Returns `{ success: true }` on success, 401 if invalid/missing token

2. **Client-Side Resilience**:
   - IPC handler always clears local storage (defense in depth)
   - Continues with cleanup even if backend call fails
   - Logs errors but doesn't block user experience
   - Returns success in all cases

3. **Property Naming**:
   - Use `userToken` property from `UserSession` type
   - NOT `sessionToken` (that's only in `BackendSession`)
   - Different types for client vs backend session structure

**Implementation Pattern**:
```typescript
// IPC Handler (apps/desktop/src/main/ipc/auth.ts)
ipcMain.handle('auth:logout', async (): Promise<AuthLogoutResponse> => {
  const session = getStoredSession();
  
  if (!session?.userToken) {
    clearStoredSession();
    return { success: true };
  }

  try {
    // Call backend to delete session
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': session.userToken, // Use userToken, not sessionToken
      },
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Continue with local cleanup anyway
  }

  // Always clear local storage
  clearStoredSession();
  return { success: true };
});
```

**UI Integration**:
- UserProfile component already had logout button (T075 verified existing implementation)
- Flow: UserProfile → AuthContext.logout() → authService.logout() → IPC call
- AuthContext clears React state after IPC call
- User redirected to login page

**Graceful Degradation Scenarios**:
1. **Backend Unreachable**: Local cleanup continues, user logged out from client perspective
2. **Session Already Expired**: 401 from backend handled gracefully, local cleanup continues
3. **No Session Exists**: Returns success immediately without backend call
4. **Network Error**: Caught and logged, local cleanup continues

**Lessons Learned**:
1. **Defense in Depth**: Always clear client state regardless of backend success
2. **Type Awareness**: Different session types for client (`UserSession`) vs backend (`BackendSession`)
3. **User Experience**: Never block logout on network failures - local cleanup is sufficient
4. **Security**: Backend validates token format before KV operations
5. **Existing Code**: Check what's already implemented (logout button existed, just needed backend integration)

**Documentation Created**:
- `LOGOUT-TEST.md`: Complete 6-phase testing guide with validation checklist
- Updated `tasks.md`: Marked T073-T075 complete, updated progress to 99/104 (95%)

---

### PAT Fallback Removal and Authentication Enforcement

**Date**: 2025-12-13  
**Context**: Removed all Personal Access Token (PAT) fallback logic to enforce GitHub App authentication only

**Problem**: IPC handlers (issues, labels, comments) had fallback logic to legacy PAT authentication when no installation token was found. This allowed the app to work with outdated authentication methods, causing confusion about authentication requirements.

**Changes Made**:

1. **Removed PAT Fallback from IPC Handlers**:
```typescript
// Before: getGitHubClient() with PAT fallback
function getGitHubClient(): GitHubClient | null {
  const session = getStoredSession();
  if (session?.installationToken?.token) {
    return new GitHubClient(session.installationToken.token);
  }
  
  // Fallback to PAT for backwards compatibility
  const token = keychain.getToken();
  if (token) {
    return new GitHubClient(token);
  }
  return null;
}

// After: Installation token only
function getGitHubClient(): GitHubClient | null {
  const session = getStoredSession();
  if (session?.installationToken?.token) {
    return new GitHubClient(session.installationToken.token);
  }
  
  console.error('[IPC] ❌ No installation token found. Please login with GitHub App.');
  return null;
}
```

2. **Files Modified**:
   - `apps/desktop/src/main/ipc/issues.ts` - Removed keychain import and PAT fallback
   - `apps/desktop/src/main/ipc/labels.ts` - Removed keychain import and PAT fallback
   - `apps/desktop/src/main/ipc/comments.ts` - Removed keychain import and PAT fallback

**Lesson**: Removing legacy authentication paths early prevents confusion and enforces the new authentication model consistently across the app.

---

### React Router Navigation and Authentication Flow

**Date**: 2025-12-13  
**Context**: Fixed complex navigation issues with React Router integration in Electron app

**Problem 1: AuthGuard Not Redirecting**:
- AuthGuard was created but `/login` route didn't exist at router level
- App.tsx used conditional rendering (`return <Login />`) instead of routing
- When AuthGuard tried to `<Navigate to="/login" />`, nothing happened

**Solution**:
```typescript
// main.tsx - Added login route at root level
const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      // ... protected routes with AuthGuard
    ],
  },
];
```

**Problem 2: No Navigation After Login Success**:
- Login page showed success toast but didn't navigate anywhere
- User stayed on login page even after successful authentication

**Solution**:
```typescript
// Login.tsx - Navigate to dashboard after success
authService.onLoginSuccess(() => {
  toast.success('Login Successful', 'Welcome to IssueDesk!');
  setTimeout(() => {
    navigate('/dashboard', { replace: true });
  }, 500); // Delay for toast visibility
});
```

**Problem 3: Infinite Refresh Loop After Logout**:
- Login page had useEffect checking for auth and navigating to dashboard
- After logout, timing issues caused detect auth → navigate away → detect no auth → navigate back loop
- App.tsx also tried to navigate based on auth state without checking current location

**Solution**:
```typescript
// App.tsx - Check current location before navigating
useEffect(() => {
  if (!authLoading && !isAuthenticated && location.pathname !== '/login') {
    navigate('/login', { replace: true });
  }
}, [isAuthenticated, authLoading, navigate, location.pathname]);

useEffect(() => {
  if (!authLoading && isAuthenticated && location.pathname === '/login') {
    navigate('/dashboard', { replace: true });
  }
}, [isAuthenticated, authLoading, navigate, location.pathname]);

// Login.tsx - Removed auto-redirect useEffect
// Only navigate on explicit login success event
```

**Problem 4: Full-Screen Components vs Routing**:
- `InstallAppPrompt` needed to block entire UI when no installations found
- But it was inside routed component structure
- Conditional rendering in App.tsx (route parent) worked correctly for this use case

**Solution**: Keep full-screen blocking flows (InstallAppPrompt) as conditional renders in App.tsx, not as routes:
```typescript
// App.tsx - Before routing to child components
if (isAuthenticated && session && (!session.installations || session.installations.length === 0)) {
  return <InstallAppPrompt onRetry={handleCheckInstallations} isRetrying={checkingInstallations} />;
}

return (
  <Layout>
    <Outlet /> {/* Child routes render here */}
  </Layout>
);
```

**Key Lessons**:

1. **Route Structure for Electron + React Router**:
   - Login should be a separate route at root level, not conditionally rendered
   - App component as route parent can conditionally render full-screen blockers (InstallAppPrompt)
   - Child routes (Dashboard, Issues, etc.) should use AuthGuard wrapper

2. **Navigation State Checks**:
   - Always check `location.pathname` before calling `navigate()` to prevent infinite loops
   - Separate navigation concerns: components handle their own success navigation, App handles auth state navigation
   - Use `replace: true` for auth-related navigation to prevent back button issues

3. **Timing Considerations**:
   - Add small delays (500ms) when navigating after showing success messages
   - Don't auto-redirect from Login page based on auth check (causes loops)
   - Let explicit events (login success, logout) trigger navigation

4. **Authentication Flow Architecture**:
```
User visits app
  ↓
App.tsx checks: !isAuthenticated && pathname !== '/login' → navigate('/login')
  ↓
Login page displayed
  ↓
User logs in successfully → Login navigates to '/dashboard'
  ↓
App.tsx checks: isAuthenticated && pathname === '/login' → navigate('/dashboard')
  ↓
App.tsx checks: !session.installations → show InstallAppPrompt (full-screen)
  ↓
User installs app → clicks retry → App.tsx re-checks
  ↓
App.tsx renders: <Layout><Outlet /></Layout>
  ↓
AuthGuard checks: requireInstallation && !installationToken → navigate('/login')
  ↓
Dashboard renders (protected route)
```

5. **Common Pitfalls to Avoid**:
   - ❌ Checking auth and navigating without checking current location
   - ❌ Multiple components trying to control navigation based on same state
   - ❌ Using conditional rendering for Login instead of routing
   - ❌ Auto-redirecting from Login page based on auth check
   - ✅ Single source of truth for navigation per state change
   - ✅ Location-aware navigation logic
   - ✅ Explicit event-driven navigation for user actions

---

## Updated Documentation Recommendations (2025-12-09)

Add to existing sections:

4. **Create `REPOSITORY-SELECTION-TEST.md`**: ✅ CREATED
   - Complete testing guide for repository selection flow
   - 6 phases: Initial Auth → Installation → Repository Selection → Configuration → Dashboard → Validation
   - Multiple test scenarios and validation checklist

5. **Update `spec.md`**: ✅ UPDATED
   - Added FR-037 to FR-040 for repository selection requirements
   - Added acceptance scenarios to User Story 2
   - Documented Layout integration pattern

6. **Create `LOGOUT-TEST.md`**: ✅ CREATED (2025-12-11)
   - Complete testing guide for logout functionality
   - 6 test phases covering happy path, offline mode, invalid tokens, fresh install, session restoration, multiple installations
   - Validation checklist and success criteria

---

## Conclusion (Updated 2025-12-13)

Critical lessons for GitHub App authentication:

1. **Always include User-Agent header** for GitHub API requests
2. **Keep critical UI accessible** (logout, navigation) during all flows - integrate into Layout instead of full-screen overlays
3. **Follow established patterns** - create typed methods in GitHubClient instead of raw API calls
4. **Distinguish external vs internal types** - use explicit type names (GitHubRepository vs Repository)
5. **Use proper layout containers** - `h-full overflow-auto` for components within Layout, not `min-h-screen`
6. **Pass state through props** when child components need to conditionally render based on app state
7. **Graceful degradation** - Client operations (like logout) should succeed even if backend fails
8. **Type awareness** - Client types (UserSession) differ from backend types (BackendSession) in property names
9. **Verify existing code** - Check what's already implemented before creating duplicate functionality
10. **Remove legacy authentication** - Eliminate PAT fallback to enforce GitHub App authentication consistently
11. **Location-aware navigation** - Always check `location.pathname` before calling `navigate()` to prevent infinite loops
12. **Separate navigation concerns** - Components handle their own success navigation, parent components handle auth state navigation
13. **Route structure for Electron** - Login as separate route, blocking flows (InstallAppPrompt) as conditional renders in parent component
14. **Event-driven navigation** - Use explicit events (login success, logout) to trigger navigation, not automatic auth checks

These patterns create maintainable, user-friendly authentication flows that don't trap users in setup screens, handle network failures gracefully, and work seamlessly with React Router in Electron apps.


