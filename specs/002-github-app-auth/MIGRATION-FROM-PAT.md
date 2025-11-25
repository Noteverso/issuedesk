# Migration: Personal Access Token → GitHub App Authentication

**Feature**: 002-github-app-auth  
**Date**: 2025-11-18  
**Related Spec**: 001-issues-management

## Overview

This document describes the migration from Personal Access Token (PAT) authentication to GitHub App authentication with device flow. This change affects how users authenticate and how the application accesses GitHub APIs.

---

## What's Changing

### Before (001-issues-management)

**Authentication Method**: Personal Access Token (classic)

```typescript
// User manually creates PAT on GitHub
// User enters PAT in Settings page
// App stores PAT in OS keychain
const token = await keychain.getPassword('github-token');

// Direct API calls with PAT
fetch('https://api.github.com/repos/:owner/:repo/issues', {
  headers: {
    'Authorization': `token ${token}`,
  }
});
```

**User Flow**:
1. User goes to GitHub Settings → Developer settings → Personal access tokens
2. User creates token with `repo` scope
3. User copies token
4. User pastes token in app Settings page
5. App stores token in OS keychain (electron-store with encryption)
6. App uses token for all GitHub API calls

**Issues with PAT**:
- ❌ Long-lived tokens (no automatic expiration)
- ❌ User must manually create and copy token
- ❌ Full repository access (cannot limit to specific repos)
- ❌ Token exposed if user's system is compromised
- ❌ No installation-scoped permissions
- ❌ Difficult to revoke/rotate tokens

### After (002-github-app-auth)

**Authentication Method**: GitHub App with Device Flow + Installation Tokens

```typescript
// User initiates device flow in app
// Backend generates device code
// User authorizes on GitHub (no copying tokens)
// Backend exchanges for installation tokens (1-hour expiry)

const installationToken = await backend.getInstallationToken(installationId);

// API calls with short-lived installation token
fetch('https://api.github.com/repos/:owner/:repo/issues', {
  headers: {
    'Authorization': `Bearer ${installationToken}`,
  }
});
```

**User Flow**:
1. User clicks "Login with GitHub" in app
2. App displays device code (e.g., `ABCD-1234`)
3. User visits GitHub authorization page
4. User enters device code on GitHub
5. User selects which account/organization to authorize
6. App automatically receives authorization
7. App lists available installations for user to select
8. Backend exchanges installation ID for temporary token (1-hour)
9. App uses installation token for GitHub API calls
10. Token automatically refreshes when needed

**Benefits of GitHub App**:
- ✅ Short-lived tokens (1-hour expiration, auto-refresh)
- ✅ No manual token creation/copying
- ✅ Installation-scoped permissions (only authorized repos)
- ✅ Better security (tokens expire automatically)
- ✅ Fine-grained permissions
- ✅ Easy to revoke (uninstall app on GitHub)
- ✅ Backend handles all sensitive operations

---

## Migration Impact

### Removed Features

From **001-issues-management**:

1. **Settings: GitHub Token Input**
   - ❌ `Settings.tsx` - Token input field
   - ❌ `settings:setToken` IPC handler
   - ❌ Keychain storage for PAT

2. **Settings: Token Validation**
   - ❌ Token format validation
   - ❌ Token expiration checks
   - ❌ "Invalid token" error handling

3. **IPC Handlers**
   - ❌ `settings:setToken(token: string)`
   - ❌ `settings:getToken(): Promise<string | null>`
   - ❌ `settings:clearToken()`

### New Features

From **002-github-app-auth**:

1. **Login Page**
   - ✅ `Login.tsx` - Device flow UI
   - ✅ `DeviceCodeModal.tsx` - Display device code

2. **Installation Management**
   - ✅ `InstallationSwitcher.tsx` - Dropdown to switch between installations (header)
   - ✅ `InstallAppPrompt.tsx` - Guide users to install GitHub App (zero installations)
   - ✅ Auto-selection: First installation automatically selected on login

