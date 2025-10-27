# Rate Limit Tracker Implementation

## Task: T031 - Implement rate limit tracker in packages/github-api/src/rate-limit.ts

### Files Created/Modified

1. **Created: `packages/github-api/src/rate-limit.ts`**
   - Complete rate limit tracking implementation
   - Parses GitHub API response headers
   - Tracks current rate limit state
   - Emits warnings when threshold is reached (default: 20%)

2. **Modified: `packages/github-api/src/index.ts`**
   - Exports `RateLimitTracker` and `createRateLimitTracker`

3. **Modified: `packages/github-api/src/github-client.ts`**
   - Integrated `RateLimitTracker` into `GitHubClient`
   - Automatically tracks rate limit from all API responses
   - Exposes methods: `getRateLimitState()`, `onRateLimitWarning()`, `canMakeRequest()`

4. **Created: `packages/github-api/src/rate-limit.example.ts`**
   - Usage examples and documentation

### Features Implemented

#### RateLimitTracker Class

**Core Functionality:**
- ✅ Parse rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Limit`, `X-RateLimit-Reset`)
- ✅ Track current rate limit state
- ✅ Calculate remaining percentage
- ✅ Check if requests can be made
- ✅ Calculate time until reset
- ✅ Emit warnings at configurable threshold (default: 20%)

**Methods:**
```typescript
- parseHeaders(headers): RateLimitState | null
- update(headers): RateLimitState | null
- getState(): RateLimitState | null
- canMakeRequest(): boolean
- getTimeUntilReset(): number
- getResetTime(): Date | null
- getRemainingPercentage(): number
- onWarning(callback): void
- reset(): void
- setWarningThreshold(threshold): void
```

#### GitHubClient Integration

**Added Methods:**
```typescript
- getRateLimitState(): RateLimitState | null
- onRateLimitWarning(callback): void
- canMakeRequest(): boolean
```

**Automatic Tracking:**
- Rate limit updated on every successful response
- Rate limit updated even on error responses
- Warning callback triggered when threshold reached

### Usage Examples

#### Standalone Usage
```typescript
import { createRateLimitTracker } from '@issuedesk/github-api';

const tracker = createRateLimitTracker(0.2); // Warn at 20%

tracker.onWarning((state) => {
  console.warn(`Rate limit warning: ${state.remaining}/${state.limit}`);
});

const state = tracker.update(responseHeaders);
```

#### With GitHubClient
```typescript
import { GitHubClient } from '@issuedesk/github-api';

const client = new GitHubClient(token);

client.onRateLimitWarning((state) => {
  // Handle warning - show notification, queue operations, etc.
  console.warn('Rate limit warning!', state);
});

// Make requests - rate limit automatically tracked
const response = await client.getCurrentUser();

// Check current state
const rateLimitState = client.getRateLimitState();
```

#### Check Before Request
```typescript
if (!client.canMakeRequest()) {
  const state = client.getRateLimitState();
  console.log('Rate limited until:', new Date(state.reset * 1000));
  // Queue operation or wait
} else {
  // Safe to proceed
  await client.someApiCall();
}
```

### GitHub Rate Limit Reference

**Limits (API v3):**
- Authenticated: 5,000 requests/hour
- Unauthenticated: 60 requests/hour

**Response Headers:**
- `X-RateLimit-Limit`: Maximum requests per hour
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `X-RateLimit-Used`: Requests used
- `X-RateLimit-Resource`: Resource type (core, search, graphql)

### Warning Threshold

Default: **20% remaining** (1,000 out of 5,000 for authenticated users)

Configurable via:
```typescript
const tracker = new RateLimitTracker(0.1); // Warn at 10%
// or
tracker.setWarningThreshold(0.15); // Change to 15%
```

### Testing

Build verification passed:
```bash
cd packages/github-api
npm run build
✓ TypeScript compilation successful
✓ All exports available
```

### Next Steps for Integration

1. **Main Process (Sync Engine):**
   - Import and use rate limit state in sync queue
   - Store state in electron-store for persistence
   - Emit IPC events for rate limit warnings

2. **Renderer Process:**
   - Display rate limit status in status bar
   - Show warnings/notifications when threshold reached
   - Disable/queue operations when rate limited

3. **Testing:**
   - Unit tests for RateLimitTracker methods
   - Integration tests with GitHubClient
   - E2E tests for warning notifications

### Compliance with Specification

✅ **Header Parsing**: Extracts all required headers from GitHub API responses  
✅ **Warning Threshold**: Configurable threshold with default at 20%  
✅ **State Tracking**: Maintains current rate limit state  
✅ **Time Calculations**: Provides time until reset  
✅ **Automatic Integration**: Seamlessly integrated into GitHubClient  
✅ **Type Safety**: Full TypeScript types from @issuedesk/shared  
✅ **Error Handling**: Gracefully handles missing/invalid headers

### Implementation Notes

- Headers are case-insensitive (handles both `X-RateLimit-*` and `x-ratelimit-*`)
- Handles both string and string array header values (different HTTP libraries)
- Validates all parsed integers (returns null on invalid data)
- Warning callback only fires when crossing threshold boundary
- No persistent storage (handled by main process settings manager)
- Thread-safe for single-threaded Node.js environment

---

**Task Status**: ✅ **COMPLETE**

All requirements from T031 specification met:
- ✅ Rate limit tracker implemented in `packages/github-api/src/rate-limit.ts`
- ✅ Header parsing from GitHub API responses
- ✅ Warning threshold detection and callback system
- ✅ Integrated into GitHubClient
- ✅ TypeScript compilation successful
- ✅ Exports available for consumption
