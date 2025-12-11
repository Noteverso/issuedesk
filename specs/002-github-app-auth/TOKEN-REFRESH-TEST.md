# Token Refresh Testing Guide

**Feature**: 002-github-app-auth  
**Tasks**: T061-T070e (Phase 7 - Automatic Token Refresh)  
**Created**: 2025-12-08

## Overview

This guide covers how to test the automatic token refresh functionality implemented in Phase 7.

## Architecture

- **Token Monitor**: Checks token expiration every 5 minutes (30 seconds in dev mode)
- **Refresh Threshold**: Refreshes when token expires within 5 minutes (50 minutes in dev mode)
- **Backend Endpoint**: `POST /auth/refresh-installation-token`
- **Events**: `auth:token-refreshed` (success), `auth:session-expired` (failure)


## Test Methods

### Method 1: Manual IPC Call (Immediate Test)

**Best for**: Quick verification that refresh endpoint works

```javascript
// In Electron DevTools Console (Cmd+Option+I)
const session = await window.electronAPI.auth.getSession();
const installationId = session.session.currentInstallation.id;

// Trigger manual refresh
const result = await window.electronAPI.auth.refreshInstallationToken({
  installationId
});

console.log('Refresh result:', result);

// Check updated session
const newSession = await window.electronAPI.auth.getSession();
console.log('New token expires at:', newSession.session.installationToken.expires_at);
```

**Expected Results**:
- ✅ `result.success === true`
- ✅ `result.token` contains new token
- ✅ `result.expires_at` is ~1 hour in future
- ✅ Console shows `[Auth] Installation token refreshed successfully`
- ✅ `auth:token-refreshed` event emitted

---

### Method 2: Development Mode Auto-Refresh (Realistic Test)

**Best for**: Testing automatic monitoring behavior

**Setup**:
1. Token monitor checks every **30 seconds** in development
2. Refreshes when token expires within **50 minutes** (catches most tokens)
3. GitHub tokens expire in **1 hour**

**Steps**:

1. **Start the app in dev mode**:
   ```bash
   cd /Users/byodian/personal/noteverso/issuedesk
   pnpm run dev:desktop
   ```

2. **Login and watch console**:
   - Complete authentication flow
   - Open DevTools (Cmd+Option+I)
   - Watch for token monitor logs

3. **Observe automatic refresh** (within ~30 seconds):
   ```
   [TokenMonitor] Token expires soon, refreshing...
   [TokenMonitor] Token refreshed successfully
   [TokenMonitor] Token updated in session storage
   [Auth] Installation token refreshed successfully
   ```

4. **Listen for events** (in DevTools console):
   ```javascript
   window.electronAPI.on('auth:token-refreshed', () => {
     console.log('✅ Token refreshed event received!');
   });
   
   window.electronAPI.on('auth:session-expired', (event) => {
     console.error('❌ Session expired:', event.reason);
   });
   ```

**Expected Results**:
- ✅ Token automatically refreshes within 30-60 seconds of login
- ✅ No user intervention required
- ✅ `auth:token-refreshed` event fires
- ✅ Session storage updated with new token
- ✅ No `auth:session-expired` events

---

### Method 3: Manual Trigger (Dev Helper)

**Best for**: Instant testing without waiting

**Steps**:

1. **Open DevTools console**:
   ```javascript
   // Trigger immediate token check
   await window.devAPI.checkTokenNow();
   ```

2. **Watch console output**:
   ```
   [Dev] Manual token check triggered
   [TokenMonitor] Manual token check triggered
   [TokenMonitor] Token expires soon, refreshing...
   [TokenMonitor] Token refreshed successfully
   ```

**Expected Results**:
- ✅ Token check executes immediately
- ✅ Refresh triggers if within threshold
- ✅ Session updated in electron-store

---

### Method 4: Backend Direct Test (API Validation)

**Best for**: Verifying backend endpoint works independently

**Prerequisites**:
- Auth worker running: `cd workers/auth && pnpm run dev`
- Valid session token from login

**Steps**:

```bash
# Get session token from electron-store
# File: ~/Library/Application Support/issuedesk/config.json

# Test refresh endpoint
curl -X POST http://localhost:8787/auth/refresh-installation-token \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN" \
  -d '{"installation_id": YOUR_INSTALLATION_ID}'
```

**Expected Response**:
```json
{
  "token": "ghs_new_token...",
  "expires_at": "2025-12-08T23:00:00Z"
}
```

**Backend Logs**:
```
[Refresh] Starting refresh for user: <userId>, installation: <installationId>
[Refresh] Successfully refreshed token
[Refresh] Updated session lastRefreshAt and TTL
```

---

### Method 5: Token Expiration Simulation (Advanced)

**Best for**: Testing edge cases and failure scenarios

**Setup - Modify threshold for immediate trigger**:

```typescript
// apps/desktop/src/main/services/token-monitor.ts
const REFRESH_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour (catches all tokens immediately)
```

**Steps**:

