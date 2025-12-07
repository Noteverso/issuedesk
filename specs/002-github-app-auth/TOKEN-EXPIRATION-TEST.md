# Token Expiration Testing Guide

**Feature**: 002-github-app-auth  
**Task**: T040 - Test token expiration enforcement (FR-013, FR-015, FR-016)  
**Purpose**: Verify that 1-hour token expiration is correctly enforced

## Test Scenarios

### Scenario 1: Token Expiration Detection

**Objective**: Verify system detects tokens expiring within 5 minutes

**Steps**:
1. Authenticate and obtain installation token
2. Check `expires_at` timestamp in session storage
3. Wait until token is within 5 minutes of expiration
4. Trigger any API call that checks token expiration
5. Verify refresh is triggered automatically

**Expected Result**:
- `isTokenExpired()` returns `true` when within 5-minute window
- System triggers automatic refresh before token becomes invalid
- User experiences no interruption

**Verification**:
```typescript
// Test in apps/desktop/src/main/storage/auth-store.ts
const session = getStoredSession();
if (session?.installationToken) {
  const isExpired = isTokenExpired(session.installationToken.expires_at);
  console.log('Token expired or expires soon:', isExpired);
}
```

### Scenario 2: Expired Token Rejection

**Objective**: Verify GitHub API rejects expired tokens

**Steps**:
1. Obtain installation token
2. Note expiration time (should be ~1 hour from now)
3. Wait for token to expire (or manually set `expires_at` to past time)
4. Attempt API call with expired token
5. Verify GitHub returns 401 Unauthorized
6. Verify app triggers re-authentication flow

**Expected Result**:
- GitHub API returns 401 error for expired token
- System detects failure and triggers refresh
- If refresh fails, user is prompted to re-authenticate

**Manual Test**:
```bash
# Get a token
curl -X POST http://localhost:8787/auth/installation-token \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: YOUR_SESSION_TOKEN" \
  -d '{"installation_id": 12345}'

# Wait 1 hour or modify expires_at in storage
# Then try to use the token with GitHub API
curl -H "Authorization: Bearer EXPIRED_TOKEN" \
  https://api.github.com/user
# Should return 401 Unauthorized
```

### Scenario 3: Token Lifetime Validation

**Objective**: Verify tokens expire in exactly 1 hour as per GitHub's spec

**Steps**:
1. Request installation token from backend
2. Record timestamp of token generation: `T0`
3. Record `expires_at` from response: `T1`
4. Calculate lifetime: `T1 - T0`
5. Verify lifetime is ~3600 seconds (1 hour)

**Expected Result**:
- Token lifetime = 3600 seconds ± 60 seconds (accounting for network/processing time)
- GitHub consistently enforces 1-hour expiration

**Automated Check**:
```typescript
// Add to token request tests
const startTime = Date.now();
const tokenResponse = await fetch('/auth/installation-token', ...);
const endTime = Date.now();

const expiresAt = new Date(tokenResponse.expires_at).getTime();
const lifetime = (expiresAt - startTime) / 1000; // seconds

assert(lifetime >= 3540 && lifetime <= 3660, 
  `Token lifetime should be ~3600s, got ${lifetime}s`);
```

### Scenario 4: Refresh Before Expiration

**Objective**: Verify system refreshes tokens before they expire

**Steps**:
1. Authenticate and obtain token
2. Monitor system behavior as token approaches expiration
3. Verify refresh triggered at 5-minute mark
4. Verify new token received before old one expires
5. Verify seamless transition (no API call failures)

**Expected Result**:
- Refresh triggered when `expires_at - now < 5 minutes`
- New token received before old token expires
- No 401 errors during transition
- User experiences no interruption

**Monitor Logs**:
```
[TokenMonitor] Checking token expiration...
[TokenMonitor] Token expires in 4 minutes - triggering refresh
[Auth] Refreshing installation token for installation 12345
[Auth] Token refreshed successfully
[TokenMonitor] New token expires at 2025-12-07T18:45:00Z
```

### Scenario 5: Multiple Concurrent Requests

**Objective**: Verify token refresh works correctly with concurrent API calls

**Steps**:
1. Authenticate and obtain token
2. Wait until token expires in 4 minutes
3. Trigger multiple API calls simultaneously (5+ concurrent requests)
4. Verify only ONE refresh request is sent to backend
5. Verify all API calls wait for refresh to complete
6. Verify all API calls succeed with new token

**Expected Result**:
- Request deduplication prevents multiple refresh calls
- All concurrent requests queue behind single refresh
- All requests succeed after refresh completes

**Test Code**:
```typescript
// Simulate concurrent requests
const promises = [
  githubApi.getIssues(),
  githubApi.getLabels(),
  githubApi.getComments(),
  githubApi.getUser(),
  githubApi.getRepositories(),
];

const results = await Promise.all(promises);
// All should succeed without individual refresh attempts
```

## Test Checklist

- [ ] Scenario 1: Token expiration detection (5-minute window)
- [ ] Scenario 2: Expired token rejection by GitHub API
- [ ] Scenario 3: Token lifetime validation (1 hour)
- [ ] Scenario 4: Automatic refresh before expiration
- [ ] Scenario 5: Concurrent request handling

## Manual Testing Steps

### Setup

1. Start backend worker:
   ```bash
   cd workers/auth
   pnpm run dev
   ```

2. Start desktop app:
   ```bash
   cd apps/desktop
   pnpm run dev
   ```

3. Open DevTools console to monitor logs

### Test Execution

1. **Login and Obtain Token**
   - Click "Login with GitHub"
   - Complete device flow
   - Verify token received with `expires_at` ~1 hour in future

2. **Check Expiration Logic**
   - Open DevTools console
   - Check session storage: `localStorage.getItem('session')`
   - Note `installationToken.expires_at` value
   - Manually call `isTokenExpired()` with different timestamps

3. **Force Expiration (Optional)**
   - Modify `expires_at` in session storage to a past time
   - Trigger API call (e.g., fetch issues)
   - Verify 401 error and refresh flow

4. **Monitor Auto-Refresh**
   - Wait ~55 minutes after login (or modify `expires_at` to 4 minutes in future)
   - Trigger any API call
   - Watch console logs for refresh activity

## Automated Testing (Future)

Create integration tests in `tests/e2e/token-expiration.spec.ts`:

```typescript
describe('Token Expiration', () => {
  it('should detect tokens expiring within 5 minutes', () => {
    // Test isTokenExpired function
  });

  it('should automatically refresh before expiration', () => {
    // Mock time, trigger API call, verify refresh
  });

  it('should handle expired token rejection', () => {
    // Mock expired token, verify 401 handling
  });
});
```

## Success Criteria

✅ All scenarios pass
✅ Tokens expire in exactly 1 hour (±1 minute)
✅ Automatic refresh triggered 5 minutes before expiration
✅ No API call failures during token transitions
✅ Expired tokens correctly rejected by GitHub API
✅ User never sees authentication errors during normal usage

## Notes

- GitHub's installation tokens have a fixed 1-hour lifetime
- Cannot be extended or customized
- Refresh requires re-exchanging installation_id for new token
- Rate limiting (5 req/min/user) applies to refresh requests

## References

- GitHub API: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token
- FR-013: System MUST obtain temporary access tokens that expire in 1 hour
- FR-015: System MUST check token expiration before making API requests
- FR-016: System MUST automatically request new tokens when current token is about to expire
