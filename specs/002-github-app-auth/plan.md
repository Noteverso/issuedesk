# Implementation Plan: GitHub App Authorization with Cloudflare Worker Backend

**Branch**: `002-github-app-auth` | **Date**: 2025-11-06 (Updated: 2025-11-20) | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-github-app-auth/spec.md`

**Note**: This plan reflects clarifications from 2025-11-20. See [CLARIFICATIONS.md](./CLARIFICATIONS.md) for detailed rationale.

## Summary

Implement secure GitHub App authentication using device flow, with all sensitive credentials (private keys, client secrets) stored exclusively in a Cloudflare Worker backend. The backend exchanges installation IDs for short-lived (1-hour) access tokens, which are safely stored in the Electron desktop client using platform-specific encrypted storage. The system supports multi-organization installations with **cached tokens for instant switching**, automatic token refresh with **read-only offline mode**, and **30-day sliding window session persistence** with 5 requests/minute rate limiting per user. Backend uses **Cloudflare KV** for session storage.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js ≥18.0.0 (Electron 33+), JavaScript ES2020+ (Cloudflare Workers)

**Primary Dependencies**: 
- Desktop: Electron 33+, React 18+, electron-store (encrypted storage), @octokit/auth-app (GitHub App JWT generation on backend only)
- Backend: Cloudflare Workers runtime, Web Crypto API (built-in)

**Storage**: 
- Client: electron-store with encryption for tokens and session data
- Backend: **Cloudflare KV** for user session persistence (30-day sliding window TTL)
- **Token Caching**: Multi-installation token cache on client for instant switching (FR-013a/b)

**Testing**: Vitest (desktop contracts), Miniflare (Cloudflare Worker local testing)

**Target Platform**: 
- Desktop: Electron (macOS, Windows, Linux)
- Backend: Cloudflare Workers (edge network, serverless)

**Project Type**: Web application (frontend: Electron renderer, backend: Cloudflare Worker)

**Performance Goals**: 
- Backend token exchange: <500ms (95th percentile)
- Device flow polling: 5-second intervals
- UI responsiveness: <100ms for auth state updates
- **Installation switching**: Instant (0ms) with cached tokens

**Constraints**: 
- Zero secrets in client code (verified via security audit)
- Backend rate limiting: 5 requests/minute/user
- Token refresh: 3 retries with exponential backoff (1s, 2s, 4s)
- **Session expiration**: 30-day sliding window (resets on token refresh - FR-025)
- **Offline mode**: Read-only operations with cached token during backend outage (FR-029b/c)
- **Device flow timeout**: 15-minute expiry with clear error message and fresh code retry (FR-004a/b)
- Cloudflare Worker execution time: <50ms per request (typical)
- **KV latency**: <50ms global reads, <500ms writes (assumption)

**Scale/Scope**: 
- Support 1000 concurrent authentication requests
- Handle multiple installations per user (cached tokens for all)
- Backend session storage: ~1KB per user session
- **Concurrent refresh**: Application-layer request deduplication

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Minimal Dependencies
- **electron-store**: Justified - Provides cross-platform encrypted storage with minimal API; reimplementing secure storage would require significant crypto expertise
- **@octokit/auth-app** (backend only): Justified - GitHub App JWT generation requires complex RSA signing; official SDK ensures compatibility
- **Status**: PASS - Both dependencies solve critical problems (encryption, GitHub App auth) that would be error-prone to implement

### ✅ Principle II: Local-First Architecture  
- **Authentication tokens stored locally**: Session persistence uses encrypted electron-store
- **Offline degradation**: Auth state cached; app can display last-known user info without network
- **Network as enhancement**: GitHub API calls happen after local token validation
- **NEW (2025-11-20)**: Read-only operations with cached token during backend outage (FR-029b/c)
- **Status**: PASS - Auth system maintains local state first, syncs with GitHub backend as needed

### ✅ Principle III: GitHub-Inspired UI
- **Device code modal**: Follows GitHub's device flow UI patterns (code display, copy button, waiting state)
- **Installation selection**: Matches GitHub's installation picker design (avatars, organization names, repository scopes)
- **Error messaging**: Uses GitHub-style toast notifications and error states
- **NEW (2025-11-20)**: Timeout error with "Try Again" button for expired device codes (FR-004a)
- **Status**: PASS - UI components mirror GitHub's authentication flows

### ✅ Principle IV: Electron Native Patterns
- **IPC communication**: All auth operations use contextBridge with type-safe preload (auth:github-login, auth:get-session, etc.)
- **Security**: nodeIntegration=false, contextIsolation=true; secrets never exposed to renderer
- **Process separation**: Token polling and backend requests run in main process (non-blocking)
- **Native storage**: Uses Electron's safeStorage API via electron-store
- **Status**: PASS - Follows all Electron security and architectural best practices

### ✅ Principle V: Workspace Architecture
- **Monorepo compliance**: Backend worker lives in `workers/auth/` (separate from desktop app)
- **Shared types**: Auth types defined in `@issuedesk/shared` (UserSession, Installation, AccessToken)
- **API abstraction**: `@issuedesk/github-api` could wrap authenticated requests (future enhancement)
- **No circular dependencies**: Worker → GitHub API, Desktop → Worker API (clean separation)
- **Status**: PASS - Clean workspace boundaries maintained

### 🔍 Quality Gates
- **Dependency justification**: ✅ All dependencies documented above
- **Security audit**: ⏳ Will verify zero secrets in client bundle post-implementation
- **Bundle size**: ✅ electron-store ~50KB, no impact on <100MB constraint
- **Performance**: ✅ Backend <500ms, UI <100ms targets align with standards
- **NEW (2025-11-20)**: ✅ Cloudflare KV latency expectations documented (<50ms reads, <500ms writes)

### Final Gate Status: **PASS** ✅
All constitutional principles satisfied. No violations requiring justification.

### Clarifications Applied (2025-11-20)

**Five major clarifications integrated** (see [CLARIFICATIONS.md](./CLARIFICATIONS.md) for full rationale):

1. **Session Expiration Strategy** (FR-025/FR-025a):
   - Changed from fixed 30-day to sliding window expiration
   - Session extends on each token refresh; active users never re-authenticate
   - Inactive users (30+ days no activity) require full device flow

2. **Installation Token Caching** (FR-013a/FR-013b):
   - Cache tokens for ALL authorized installations
   - Enables instant switching between organizations (0ms delay)
   - Protects against rate limits (5 req/min) with frequent switching

3. **Backend Unreachable Behavior** (FR-029b/FR-029c):
   - Read-only operations continue with cached token during backend outage
   - Write operations disabled/queued with "Limited connectivity" indicator
   - Graceful degradation without promising full offline mode

4. **Backend Storage Choice** (Key Entities, Assumptions):
   - Specified **Cloudflare KV** for MVP (not Durable Objects)
   - Read-heavy workload, eventual consistency acceptable
   - Application-layer request deduplication for concurrent refresh

5. **Device Flow Timeout UX** (FR-004a/FR-004b):
   - Clear timeout message after 15 minutes
   - "Try Again" button generates fresh device code
   - Auto-discard expired codes (can't retry with old code)

## Project Structure

### Documentation (this feature)

```text
specs/002-github-app-auth/
├── plan.md              # This file (updated 2025-11-20)
├── spec.md              # Feature specification (updated with clarifications)
├── research.md          # Phase 0 output (technology choices, patterns)
├── data-model.md        # Phase 1 output (entities, schemas) - needs update for token caching
├── quickstart.md        # Phase 1 output (dev setup, deployment)
├── CLARIFICATIONS.md    # NEW (2025-11-20): Detailed clarification rationale
├── contracts/           # Phase 1 output (IPC and API contracts) - needs update
│   ├── ipc.md          # Desktop IPC contracts (auth handlers)
│   └── backend-api.md  # Cloudflare Worker REST API
├── tasks.md             # Phase 2 output (needs update for new requirements)
└── checklists/
    └── requirements.md  # Specification validation checklist