1. **Restart app with modified threshold**
2. **Login and wait** (automatic refresh within 30 seconds)
3. **Observe refresh behavior**

**Test expired session**:

1. **Stop backend worker**:
   ```bash
   # Kill wrangler dev process
   ```

2. **Trigger manual check**:
   ```javascript
   await window.devAPI.checkTokenNow();
   ```

3. **Expected behavior**:
   ```
   [TokenMonitor] Token refresh failed, session may be expired
   [Auth] Session expired event emitted
   ```

4. **Expected UI**: Redirect to login page with "Session expired" message

---

## Verification Checklist

### ✅ Happy Path
- [ ] Token automatically refreshes when <5 min to expiry
- [ ] New token saved to electron-store
- [ ] `auth:token-refreshed` event emitted
- [ ] No user interruption or notification
- [ ] GitHub API calls continue working with new token

### ✅ Edge Cases
- [ ] Multiple installations: Refreshes correct installation
- [ ] Rapid refresh attempts: Deduplication prevents duplicate calls (T070a/b)
- [ ] Backend offline: Shows offline indicator, doesn't spam refresh (T070c/d)
- [ ] Session expired (401): Emits `auth:session-expired`, redirects to login
- [ ] Network error: Retries with exponential backoff

### ✅ Performance
- [ ] Token check completes in <100ms
- [ ] Refresh completes in <500ms
- [ ] No memory leaks from interval timer
- [ ] Monitor stops cleanly on app quit

### ✅ Security
- [ ] Session token never logged in production
- [ ] Refresh request uses HTTPS in production
- [ ] New token encrypted in electron-store
- [ ] Backend validates session token ownership

---

## Configuration Reference

### Development Mode
```typescript
CHECK_INTERVAL_MS = 30 * 1000        // 30 seconds
REFRESH_THRESHOLD_MS = 50 * 60 * 1000 // 50 minutes
```

### Production Mode
```typescript
CHECK_INTERVAL_MS = 5 * 60 * 1000     // 5 minutes
REFRESH_THRESHOLD_MS = 5 * 60 * 1000  // 5 minutes
```

### Backend
```typescript
SESSION_TTL = 30 * 24 * 60 * 60       // 30 days (sliding window)
TOKEN_EXPIRY = 60 * 60                 // 1 hour (GitHub limit)
```

---

## Troubleshooting

### Token not refreshing automatically

**Check**:
1. Token monitor started: Look for `[TokenMonitor] Starting token expiration monitor`
2. Token expires soon: Check `installationToken.expires_at` timestamp
3. Threshold met: Verify `expiresAt - now < REFRESH_THRESHOLD_MS`

**Debug**:
```javascript
// Check monitor status
console.log('[Debug] Token monitor running');

// Check current token
const session = await window.electronAPI.auth.getSession();
const expiresAt = new Date(session.session.installationToken.expires_at);
const now = new Date();
const minutesUntilExpiry = (expiresAt - now) / 1000 / 60;
console.log('Minutes until token expiry:', minutesUntilExpiry);
```

### Refresh fails with 401

**Cause**: Session expired on backend (>30 days since last refresh)

**Solution**: User must re-authenticate
- App emits `auth:session-expired` event
- AuthContext redirects to login
- User completes device flow again

### Backend unreachable

**Cause**: Worker not running or network offline

**Solution**: 
- Connectivity monitor detects offline mode
- Shows "Limited connectivity" banner
- Read operations continue with cached tokens
- Write operations blocked with friendly message

---

## Implementation Files

### Desktop App
- **Monitor**: `apps/desktop/src/main/services/token-monitor.ts`
- **IPC Handler**: `apps/desktop/src/main/ipc/auth.ts` (auth:refresh-installation-token)
- **Storage**: `apps/desktop/src/main/storage/auth-store.ts`
- **Connectivity**: `apps/desktop/src/main/services/connectivity.ts`

### Backend
- **Refresh Handler**: `workers/auth/src/handlers/tokens.ts`
- **Session Storage**: `workers/auth/src/storage/sessions.ts`
- **Deduplication**: `workers/auth/src/utils/dedup.ts`

### UI Components
- **Offline Indicator**: `apps/desktop/src/renderer/components/common/OfflineIndicator.tsx`

---

## Related Documentation

- **Token Expiration Test**: `TOKEN-EXPIRATION-TEST.md`
- **Implementation Lessons**: `IMPLEMENTATION-LESSONS.md`
- **Clarifications**: `CLARIFICATIONS.md` (Session TTL, offline mode)
- **Tasks**: `tasks.md` (T061-T070e)

---

## Success Criteria

From spec.md (SC-003):
> ✅ **Token Lifecycle**: Installation tokens automatically refresh within 5 minutes of expiry without user intervention (>99% success rate)

**How to verify**:
1. Run app for 1 hour
2. Observe automatic refresh after ~55 minutes
3. Verify GitHub API calls continue working
4. Confirm no user notification or interruption
