# Research: GitHub App Authorization

**Feature**: 002-github-app-auth  
**Date**: 2025-11-06  
**Status**: Complete

## Overview

This document consolidates research findings for implementing GitHub App authentication with Cloudflare Worker backend, resolving all technical unknowns from the planning phase.

---

## 1. GitHub App Device Flow Pattern

### Decision
Use GitHub's OAuth Device Flow for desktop application authentication.

### Rationale
- **No redirect URLs needed**: Perfect for desktop apps where custom URL schemes are unreliable
- **User-friendly**: Users visit GitHub.com in their browser (familiar, trusted environment)
- **Cross-platform**: Works identically on macOS, Windows, Linux without OS-specific auth handlers
- **Secure**: No embedded browsers required; leverages GitHub's own OAuth implementation

### Alternatives Considered
1. **OAuth Web Flow with custom URL scheme**: Rejected - macOS/Windows URL scheme registration is fragile; browser security warnings confuse users
2. **Personal Access Tokens**: Rejected - Security risk (long-lived, stored on client); doesn't support installation-scoped permissions
3. **GitHub App Installation Tokens only**: Rejected - No user attribution; can't identify who authorized the app

### Implementation Pattern
```
1. Client requests device code from backend
2. Backend calls GitHub device flow API, returns user_code to client
3. Client displays code + opens github.com/login/device
4. Client polls backend every 5 seconds
5. Backend polls GitHub /oauth/access_token
6. On success, backend stores user token in KV, returns session token to client
```

### References
- [GitHub OAuth Device Flow Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow)
- [RFC 8628: OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)

---

## 2. Cloudflare Worker for Backend

### Decision
Implement authentication backend as a Cloudflare Worker with KV storage.

### Rationale
- **Serverless**: No server management; auto-scaling; global edge deployment
- **Cost-effective**: Free tier supports 100k requests/day; KV storage is cheap
- **Performance**: Edge computing = low latency worldwide (<50ms worker execution)
- **Security**: Private keys stored in Worker secrets (encrypted at rest, never exposed)
- **Simple deployment**: `wrangler deploy` - no Docker, no Kubernetes, no VMs

### Alternatives Considered
1. **Traditional Node.js server (Express + PostgreSQL)**: Rejected - Requires infrastructure management, higher cost, single-region latency
2. **AWS Lambda + DynamoDB**: Rejected - More complex setup, vendor lock-in equivalent, higher cold start times
3. **Supabase Edge Functions**: Rejected - Less mature than Workers, smaller ecosystem

### Architecture Patterns
- **Stateless handlers**: Each request is independent; no in-memory state
- **KV for session storage**: User sessions stored with 30-day TTL
- **Rate limiting**: Use Cloudflare KV + timestamp tracking per user
- **Error handling**: Return standard HTTP codes (401, 429, 500) with JSON error bodies

### Best Practices
- Use Web Crypto API (built-in) for JWT signing - no external crypto libraries
- Implement proper CORS headers for security
- Log security events to Cloudflare Analytics
- Use environment variables (wrangler secrets) for GitHub App credentials