3. **IPC Handlers**
   - ✅ `auth:github-login()` - Initiate device flow
   - ✅ `auth:get-session()` - Retrieve current session
   - ✅ `auth:select-installation(installationId)` - Switch installation
   - ✅ `auth:refresh-installation-token()` - Refresh expired token
   - ✅ `auth:logout()` - Clear session

4. **Backend API**
   - ✅ `POST /auth/device` - Start device flow
   - ✅ `POST /auth/poll` - Poll for authorization
   - ✅ `POST /auth/installation-token` - Exchange for installation token
   - ✅ `POST /auth/refresh-installation-token` - Refresh token

---

## Code Changes Required

### 1. Remove PAT Storage (Settings)

**File**: `apps/desktop/src/main/ipc/settings.ts`

```typescript
// ❌ REMOVE: PAT-related handlers
export function registerSettingsHandlers(ipcMain: IpcMain) {
  // Remove these handlers:
  // - settings:setToken
  // - settings:getToken
  // - settings:clearToken
}
```

**File**: `apps/desktop/src/renderer/pages/Settings.tsx`

```typescript
// ❌ REMOVE: Token input UI
<FormControl>
  <FormLabel>GitHub Token</FormLabel>
  <Input
    type="password"
    value={token}
    onChange={(e) => setToken(e.target.value)}
    placeholder="ghp_xxxxxxxxxxxx"
  />
  <Button onClick={saveToken}>Save Token</Button>
</FormControl>
```

### 2. Update GitHub API Client

**File**: `packages/github-api/src/github-client.ts`

```typescript
// ❌ BEFORE: Direct PAT usage
class GitHubClient {
  constructor(private token: string) {}
  
  async getIssues(owner: string, repo: string) {
    return fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      headers: {
        'Authorization': `token ${this.token}`,
      }
    });
  }
}

// ✅ AFTER: Installation token with auto-refresh
class GitHubClient {
  constructor(
    private getToken: () => Promise<string>, // Function to get current token
    private onTokenExpired: () => Promise<string> // Function to refresh token
  ) {}
  
  async getIssues(owner: string, repo: string) {
    let token = await this.getToken();
    
    try {
      return await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        headers: {
          'Authorization': `Bearer ${token}`, // Note: Bearer instead of token
          'User-Agent': 'IssueDesk/1.0.0', // Required by GitHub
        }
      });
    } catch (error) {
      if (error.status === 401) {
        // Token expired, refresh and retry
        token = await this.onTokenExpired();
        return fetch(/* ... with new token */);
      }
      throw error;
    }
  }
}
```

### 3. Update Session Storage

**File**: `apps/desktop/src/main/storage/session.ts`

```typescript
// ❌ BEFORE: Store PAT
interface Session {
  token: string; // Personal Access Token
  repository: { owner: string; name: string };
}

// ✅ AFTER: Store session token + installation token
interface Session {
  userToken: string; // Backend session token (for re-auth)
  user: User; // GitHub user profile
  currentInstallation: Installation | null;
  installationToken: InstallationToken | null; // Short-lived (1 hour)
}
```

### 4. Update Initialization Flow

**File**: `apps/desktop/src/main/main.ts`

```typescript
// ❌ BEFORE: Check for PAT on startup
app.on('ready', async () => {
  const token = await getStoredToken();
  if (token) {
    // Validate token
    const isValid = await validateGitHubToken(token);
    if (isValid) {
      showMainWindow();
    } else {
      showSettingsWindow(); // Prompt for new token
    }
  } else {
    showSettingsWindow(); // No token, need setup
  }
});

// ✅ AFTER: Check for session on startup
app.on('ready', async () => {
  const session = await getStoredSession();
  if (session) {
    // Check if installation token is expired
    if (isTokenExpired(session.installationToken)) {
      // Try to refresh
      const newToken = await refreshInstallationToken(session.userToken);
      if (newToken) {
        await updateSession({ ...session, installationToken: newToken });
        showMainWindow();
      } else {
        // Refresh failed, need re-auth
        showLoginWindow();
      }
    } else {
      showMainWindow();
    }
  } else {
    showLoginWindow(); // No session, need login
  }
});
```

