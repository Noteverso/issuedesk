# Specification Clarifications - GitHub App Authorization

**Feature**: 002-github-app-auth  
**Date**: 2025-11-20  
**Status**: Completed - 5 clarifications resolved

## Overview

This document captures all specification clarifications made during the review process, including the ambiguities discovered, options considered, reasoning for decisions, and the resulting specification updates.

---

## Clarification 1: Backend Session Expiration Strategy

### Ambiguity Discovered

**Location**: FR-025 (Functional Requirements - Session Persistence)  
**Category**: Data & State  
**Impact**: High - Affects backend architecture and user re-authentication UX

**Original Language**:
> "System MUST implement a backend session token separate from GitHub access tokens for user session management with 30-day expiration"

**Problem**: The specification didn't clarify what happens when the 30-day backend session expires but the user's GitHub App installation remains authorized. This left three possible interpretations:

1. **Full device flow re-auth** - User must go through complete device flow again (enter device code on GitHub)
2. **Quick re-auth flow** - User re-authorizes through a faster flow since app is still installed
3. **Sliding window renewal** - Session automatically extends on each use

### Options Considered

| Option | Pros | Cons | UX Impact |
|--------|------|------|-----------|
| **Fixed 30-day expiration** | Simple to implement; clear security boundary | All users re-auth every 30 days regardless of activity; poor UX for active users | High friction - active users interrupted every 30 days (2+ min re-auth) |
| **Quick re-auth flow** | Faster than full device flow | Requires designing separate auth flow not in spec; added complexity; GitHub doesn't provide standard "quick reauth" | Medium friction - requires new feature implementation |
| **Sliding window expiration** | Best UX - active users never re-auth; inactive users (30+ days) still secured | Slightly more complex backend logic (update TTL on refresh) | Minimal friction - seamless for regular users |

### Decision & Reasoning

**SELECTED: Sliding window expiration**

**Rationale**:
1. **Industry Standard**: AWS, Google Cloud, GitHub itself use sliding window expiration - users remain authenticated while active
2. **Security Balance**: Inactive accounts (30+ days no token refresh) still require re-authentication, maintaining security
3. **Better UX**: Active users (daily/weekly usage) never interrupted - matches desktop app expectations
4. **Simple Implementation**: Cloudflare KV supports TTL updates on write - minimal added complexity
5. **Cost Effective**: Fewer device flow operations = lower API calls to GitHub

**User Scenarios**:
- **Active developer** (uses app daily): Never sees re-auth prompt - session extends automatically
- **Occasional user** (uses app monthly): May need re-auth if >30 days between sessions
- **Dormant account** (forgot about app): Secured after 30 days inactivity

### Specification Updates

**FR-025** (Modified):
```markdown
System MUST implement a backend session token separate from GitHub access tokens 
for user session management with 30-day sliding window expiration that resets on 
each successful token refresh
```

**FR-025a** (Modified):
```markdown
Backend MUST automatically invalidate and purge user sessions after 30 days of 
complete inactivity (no token refreshes) requiring full re-authentication through 
device flow
```

### Implementation Notes

- Backend updates session TTL on every successful token refresh (FR-016)
- Cloudflare KV: `await kv.put(sessionKey, sessionData, { expirationTtl: 2592000 })` on each refresh
- Client doesn't need to know about sliding window - transparent behavior
- Metrics: Track session age distribution to validate approach

---

## Clarification 2: Installation Token Caching Strategy

### Ambiguity Discovered

**Location**: FR-009 & Installation Management section  
**Category**: Technical Implementation  
**Impact**: High - Affects token caching strategy and API call frequency

**Original Language**:
> "Backend MUST exchange installation IDs for temporary access tokens using GitHub App installation API"

**Problem**: When a user switches between installations (FR-021 allows this), the specification didn't clarify the caching strategy. This created uncertainty about:

1. Should we fetch a fresh token on every switch?
2. Should we cache tokens for multiple installations simultaneously?
3. Should we only cache the active installation's token?

### Options Considered

| Option | Pros | Cons | Performance | Complexity |
|--------|------|------|-------------|------------|
| **Always fetch fresh** | Simple implementation; always have valid token | Noticeable delay (500ms per switch); may hit rate limits (FR-011: 5 req/min); poor UX | Poor - 500ms delay per switch | Low |
| **Cache single active token** | Simple; lower memory usage | Still requires fetch on switch; users wait each time | Medium - delay on each switch | Low-Medium |
| **Cache multiple tokens** | Instant switching; best UX; respects token lifetime | Requires memory management; secure storage for multiple tokens | Excellent - instant switching | Medium |