### References
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [Cloudflare Workers Rate Limiting Pattern](https://developers.cloudflare.com/workers/examples/rate-limiting/)

---

## 3. GitHub App JWT Generation

### Decision
Generate GitHub App JWTs using Web Crypto API on Cloudflare Worker backend.

### Rationale
- **Security**: Private key never leaves backend; JWT generation happens server-side only
- **Built-in API**: Web Crypto API is native to Workers runtime (zero dependencies)
- **Standard compliance**: RS256 algorithm matches GitHub's requirements
- **Performance**: Native crypto operations are fast (<10ms for signing)

### Alternatives Considered
1. **@octokit/auth-app on client**: Rejected - Would expose private key to client (critical security flaw)
2. **jsonwebtoken library**: Rejected - Adds dependency; Web Crypto API is sufficient
3. **Pre-generated JWTs**: Rejected - JWTs expire after 10 minutes; need dynamic generation

### Implementation Pattern
```typescript
// Import private key from PEM format
const privateKey = await crypto.subtle.importKey(
  'pkcs8',
  pemToArrayBuffer(GITHUB_APP_PRIVATE_KEY),
  { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  false,
  ['sign']
);

// Sign JWT payload
const header = { alg: 'RS256', typ: 'JWT' };
const payload = { iat: now - 60, exp: now + 600, iss: GITHUB_APP_ID };
const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, message);
```

### Best Practices
- Cache private key import (expensive operation) - parse once on Worker startup
- Set JWT expiry to 10 minutes (GitHub maximum)
- Include 60-second clock skew tolerance (`iat: now - 60`)
- Validate GitHub App ID format before signing

### References
- [GitHub Apps Authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app)
- [Web Crypto API - SubtleCrypto.sign()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign)

---

## 4. Installation Token Exchange

### Decision
Exchange installation IDs for 1-hour access tokens using GitHub App Installation API.

### Rationale
- **Short-lived tokens**: 1-hour expiry minimizes security risk if token is compromised
- **Installation-scoped**: Tokens only access repositories where app is installed
- **Fine-grained permissions**: Respects GitHub App permission model
- **Automatic refresh**: Backend can re-issue tokens transparently

### Alternatives Considered
1. **User-to-server tokens**: Rejected - Still GitHub App flow; installation tokens are preferred
2. **Personal Access Tokens**: Rejected - Long-lived, not scoped to installations
3. **OAuth tokens**: Rejected - Different permission model; doesn't support GitHub App features

### Token Lifecycle
```
1. User selects installation (e.g., "myorg")
2. Client sends installation_id + user_session_token to backend
3. Backend validates session, generates GitHub App JWT
4. Backend calls POST /app/installations/{id}/access_tokens with JWT
5. GitHub returns installation token (expires in 1 hour)
6. Backend returns token + expiry to client
7. Client stores encrypted token in electron-store
8. After 55 minutes, client requests refresh (backend repeats steps 3-6)
```

### Best Practices
- Check token expiry before every API call (if <5 min remaining, refresh)
- Handle 401 errors gracefully (prompt re-authentication if refresh fails)
- Store expiry timestamp alongside token (ISO 8601 format)
- Implement token refresh queue (deduplicate concurrent refresh requests)

### References
- [GitHub App Installation Tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app)
- [Token Expiration Docs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)

---

## 5. Electron Secure Token Storage

### Decision
Use `electron-store` with encryption enabled for client-side token storage.

### Rationale
- **Platform-native encryption**: Uses macOS Keychain, Windows Credential Manager, Linux Secret Service
- **Simple API**: JSON-based storage with TypeScript support
- **Automatic encryption**: Set `encryptionKey` option - all data encrypted at rest
- **Electron-optimized**: Designed specifically for Electron apps; handles IPC safely

### Alternatives Considered
1. **Raw safeStorage API**: Rejected - Lower-level; requires manual JSON serialization and file management
2. **keytar**: Rejected - More complex API; doesn't handle JSON storage; extra dependency
3. **LocalStorage**: Rejected - No encryption; accessible from renderer (security risk)

### Security Implementation
```typescript
import Store from 'electron-store';

const store = new Store({
  name: 'auth',
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key', // TODO: Generate per-installation
  schema: {
    userToken: { type: 'string' },
    user: { type: 'object' },
    installationToken: { type: 'object' }
  }
});

// Store token (automatically encrypted)
store.set('installationToken', { token: 'ghs_...', expiresAt: '2025-11-06T12:00:00Z' });

// Retrieve token (automatically decrypted)
const tokenData = store.get('installationToken');
```

### Best Practices
- Generate unique encryption key per app installation (not hardcoded)
- Clear sensitive data on logout: `store.clear()`
- Validate schema with TypeScript types
- Never log decrypted tokens (debug mode accidentally exposes secrets)

### References
- [electron-store Documentation](https://github.com/sindresorhus/electron-store)
- [Electron safeStorage API](https://www.electronjs.org/docs/latest/api/safe-storage)

---

## 6. Rate Limiting Strategy

### Decision
Implement per-user rate limiting (5 requests/minute) using Cloudflare KV with sliding window.

### Rationale
- **Fair resource allocation**: Each user gets independent quota
- **Abuse prevention**: Prevents single user from overwhelming backend
- **Cloudflare-native**: KV is designed for high-frequency reads/writes
- **Stateless**: No in-memory counters; works across distributed workers

### Alternatives Considered
1. **Global rate limit**: Rejected - One abusive user affects everyone
2. **IP-based limiting**: Rejected - Users behind NAT share IPs; VPNs bypass it
3. **Cloudflare Rate Limiting product**: Rejected - Costs money; KV-based solution is free tier compatible

### Implementation Pattern
```typescript
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const window = 60000; // 1 minute
  
  // Get request timestamps from KV
  const data = await KV.get(key, 'json') || { timestamps: [] };
  
  // Filter timestamps within current window
  const recentRequests = data.timestamps.filter(t => now - t < window);
  
  if (recentRequests.length >= 5) {
    return false; // Rate limit exceeded
  }
  
  // Add current request timestamp
  recentRequests.push(now);
  await KV.put(key, JSON.stringify({ timestamps: recentRequests }), { expirationTtl: 120 });
  
  return true;
}
```

### Best Practices
- Return HTTP 429 with `Retry-After` header when limit exceeded
- Log rate limit violations for abuse monitoring
- Provide clear error message to user
- Consider exempting initial auth flow (only limit refresh endpoints)

### References
- [Cloudflare Workers Rate Limiting Example](https://developers.cloudflare.com/workers/examples/rate-limiting/)
- [RFC 6585: HTTP Status Code 429](https://datatracker.ietf.org/doc/html/rfc6585#section-4)

---

## 7. Session Persistence (30-Day TTL)

### Decision
Store user sessions in Cloudflare KV with 30-day automatic expiration.

### Rationale
- **User convenience**: Users stay logged in for a month (industry standard)
- **Security balance**: Not too long (90 days = excessive risk), not too short (7 days = annoying)
- **Automatic cleanup**: KV TTL expires old sessions without manual garbage collection
- **Cost-effective**: KV storage is cheap (~$0.50/GB/month; sessions are ~1KB each)

### Session Data Structure
```typescript
interface BackendSession {
  userId: number;
  userLogin: string;
  accessToken: string; // User's OAuth token (not installation token)
  installations: Array<{ id: number; accountLogin: string }>;
  createdAt: number;
  lastAccessedAt: number;
}

// Store in KV
await KV.put(
  `session:${sessionToken}`,
  JSON.stringify(sessionData),
  { expirationTtl: 30 * 24 * 60 * 60 } // 30 days in seconds
);
```

### Best Practices
- Generate cryptographically random session tokens (64 bytes = 128 hex chars)
- Update `lastAccessedAt` on every request (passive session activity tracking)
- Provide explicit logout endpoint that deletes session from KV
- Consider sliding expiration (reset TTL on each access) for active users

### References
- [Cloudflare KV Expiring Keys](https://developers.cloudflare.com/kv/reference/kv-commands/#expiring-keys)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## 8. Retry Logic with Exponential Backoff

### Decision
Implement 3 retries with exponential backoff (1s, 2s, 4s) for backend communication failures.

### Rationale
- **Transient failure recovery**: Network glitches, worker restarts, GitHub API rate limits resolve within seconds
- **Exponential backoff**: Gives services time to recover without overwhelming them
- **Limited attempts**: 3 retries = ~7 seconds total; beyond that, likely persistent issue
- **User experience**: 7 seconds is tolerable wait; users see "retrying..." feedback

### Implementation Pattern
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry exhausted'); // TypeScript exhaustiveness
}

// Usage
const token = await retryWithBackoff(() => 
  fetch(`${BACKEND_URL}/auth/installation-token`, { ... })
);
```

### Best Practices
- Only retry on transient errors (network, 5xx, timeouts) - not 4xx client errors
- Show retry attempt number to user ("Retrying... (2/3)")
- Log all retry attempts for debugging
- Add jitter to prevent thundering herd (random ±20% of delay)

### References
- [Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Google Cloud Retry Strategy](https://cloud.google.com/iot/docs/how-tos/exponential-backoff)

---

## 9. IPC Security Pattern (Electron)

### Decision
Use Electron's contextBridge with type-safe preload scripts for all auth IPC communication.

### Rationale
- **Security**: Renderer never has direct Node.js access; all IPC goes through controlled bridge
- **Type safety**: TypeScript definitions ensure compile-time correctness
- **Auditable**: All exposed APIs are explicit in preload.ts
- **Constitutional compliance**: Matches Electron Native Patterns principle

### Implementation Pattern
```typescript
// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => {
      const validChannels = [
        'auth:github-login',
        'auth:get-session',
        'auth:select-installation',
        'auth:refresh-installation-token',
        'auth:logout'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    },
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      const validChannels = ['auth:user-code'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_, ...args) => callback(...args));
        return () => ipcRenderer.removeListener(channel, callback);
      }
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
  }
});