---

## User Experience Changes

### First-Time Setup

**Before (PAT)**:
1. User opens app → Settings page
2. Clicks "Need a token? Create one on GitHub"
3. Opens GitHub in browser
4. Creates PAT with `repo` scope
5. Copies token
6. Returns to app
7. Pastes token
8. Clicks "Save"
9. App validates token
10. **Total time**: ~3-5 minutes

**After (GitHub App)**:
1. User opens app → Login page
2. Clicks "Login with GitHub"
3. Sees device code: `ABCD-1234`
4. Clicks "Authorize on GitHub" (opens browser)
5. Enters device code on GitHub
6. Clicks "Authorize"
7. Returns to app (automatically logged in)
8. Selects installation (if multiple)
9. **Total time**: ~1-2 minutes

### Token Expiration

**Before (PAT)**:
- Token doesn't expire unless user revokes it
- If revoked, app shows "Authentication failed" error
- User must create new PAT and re-enter it

**After (GitHub App)**:
- Installation token expires after 1 hour
- App automatically refreshes token in background
- User never sees expiration (seamless)
- If refresh fails (app uninstalled), prompt to re-authorize

### Multi-Repository Access

**Before (PAT)**:
- Single PAT grants access to ALL repositories
- Cannot limit access to specific repos
- User has one token for everything

**After (GitHub App)**:
- Install GitHub App on specific repositories
- Can have multiple installations (different orgs)
- Each installation has separate token
- User can switch between installations in UI

---

## Migration Path for Existing Users

### Option 1: Hard Migration (Recommended)

**Remove PAT support entirely**:

1. On app update, detect existing PAT in keychain
2. Show migration prompt:
   ```
   ┌─────────────────────────────────────┐
   │  Authentication Update Required     │
   │                                     │
   │  IssueDesk now uses GitHub App      │
   │  authentication for better security │
   │  and easier setup.                  │
   │                                     │
   │  Your existing token will be        │
   │  removed. You'll need to login      │
   │  with your GitHub account.          │
   │                                     │
   │  [ Migrate to GitHub App ]          │
   └─────────────────────────────────────┘
   ```
3. Clear PAT from keychain
4. Show login screen
5. User completes device flow
6. Migration complete

**Pros**: Clean break, simpler codebase  
**Cons**: Requires user action immediately

### Option 2: Gradual Migration (Not Recommended)

**Support both PAT and GitHub App**:

1. Keep PAT support for 2-3 releases
2. Show banner: "Upgrade to GitHub App authentication"
3. Allow users to continue with PAT
4. After grace period, force migration

**Pros**: Less disruptive  
**Cons**: More complex codebase, longer maintenance burden

**Decision**: Use Option 1 (Hard Migration)

---

## Testing Strategy

### Manual Testing

1. **Fresh Install**:
   - ✅ New users see login page (not settings)
   - ✅ Device flow works end-to-end
   - ✅ Installation selection works
   - ✅ API calls use installation token

2. **Existing User**:
   - ✅ Migration prompt appears
   - ✅ Old PAT is cleared
   - ✅ User can complete device flow
   - ✅ Previous settings (theme, etc.) preserved

3. **Token Refresh**:
   - ✅ Token refreshes automatically when expired
   - ✅ No interruption to user workflow
   - ✅ API calls queue during refresh

4. **Error Scenarios**:
   - ✅ App uninstalled on GitHub → prompt to reinstall
   - ✅ Network error during refresh → retry logic works
   - ✅ Invalid session → redirect to login

### Automated Testing