### Decision & Reasoning

**SELECTED: Cache multiple installation tokens**

**Rationale**:
1. **Critical for Multi-Org Developers**: Common workflow is switching between personal/work repos frequently
2. **Rate Limit Protection**: FR-011 limits to 5 requests/min - frequent switching would hit this limit
3. **Performance**: 500ms delay on every switch is unacceptable for desktop app UX expectations
4. **Token Lifetime Alignment**: Tokens naturally expire in 1 hour - caching aligns with this lifecycle
5. **Memory Cost**: Minimal - typical user has 2-5 installations, each token ~100 bytes
6. **Security**: Already using encrypted secure storage (FR-014) - extending to multiple tokens is same risk profile

**Real-World Scenario**:
```
User has 3 installations: PersonalOrg, WorkOrg, ClientOrg
Without caching: PersonalOrg → WorkOrg (500ms wait) → ClientOrg (500ms wait) → PersonalOrg (500ms wait)
With caching: PersonalOrg → WorkOrg (instant) → ClientOrg (instant) → PersonalOrg (instant)
```

**Rate Limit Math**:
- Without cache: 5 switches = 5 API calls = rate limit hit in 1 minute
- With cache: 5 switches = 0 API calls (using cached tokens)

### Specification Updates

**FR-013a** (New):
```markdown
System MUST cache valid installation access tokens for all authorized installations 
to enable instant switching without repeated backend requests
```

**FR-013b** (New):
```markdown
System MUST evict cached installation tokens when they expire (1-hour lifetime) or 
when user logs out, requiring fresh tokens on next use
```

### Implementation Notes

- Cache structure: `Map<installationId, { token, expiresAt }>`
- Eviction strategy: Check expiration before use (lazy eviction) + cleanup on logout
- Storage: Encrypted using Electron's safeStorage (FR-014) - serialize cache to secure storage
- Max cache size: No hard limit needed (user has finite installations, GitHub API enforces max)
- Memory usage: ~100 bytes × 10 installations = ~1KB (negligible)

---

## Clarification 3: Backend Unreachable Behavior

### Ambiguity Discovered

**Location**: Edge Cases & FR-029  
**Category**: Error Handling  
**Impact**: Medium-High - Affects user experience during backend failures

**Original Language**:
> "What happens when the backend service is unreachable during token refresh? → Application should retry 3 times with exponential backoff (1s, 2s, 4s), show offline indicator during retries, and cache the last known good state to allow limited offline functionality if all retries fail"

**Problem**: The edge case mentions "limited offline functionality" but this conflicts with "Out of Scope" which states "Offline mode functionality - users must authenticate online first". The spec didn't clarify:

1. What specific actions should work offline?
2. Should GitHub API calls continue with expired tokens?
3. Should we block all operations until backend returns?
4. How long is "limited offline" valid?

### Options Considered

| Option | Pros | Cons | User Impact |
|--------|------|------|-------------|
| **Block all operations** | Simple; no ambiguity; enforces online-first | Terrible UX if backend temporarily down; users can't work | High negative - users blocked mid-workflow |
| **Allow all operations with cached token** | Best UX; users unaware of outage | May violate security expectations; users might create data then fail | Medium - confusion if writes fail later |
| **Read-only with cached token** | Good balance; protects data integrity; graceful degradation | More complex error handling; need to distinguish read/write | Low - clear limitations, users can still browse |

### Decision & Reasoning

**SELECTED: Read-only operations with cached token**

**Rationale**:
1. **Graceful Degradation**: Users can continue browsing issues, viewing data during temporary outages
2. **Data Integrity**: Write operations (create/update/delete) are protected - won't partially succeed
3. **Clear User Feedback**: "Limited connectivity" indicator sets expectations
4. **Token Grace Period**: GitHub tokens often work briefly past expiration - allows continued reads
5. **Backend SLA Reality**: Cloudflare Workers 99.9% uptime - outages are rare and brief (seconds/minutes)
6. **User Workflow Protection**: Mid-workflow users can continue reading context while backend recovers

**Boundary Cases**:
- Cached token still valid with GitHub → Reads work normally
- Cached token rejected by GitHub (401/403) → Show re-auth prompt
- Backend returns within retry period (7 seconds) → Seamless recovery
- Backend down >7 seconds → Limited mode with clear indicator

**Not Full Offline Mode**: This is NOT promising full offline functionality (which is out of scope). This is temporary degradation during backend outages, not offline-first architecture.