// TypeScript types
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
      };
    };
  }
}
```

### Best Practices
- Whitelist allowed IPC channels (reject unknown channels)
- Never pass functions or objects with methods through IPC (use plain data only)
- Validate all IPC inputs with Zod schemas in main process
- Return structured errors (never throw across IPC boundary)

### References
- [Electron Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)

---

## 10. Error Handling Patterns

### Decision
Use structured error responses with actionable user messages and retry guidance.

### Rationale
- **User clarity**: Error messages explain what happened and what to do next
- **Developer debugging**: Errors include error codes and context for logging
- **Recovery guidance**: UI shows retry buttons, re-auth links, or support contact
- **Consistent format**: All errors follow same JSON structure

### Error Response Format
```typescript
interface ErrorResponse {
  error: string;           // Machine-readable code (e.g., "rate_limit_exceeded")
  message: string;         // Human-readable message
  retryAfter?: number;     // Seconds until retry allowed (for 429)
  action?: 'retry' | 'reauth' | 'contact_support';
}

// Backend example
return new Response(JSON.stringify({
  error: 'rate_limit_exceeded',
  message: 'Too many requests. Please wait 30 seconds before trying again.',
  retryAfter: 30,
  action: 'retry'
}), {
  status: 429,
  headers: { 'Content-Type': 'application/json', 'Retry-After': '30' }
});