```typescript
// Test migration from PAT to GitHub App
describe('PAT to GitHub App Migration', () => {
  it('should clear old PAT on first launch', async () => {
    // Setup: Store fake PAT
    await store.set('github-token', 'ghp_oldtoken123');
    
    // Launch app
    await app.launch();
    
    // Assert: PAT is cleared
    const token = await store.get('github-token');
    expect(token).toBeNull();
  });
  
  it('should show migration prompt', async () => {
    await app.launch();
    const prompt = await app.findByText('Authentication Update Required');
    expect(prompt).toBeVisible();
  });
  
  it('should redirect to login after migration', async () => {
    await app.launch();
    await app.click('Migrate to GitHub App');
    const loginPage = await app.findByTestId('login-page');
    expect(loginPage).toBeVisible();
  });
});
```

---

## Rollback Plan

If GitHub App authentication has critical issues:

1. **Create hotfix branch** from last stable PAT version
2. **Restore PAT authentication** code
3. **Release hotfix** with version downgrade instructions
4. **Investigate GitHub App issues** in parallel
5. **Re-deploy GitHub App** after fixes

**Note**: This is why we should thoroughly test before releasing to production.

---

## Documentation Updates

### Update These Files

1. **README.md**:
   - Remove "Create GitHub Personal Access Token" section
   - Add "Install GitHub App" section with link
   - Update screenshots showing new login flow

2. **User Guide**:
   - Remove PAT creation instructions
   - Add device flow walkthrough
   - Add installation selection guide

3. **API Documentation**:
   - Update authentication examples
   - Change `Authorization: token` → `Authorization: Bearer`
   - Add User-Agent requirement

4. **Troubleshooting**:
   - Remove PAT-related issues
   - Add GitHub App installation issues
   - Add token refresh troubleshooting

---

## Timeline

**Phase 1**: Remove PAT Code (1 day)
- Remove settings IPC handlers
- Remove token input UI
- Clear keychain storage

**Phase 2**: Integrate GitHub App Auth (2 days)
- Add login page
- Add device flow handlers
- Add installation selection

**Phase 3**: Update GitHub API Client (1 day)
- Change Authorization header
- Add token refresh logic
- Add User-Agent header

**Phase 4**: Migration Logic (1 day)
- Detect existing PAT
- Show migration prompt
- Clear old data

**Phase 5**: Testing (2 days)
- Manual testing all flows
- Automated test suite
- Security audit

**Total**: ~7 days

---

## Security Considerations

### Improved Security

✅ **Short-lived tokens**: 1-hour expiration reduces attack window  
✅ **No long-lived secrets on client**: Only temporary tokens stored  
✅ **Installation-scoped**: Limited to authorized repositories  
✅ **Backend-controlled**: All sensitive operations in Cloudflare Worker  
✅ **Easy revocation**: Uninstall app on GitHub instantly revokes access

### Potential Risks

⚠️ **Backend dependency**: If Worker is down, users can't authenticate  
⚠️ **Token refresh failures**: Need robust retry logic  
⚠️ **Session hijacking**: If userToken is stolen, attacker can impersonate user

**Mitigations**:
- Worker has 99.9% uptime (Cloudflare SLA)
- Implement exponential backoff retries (1s, 2s, 4s)
- Encrypt userToken in electron-store
- Implement rate limiting on backend (5 req/min/user)

---

## Conclusion

The migration from Personal Access Token to GitHub App authentication provides:

1. **Better UX**: No manual token creation, automatic refresh
2. **Better Security**: Short-lived tokens, installation-scoped permissions
3. **Better Maintainability**: Backend handles complexity, client is simpler
4. **Better Control**: Fine-grained permissions, easy revocation

This is a breaking change that requires user action, but the benefits justify the migration.

**Next Steps**:
1. Complete Phase 3 (US1) implementation
2. Test end-to-end authentication flow
3. Implement migration prompt
4. Update all documentation
5. Release with clear migration instructions