### Specification Updates

**FR-029b** (New):
```markdown
When backend is unreachable after all retry attempts, System MUST continue using 
the last valid access token for read-only GitHub API operations until token is 
rejected by GitHub API or backend becomes reachable
```

**FR-029c** (New):
```markdown
When backend is unreachable, System MUST display persistent "Limited connectivity" 
indicator and disable or queue write operations (create/update/delete) with user 
notification
```

**Out of Scope** (Modified):
```markdown
Offline mode functionality - users must authenticate online first; limited read-only 
functionality with cached tokens during temporary backend outages is supported
```

### Implementation Notes

- Detect backend unreachable: 3 retries with exponential backoff (FR-029)
- UI indicator: Yellow banner "Limited connectivity - read-only mode"
- Operation blocking: Disable/grey out create/edit/delete buttons
- Queue option: Optionally queue writes with "Save for later" action
- Auto-recovery: Test backend connectivity every 30 seconds, resume normal mode when available
- Read operations: Continue normally until GitHub API rejects token

---

## Clarification 4: Backend Storage Technology Choice

### Ambiguity Discovered

**Location**: Key Entities - Backend Session  
**Category**: Data & State  
**Impact**: Medium - Affects backend storage architecture choice

**Original Language**:
> "Backend Session: Server-side session record linking a user to their authorized installations, stored in Cloudflare KV or Durable Objects for persistence with 30-day TTL (time-to-live) expiration"

**Problem**: The spec mentions "Cloudflare KV **or** Durable Objects" but doesn't specify which to use or decision criteria. These have significantly different characteristics:

**Cloudflare KV**:
- Eventually consistent (writes take ~60 seconds to propagate globally)
- Optimized for read-heavy workloads
- Simpler programming model
- Lower cost ($0.50/million reads)

**Durable Objects**:
- Strongly consistent (immediate read-after-write)
- Supports stateful coordination and transactions
- More complex (requires class definitions, migrations)
- Higher cost (~$0.15 per million requests + compute time)

### Options Considered

| Option | Pros | Cons | When to Use |
|--------|------|------|-------------|
| **Cloudflare KV** | Simple; cheaper; read-optimized; eventual consistency OK for sessions | Can't guarantee immediate consistency; concurrent writes may conflict | MVP - read-heavy session lookups, rare writes |
| **Durable Objects** | Strong consistency; transactions; stateful coordination | More complex; higher cost; overkill for simple session storage | Future features - real-time collaboration, locks |
| **Keep flexible (OR)** | Allows future change | Implementation must choose anyway; ambiguity doesn't help | Never - decision paralysis |

### Decision & Reasoning

**SELECTED: Cloudflare KV for MVP**

**Rationale**:
1. **Read-Heavy Workload**: Session lookups on every token refresh - 99% reads, 1% writes (only on new sessions)
2. **Eventual Consistency Acceptable**: 
   - Sessions written once (on device flow complete)
   - Updated once per hour (token refresh TTL update)
   - 60-second propagation delay doesn't impact UX (user doesn't create multiple sessions simultaneously)
3. **Simpler MVP Implementation**: No class definitions, no migration complexity
4. **Cost Effective**: $0.50/million reads vs DO's higher compute costs
5. **Concurrent Refresh Handling**: Can be solved at application layer (request deduplication, idempotency keys)
6. **Scaling Path**: If strong consistency needed later, can migrate to DO (data structure stays same)

**Concurrent Token Refresh** (Edge case from FR-029):
- Problem: User opens app in 2 devices, both refresh at same time
- KV Solution: Use request deduplication with cache
  - Generate refresh request ID
  - Cache in-flight requests (in-memory)
  - Second request sees cached pending request, waits for result
- DO would handle this automatically, but adds complexity for rare edge case

**When to Migrate to Durable Objects**:
- Real-time collaboration features (multiple users editing same issue)
- Distributed locks (preventing concurrent issue edits)
- Stateful websocket connections (live updates)
- Transaction requirements (atomic multi-step operations)

None of these are in Phase 1-8 scope.

### Specification Updates

**Key Entities - Backend Session** (Modified):
```markdown
Backend Session: Server-side session record linking a user to their authorized 
installations, stored in Cloudflare KV for persistence with 30-day sliding window 
TTL; application-layer request deduplication handles concurrent token refresh scenarios
```

**Assumptions** (Modified):
```markdown
Cloudflare KV storage provides acceptable read/write latency for session persistence 
(typically <50ms global reads, <500ms writes)
```