```

### Source Code (repository root)

```text
# Backend: Cloudflare Worker
workers/auth/
├── src/
│   ├── index.ts              # Main worker entry point
│   ├── handlers/             # Request handlers
│   │   ├── device-flow.ts   # Device code generation & polling
│   │   ├── installations.ts # Installation listing
│   │   └── tokens.ts        # Token exchange & refresh
│   ├── auth/                # Authentication logic
│   │   ├── jwt.ts           # GitHub App JWT generation
│   │   └── github.ts        # GitHub API integration (User-Agent: IssueDesk/1.0.0)
│   ├── storage/             # KV storage abstraction
│   │   └── sessions.ts      # User session management (sliding window TTL)
│   └── utils/
│       ├── rate-limit.ts    # Rate limiting (5/min/user)
│       ├── retry.ts         # Retry logic with backoff
│       └── dedup.ts         # NEW: Request deduplication for concurrent refresh
├── tests/
│   └── integration/         # Miniflare integration tests
├── wrangler.toml            # Cloudflare Worker config (KV binding)
└── package.json

# Desktop: Electron App
apps/desktop/src/
├── main/ipc/
│   └── auth.ts              # Auth IPC handlers (updated for token caching)
├── main/services/
│   └── token-cache.ts       # NEW: Multi-installation token cache manager
├── renderer/
│   ├── pages/
│   │   └── Login.tsx        # Device flow login UI (updated for timeout UX)
│   ├── components/auth/
│   │   ├── DeviceCodeModal.tsx        # Device code display (with timeout handler)
│   │   ├── InstallationSwitcher.tsx   # Dropdown to switch installations (in header)
│   │   ├── InstallAppPrompt.tsx       # Guide users to install app (zero installations)
│   │   ├── AuthGuard.tsx              # Route protection
│   │   └── OfflineIndicator.tsx       # NEW: "Limited connectivity" banner
│   └── hooks/
│       └── useTokenRefresh.ts      # NEW: Auto-refresh hook with retry logic
└── preload.ts               # Auth IPC bridge