// Client example
if (error.action === 'reauth') {
  // Clear stored tokens and redirect to login
  await window.electron.ipcRenderer.invoke('auth:logout');
  navigate('/login');
}
```

### Error Categories
1. **Network errors**: Show offline indicator, enable retry
2. **Authentication errors**: Clear session, redirect to login
3. **Rate limit errors**: Show countdown timer, disable retry until timer expires
4. **GitHub API errors**: Parse GitHub error message, show to user
5. **Validation errors**: Highlight form fields, show inline messages

### Best Practices
- Never show raw error stack traces to users (log them server-side)
- Provide error codes for easy support lookup
- Include request ID in error response for debugging
- Test all error paths in integration tests

### References
- [RFC 7807: Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807)
- [Google API Error Model](https://cloud.google.com/apis/design/errors)

---

## Summary

All technical unknowns resolved. Key decisions:
1. ✅ GitHub Device Flow for desktop auth
2. ✅ Cloudflare Worker + KV for backend
3. ✅ Web Crypto API for JWT signing
4. ✅ electron-store for encrypted token storage
5. ✅ Per-user rate limiting (5/min)
6. ✅ 30-day session TTL
7. ✅ 3 retries with exponential backoff
8. ✅ Type-safe IPC with contextBridge
9. ✅ Structured error handling

**Readiness**: Proceed to Phase 1 (Design & Contracts).