**Dependencies** (Modified):
```markdown
Cloudflare KV namespace for storing user session data with appropriate read/write capacity
```

### Implementation Notes

- KV namespace binding in wrangler.toml: `[[kv_namespaces]] binding = "SESSIONS"`
- Session key format: `session:{userId}` (user ID from GitHub)
- Session value: JSON `{ userId, username, avatar, installations: [], createdAt, lastRefreshAt }`
- TTL management: Update on every token refresh (sliding window from Clarification 1)
- Request deduplication: In-memory Map with 5-second TTL for in-flight refresh requests
- Monitoring: Track KV read/write latency in Cloudflare Analytics

---

## Clarification 5: Device Flow Timeout User Experience

### Ambiguity Discovered

**Location**: User Story 1 - Initial Authentication & FR-004  
**Category**: User Experience  
**Impact**: Medium - Affects error messaging and UX flow

**Original Language**:
> "System MUST stop polling after authorization is complete or after a maximum timeout period of 15 minutes"

**Problem**: The spec doesn't clarify what happens to the user experience when the 15-minute timeout occurs. Specifically:

1. What error message should users see?
2. Can users retry with the same device code?
3. Should the app auto-generate a new code?
4. How does this integrate with "user closes app before polling completes" edge case?

### Options Considered

| Option | Pros | Cons | User Experience |
|--------|------|------|-----------------|
| **Allow retry with same code** | Preserves user's GitHub authorization flow | Code already expired per GitHub API; will fail; confusing error | Poor - user gets second error after retry |
| **Auto-generate new code silently** | Seamless; no user action needed | Confusing - code changes without explanation; may disrupt users who left tab open | Medium - users may be confused by code change |
| **Show error + "Try Again" → new code** | Clear feedback; user-initiated action; explains what happened | Requires one extra click | Best - clear expectations, user in control |

### Decision & Reasoning

**SELECTED: Show timeout error + "Try Again" button generates new device code**