# Shared Types
packages/shared/src/
├── types/
│   ├── auth.ts              # Auth-related types (updated for token cache)
│   └── github.ts            # NEW: GitHub API response types
└── schemas/
    └── auth.schema.ts       # Zod schemas for auth (updated)
```

**Structure Decision**: Web application pattern with clear backend/frontend separation. Backend is a standalone Cloudflare Worker (not monorepo package) to maintain deployment independence. Desktop app extends existing Electron structure with auth-specific IPC handlers, pages, and components. **NEW (2025-11-20)**: Added token cache manager, offline indicator, request deduplication utils, and GitHub API response types.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitutional principles satisfied without requiring exceptions.

**Clarification Impact**: Five clarifications added 8 new requirements and modified 6 existing ones without introducing constitutional violations. All changes align with existing principles (local-first, minimal dependencies, Electron patterns).

---

## Phase 0: Research ✅ COMPLETE

**Status**: Completed on 2025-11-06

**Output**: `research.md` with 10 major technology decisions documented

**Key Decisions**:
1. GitHub Device Flow authentication pattern
2. Cloudflare Worker + KV backend architecture
3. Web Crypto API for JWT signing (no native crypto dependency)
4. electron-store for encrypted client storage
5. Per-user rate limiting (5 requests/minute)
6. 30-day session TTL with sliding window **(clarified 2025-11-20: sliding window resets on activity)**
7. Exponential backoff retry (1s, 2s, 4s)
8. IPC security with contextBridge
9. Structured error handling
10. Installation token exchange lifecycle

**Updates Required (2025-11-20)**:
- ⏸️ Document token caching strategy (Clarification #2)
- ⏸️ Document offline read-only mode (Clarification #3)
- ⏸️ Document KV choice rationale (Clarification #4)
- ⏸️ Document device flow timeout UX (Clarification #5)

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: Completed on 2025-11-06, **requires updates for clarifications**

### Artifacts Created

1. **`data-model.md`**: Entity definitions with Zod schemas
   - 8 entities: UserSession, User, Installation, Account, InstallationToken, DeviceAuthorization, BackendSession, RateLimitState
   - Validation rules, relationships, state transitions
   - Storage locations and security considerations
   - **UPDATE NEEDED**: Add TokenCache entity, update BackendSession for sliding window TTL

2. **`contracts/ipc.md`**: Electron IPC contracts
   - 5 IPC channels: auth:github-login, auth:get-session, auth:select-installation, auth:refresh-installation-token, auth:logout
   - 6 event subscriptions: user-code, login-success, login-error, token-refreshed, session-expired, logout-success
   - TypeScript API surface definitions
   - Error handling strategies
   - **UPDATE NEEDED**: Add offline-mode events, device-timeout events, installation-cached events

3. **`contracts/backend-api.md`**: Cloudflare Worker REST API
   - 6 REST endpoints: POST /auth/device, POST /auth/poll, POST /auth/installation-token, POST /auth/refresh-installation-token, POST /auth/installations, POST /auth/logout
   - Full OpenAPI 3.0 specification
   - Rate limiting, CORS, security headers
   - Error response formats
   - **UPDATE NEEDED**: Document sliding window TTL behavior, concurrent refresh deduplication

4. **`quickstart.md`**: Developer setup guide
   - GitHub App registration (6 steps)
   - Cloudflare Worker setup (KV namespaces, secrets)
   - Desktop app configuration
   - Local development workflow
   - Production deployment
   - Troubleshooting guide

### Constitution Re-Check (Post-Design)

**Re-evaluated**: 2025-11-06 after Phase 1 completion, **re-checked 2025-11-20 after clarifications**

All principles still PASS ✅ - Clarifications added requirements without violating constitution.

### Final Phase 1 Status: **COMPLETE** ✅ (Updates pending for clarifications)

All design artifacts complete. Zero constitutional violations. Ready for Phase 2 (task breakdown). **Action required**: Update data-model.md and contracts/ for new clarifications.

---

## Phase 2: Task Breakdown ✅ COMPLETE

**Status**: Completed on 2025-11-06, **requires updates for clarifications**

### Artifact Created

**`tasks.md`**: Complete implementation task list
- **Total tasks**: 95 tasks across 8 phases **(updated 2025-11-18: added migration tasks and critical fixes)**
- **MVP scope**: 45 tasks complete (47%)
- **Phase 3 progress**: 88% complete (29/33 tasks)
- **Organization**: Tasks grouped by user story for independent implementation

### Critical Discoveries (2025-11-18)

Three blocking issues resolved during Phase 3 implementation:
1. **User-Agent header**: All GitHub API requests MUST include `User-Agent: IssueDesk/1.0.0` (FR-030)
2. **GitHubDeviceFlowResponse type**: Complete discriminated union with all fields (success + error states)
3. **OAuth scope**: Empty scope ('') required for installation access

### Task Organization

**Phase Structure**:
1. **Phase 1 - Setup** (7 tasks): ✅ 100% complete
2. **Phase 2 - Foundational** (9 tasks): ✅ 100% complete
3. **Phase 3 - US1: Initial Authentication** (33 tasks): ⏸️ 88% complete (29/33)
4. **Phase 4 - US5: Security** (8 tasks): Not started
5. **Phase 5 - US2: Installation Selection** (12 tasks): Not started
6. **Phase 6 - US4: Session Persistence** (8 tasks): Not started
7. **Phase 7 - US3: Token Refresh** (10 tasks): Not started
8. **Phase 8 - Polish + Migration** (25 tasks): Not started (includes 8 PAT migration tasks)

### Updates Required (2025-11-20)

Based on clarifications, tasks.md needs updates for:

**New Implementation Tasks**:
- Multi-installation token cache (FR-013a/b)
- Sliding window session TTL (FR-025/FR-025a)
- Read-only offline mode (FR-029b/FR-029c)
- Request deduplication (concurrent refresh handling)
- Device flow timeout UX (FR-004a/FR-004b)
- KV session storage implementation
- Offline indicator UI component

**Modified Existing Tasks**:
- Update session creation to use sliding window TTL
- Update installation selection to cache tokens
- Update token refresh to handle deduplication
- Add offline mode tests
- Add timeout handling tests

### Final Phase 2 Status: **COMPLETE** ✅ (Updates pending for clarifications)

Task breakdown ready for implementation. Clear MVP scope. **Action required**: Update tasks.md with new requirements from clarifications.

---

## Implementation Status

**Last Updated**: 2025-11-20

### Current State: Phase 3 (US1 - Initial Authentication)

**Progress**: 88% complete (29/33 tasks)

**Completed**:
- ✅ Device flow initiation (device code generation)
- ✅ Device flow polling (5-second intervals)
- ✅ Access token retrieval
- ✅ Installation list retrieval
- ✅ User-Agent header fix (CRITICAL - blocked all API calls)
- ✅ OAuth scope configuration (empty scope for installation access)
- ✅ Type system refactoring (GitHubDeviceFlowResponse with all fields)
- ✅ Environment setup and validation
- ✅ Comprehensive documentation (IMPLEMENTATION-LESSONS.md, MIGRATION-FROM-PAT.md)

**In Progress** (4 tasks remaining):
- ⏸️ KV session storage with sliding window TTL (partially implemented)
- ⏸️ Installation token exchange endpoint (not started)
- ⏸️ End-to-end authentication flow testing
- ⏸️ UI polish (profile component, error handling, timeout UX)

**Blocked By**: None (all clarifications resolved)

### Critical Issues Resolved

**Issue #1**: User-Agent Header Missing ⚠️ **BLOCKING**
- **Impact**: ALL GitHub API requests returned 403 Forbidden
- **Solution**: Added `User-Agent: IssueDesk/1.0.0` to every GitHub API call
- **Documented**: IMPLEMENTATION-LESSONS.md, Section "Critical Issue #1"

**Issue #2**: Device Flow URLs
- **Impact**: 403 errors from device flow endpoints
- **Solution**: Use github.com/login/* (not api.github.com/login/*)

**Issue #3**: OAuth Scope
- **Impact**: 403 from /user/installations endpoint
- **Solution**: Empty scope ('') grants installation access for GitHub Apps

### Remaining Work

**Phase 3 (Immediate - 12% remaining)**:
1. Complete KV session storage (sliding window TTL)
2. Implement installation token exchange endpoint
3. Add device flow timeout UI (15-minute expiry)
4. End-to-end testing (device flow → installation → token)
5. UI polish (profile component, error states)

**Phase 4 (Security - Next)**:
- Configure Worker secrets
- CORS validation
- CSP headers
- Encryption verification
- Security audit

**Phase 5-7 (Feature completion)**:
- Installation selection with token caching (FR-013a/b)
- Session persistence with sliding window (FR-025)
- Token refresh with offline mode (FR-029b/c)

**Phase 8 (Migration)**:
- Remove PAT code from Settings
- Update GitHub API client for Bearer tokens
- Create migration prompt UI
- Migration detection and cleanup

### Estimated Timeline

- **Phase 3 completion**: 2-3 days (4 tasks remaining)
- **Phase 4 (Security)**: 2-3 days (8 tasks)
- **Phases 5-7 (parallel)**: 1-2 weeks (30 tasks)
- **Phase 8 (Migration)**: 3-5 days (8 tasks + testing)
- **Total remaining**: ~3-4 weeks to production

### Next Actions

1. **Update documentation** ✅ COMPLETE
   - [x] Created CLARIFICATIONS.md with full rationale
   - [x] Updated spec.md with new requirements
   - [x] Updated plan.md with clarification impacts

2. **Update contracts and data model** (NEXT)
   - [ ] Update data-model.md for TokenCache entity
   - [ ] Update contracts/ipc.md for offline events
   - [ ] Update contracts/backend-api.md for sliding window

3. **Update tasks.md** (AFTER #2)
   - [ ] Add new tasks for clarified requirements
   - [ ] Update existing tasks with new details
   - [ ] Adjust MVP scope if needed

4. **Resume Phase 3 implementation**
   - [ ] Implement KV session storage
   - [ ] Build installation token exchange
   - [ ] Add timeout handling
   - [ ] Complete end-to-end testing

---

## Next Steps

**Immediate (This Session)**:
1. ✅ Update plan.md with clarifications (COMPLETE)
2. ⏸️ Update data-model.md for new entities
3. ⏸️ Update contracts for new IPC/API requirements
4. ⏸️ Update tasks.md with clarification tasks

**After Documentation Updates**:
1. Resume Phase 3 implementation (4 tasks remaining)
2. Begin Phase 4 security validation
3. Implement clarified requirements (token caching, sliding window, offline mode)

**When ready to implement**:
- Continue with remaining Phase 3 tasks
- Follow task order strictly within each phase
- Test each clarified requirement independently
- Commit frequently with clear messages referencing FRs