**Rationale**:
1. **GitHub API Reality**: Device codes expire after 15 minutes (GitHub's policy) - old code is unusable
2. **Clear User Feedback**: Explicit message explains what happened and why
3. **User Control**: "Try Again" gives users control over when to start new flow
4. **Prevents Confusion**: Auto-generating silently would confuse users who have GitHub page open
5. **Handles Edge Cases**: Works for all scenarios (timeout, app closed, distracted user)
6. **Standard Pattern**: Matches common UX patterns (password reset timeout, checkout session expiration)

**User Scenarios**:
- **Distracted user**: Gets coffee, comes back to expired code → clear message explains timeout
- **Multi-step user**: Opens GitHub, gets interrupted, returns → knows to start over
- **App crash**: Closes app by accident, reopens → old polling stopped, fresh start available
- **Testing**: Developer testing flow → easy to retry without manual code cleanup

**Error Message Recommendation**:
```
⏱️ Authorization Timeout

Your device code has expired (15 minutes). 
This happens when GitHub authorization isn't completed in time.

[Try Again]  [Cancel]
```

### Specification Updates

**FR-004a** (New):
```markdown
When device flow polling times out after 15 minutes, System MUST display a clear 
timeout message explaining the device code has expired and provide a "Try Again" 
action that initiates a new device flow with a fresh device code
```

**FR-004b** (New):
```markdown
System MUST automatically discard expired device codes and ensure users cannot 
attempt authorization with codes older than 15 minutes
```

**User Story 1 - Acceptance Scenario 5** (New):
```markdown
Given a user receives a device code but does not complete authorization within 
15 minutes, When the polling timeout occurs, Then the user sees a clear 
"Authorization timeout" message with explanation and a "Try Again" button that 
generates a new device code
```

### Implementation Notes

- Track device code creation timestamp: `{ deviceCode, createdAt: Date.now() }`
- Check age before polling: `if (Date.now() - createdAt > 900000) { showTimeout() }`
- Clear state on timeout: Remove device code from memory, stop polling interval
- UI timeout screen: Modal or inline message with clear CTA
- "Try Again" action: Call `initiateDeviceFlow()` again, update UI with new code
- Backend cleanup: Device codes auto-expire on GitHub's side (no manual cleanup needed)
- Edge case: App closed during polling → on reopen, check if any stored device code exists and is <15min old

---

## Summary of Changes

### Specification Impact

| Requirement | Change Type | New Requirements Added |
|-------------|-------------|----------------------|
| FR-025/FR-025a | Modified | Sliding window session expiration |
| FR-013a/FR-013b | New | Multi-installation token caching |
| FR-029b/FR-029c | New | Read-only offline mode |
| FR-004a/FR-004b | New | Device flow timeout UX |
| Key Entities | Modified | Specified KV storage, request deduplication |
| Assumptions | Modified | Added KV latency expectations |
| Dependencies | Modified | Specified KV namespace requirements |
| Out of Scope | Modified | Clarified limited offline vs full offline |
| US1 Acceptance | Extended | Added timeout scenario |

**Total New Requirements**: 8  
**Total Modified Requirements**: 6  
**Total Clarifications**: 5

### Architecture Decisions Locked In

1. **Session Management**: Sliding window TTL (30 days, resets on activity)
2. **Token Strategy**: Cache all installation tokens for instant switching
3. **Failure Mode**: Read-only graceful degradation during backend outages
4. **Storage Backend**: Cloudflare KV (not Durable Objects)
5. **Timeout Handling**: User-initiated retry with fresh device codes

### Implementation Priorities

**Phase 3 (Immediate)**:
- Implement multi-token cache in desktop app (FR-013a/b)
- Add device flow timeout UI (FR-004a/b)
- Implement KV session storage with sliding window TTL (FR-025)

**Phase 4 (Security)**:
- Validate read-only mode when backend unreachable (FR-029b/c)
- Test concurrent token refresh with request deduplication

**Phase 5+ (Future)**:
- Monitor session age distribution (validate sliding window approach)
- Consider Durable Objects migration if real-time features added

### Remaining Low-Priority Ambiguities

These can be resolved during implementation:

1. **UI Details**: Exact text for "Limited connectivity" indicator
2. **Error Messages**: Specific wording for timeout error screen
3. **Cache Eviction**: Precise algorithm (LRU vs TTL-only vs hybrid)
4. **KV Key Format**: Exact naming convention (`session:{id}` vs `user_session:{id}`)
5. **Request Deduplication**: Specific algorithm (cache duration, cleanup timing)

---

## Lessons Learned

### Why These Clarifications Were Critical

1. **Session Expiration** (High Impact):
   - Difference between fixed and sliding window is 2+ minutes of user time every 30 days
   - For 1000 active users: 2000+ minutes (33+ hours) of saved user time per month
   - Wrong choice would create user complaints and support burden

2. **Token Caching** (High Impact):
   - Multi-org developers would hit rate limits without caching
   - 500ms delay × multiple switches per hour = significant UX degradation
   - Wrong choice would make app unusable for target audience

3. **Offline Behavior** (Medium Impact):
   - Blocking all operations during brief outages creates support tickets
   - Allowing writes risks data loss and user confusion
   - Wrong choice would result in either poor UX or data integrity issues

4. **Storage Choice** (Medium Impact):
   - Durable Objects would add 2-3 days of development time for MVP
   - KV cost: ~$5/month vs DO: ~$50/month for 10k users
   - Wrong choice would delay MVP or waste resources

5. **Timeout UX** (Low-Medium Impact):
   - Clear error messages reduce support burden
   - Auto-retry without explanation confuses users
   - Wrong choice would create confusion but not break functionality

### Clarification Process Effectiveness

**What Worked Well**:
- Structured ambiguity scan across categories
- Multiple options considered with pros/cons
- Real-world usage scenarios validated decisions
- Specification updates immediately applied

**What Could Be Improved**:
- Earlier clarification (before Phase 3 implementation started)
- More aggressive timeline (could do all 5 in one session)
- Quantitative metrics in decision rationale (more numbers)

### Recommendations for Future Features

1. **Run clarification before Phase 1** - Prevents implementation rework
2. **Focus on high-impact ambiguities first** - Session management, caching, storage
3. **Use decision matrices** - Structured comparison forces clear thinking
4. **Document "why not" options** - Future maintainers understand trade-offs
5. **Set clear boundaries** - "Out of scope" needs explicit examples

---

## Appendix: Decision Matrix Template

For future clarifications, use this template:

```markdown
### Clarification N: [Title]

**Ambiguity**: [What's unclear]
**Impact**: [High/Medium/Low] - [Why it matters]
**Original Language**: [Quote from spec]

**Options**:
| Option | Pros | Cons | [Custom Metric] |
|--------|------|------|-----------------|
| A      |      |      |                 |
| B      |      |      |                 |

**Decision**: [Selected option]
**Rationale**: [Numbered list of reasons]
**Spec Updates**: [Exact requirement changes]
**Implementation Notes**: [Technical details]
```

This ensures consistent, thorough decision-making and documentation.
