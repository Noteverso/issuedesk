# Implementation Plan: GitHub App Authorization with Cloudflare Worker Backend

**Branch**: `002-github-app-auth` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-github-app-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement secure GitHub App authentication using device flow, with all sensitive credentials (private keys, client secrets) stored exclusively in a Cloudflare Worker backend. The backend exchanges installation IDs for short-lived (1-hour) access tokens, which are safely stored in the Electron desktop client using platform-specific encrypted storage. The system supports multi-organization installations, automatic token refresh, and 30-day session persistence with 5 requests/minute rate limiting per user.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js ≥18.0.0 (Electron 33+), JavaScript ES2020+ (Cloudflare Workers)
**Primary Dependencies**: 
- Desktop: Electron 33+, React 18+, electron-store (encrypted storage), @octokit/auth-app (GitHub App JWT generation on backend only)
- Backend: Cloudflare Workers runtime, Web Crypto API (built-in)
**Storage**: 
- Client: electron-store with encryption for tokens and session data
- Backend: Cloudflare KV for user session persistence (30-day TTL)
**Testing**: Vitest (desktop contracts), Miniflare (Cloudflare Worker local testing)
**Target Platform**: 
- Desktop: Electron (macOS, Windows, Linux)
- Backend: Cloudflare Workers (edge network, serverless)
**Project Type**: Web application (frontend: Electron renderer, backend: Cloudflare Worker)
**Performance Goals**: 
- Backend token exchange: <500ms (95th percentile)
- Device flow polling: 5-second intervals
- UI responsiveness: <100ms for auth state updates
**Constraints**: 
- Zero secrets in client code (verified via security audit)
- Backend rate limiting: 5 requests/minute/user
- Token refresh: 3 retries with exponential backoff (1s, 2s, 4s)
- Session expiration: 30 days
- Cloudflare Worker execution time: <50ms per request (typical)
**Scale/Scope**: 
- Support 1000 concurrent authentication requests
- Handle multiple installations per user
- Backend session storage: ~1KB per user session

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
- **Status**: PASS - Auth system maintains local state first, syncs with GitHub backend as needed

### ✅ Principle III: GitHub-Inspired UI
- **Device code modal**: Follows GitHub's device flow UI patterns (code display, copy button, waiting state)
- **Installation selection**: Matches GitHub's installation picker design (avatars, organization names, repository scopes)
- **Error messaging**: Uses GitHub-style toast notifications and error states
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

### Final Gate Status: **PASS** ✅
All constitutional principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/002-github-app-auth/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (technology choices, patterns)
├── data-model.md        # Phase 1 output (entities, schemas)
├── quickstart.md        # Phase 1 output (dev setup, deployment)
├── contracts/           # Phase 1 output (IPC and API contracts)
│   ├── ipc.md          # Desktop IPC contracts (auth handlers)
│   └── backend-api.md  # Cloudflare Worker REST API
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
│   │   └── github.ts        # GitHub API integration
│   ├── storage/             # KV storage abstraction
│   │   └── sessions.ts      # User session management
│   └── utils/
│       ├── rate-limit.ts    # Rate limiting (5/min/user)
│       └── retry.ts         # Retry logic with backoff
├── tests/
│   └── integration/         # Miniflare integration tests
├── wrangler.toml            # Cloudflare Worker config
└── package.json

# Desktop: Electron App
apps/desktop/src/
├── main/ipc/
│   └── auth.ts              # NEW: Auth IPC handlers
├── renderer/
│   ├── pages/
│   │   ├── Login.tsx        # NEW: Device flow login UI
│   │   └── InstallationSelect.tsx  # NEW: Installation picker
│   └── components/auth/
│       ├── DeviceCodeModal.tsx     # NEW: Device code display
│       └── AuthGuard.tsx           # NEW: Route protection
└── preload.ts               # UPDATED: Add auth IPC bridge

# Shared Types
packages/shared/src/
├── types/
│   └── auth.ts              # NEW: Auth-related types
└── schemas/
    └── auth.schema.ts       # NEW: Zod schemas for auth
```

**Structure Decision**: Web application pattern with clear backend/frontend separation. Backend is a standalone Cloudflare Worker (not monorepo package) to maintain deployment independence. Desktop app extends existing Electron structure with auth-specific IPC handlers, pages, and components. Shared types ensure type safety across client-worker boundary.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitutional principles satisfied without requiring exceptions.

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
6. 30-day session TTL with sliding window
7. Exponential backoff retry (1s, 2s, 4s)
8. IPC security with contextBridge
9. Structured error handling
10. Installation token exchange lifecycle

---

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: Completed on 2025-11-06

### Artifacts Created

1. **`data-model.md`**: Entity definitions with Zod schemas
   - 8 entities: UserSession, User, Installation, Account, InstallationToken, DeviceAuthorization, BackendSession, RateLimitState
   - Validation rules, relationships, state transitions
   - Storage locations and security considerations

2. **`contracts/ipc.md`**: Electron IPC contracts
   - 5 IPC channels: auth:github-login, auth:get-session, auth:select-installation, auth:refresh-installation-token, auth:logout
   - 6 event subscriptions: user-code, login-success, login-error, token-refreshed, session-expired, logout-success
   - TypeScript API surface definitions
   - Error handling strategies

3. **`contracts/backend-api.md`**: Cloudflare Worker REST API
   - 6 REST endpoints: POST /auth/device, POST /auth/poll, POST /auth/installation-token, POST /auth/refresh-installation-token, POST /auth/installations, POST /auth/logout
   - Full OpenAPI 3.0 specification
   - Rate limiting, CORS, security headers
   - Error response formats

4. **`quickstart.md`**: Developer setup guide
   - GitHub App registration (6 steps)
   - Cloudflare Worker setup (KV namespaces, secrets)
   - Desktop app configuration
   - Local development workflow
   - Production deployment
   - Troubleshooting guide

### Constitution Re-Check (Post-Design)

**Re-evaluated**: 2025-11-06 after Phase 1 completion

#### ✅ Principle I: Minimal Dependencies
**Post-Design Verification**:
- Data model uses only Zod schemas (already in shared package)
- IPC contracts use built-in Electron APIs (contextBridge, ipcMain/ipcRenderer)
- Backend API uses Web Crypto (built-in), no new dependencies
- **New dependencies introduced**: ZERO
- **Status**: PASS ✅ - No additional dependencies added during design

#### ✅ Principle II: Local-First Architecture
**Post-Design Verification**:
- UserSession stored locally in electron-store (offline-capable)
- Installations list cached locally after first fetch
- Session tokens persist for 30 days (local session survives restarts)
- Network required only for: initial login, installation selection, token refresh
- **Local state priority**: ✅ Confirmed in data model (client storage primary)
- **Status**: PASS ✅ - Design maintains local-first architecture

#### ✅ Principle III: GitHub-Inspired UI
**Post-Design Verification**:
- Device code modal follows GitHub's device flow UI (user code display, verification link)
- Installation selection picker uses GitHub's account/org display patterns
- Error messages match GitHub's toast notification style
- **UI consistency**: ✅ Documented in IPC contracts (LoginErrorEvent, UserCodeEvent)
- **Status**: PASS ✅ - UI patterns align with GitHub conventions

#### ✅ Principle IV: Electron Native Patterns
**Post-Design Verification**:
- IPC uses contextBridge with type-safe preload (AuthAPI interface)
- All auth operations isolated in main process (no renderer direct access)
- Session tokens encrypted via electron-store (Electron's safeStorage API)
- Background token polling runs in main process (non-blocking)
- **Security**: ✅ nodeIntegration=false, contextIsolation=true (confirmed in contracts)
- **Status**: PASS ✅ - Follows all Electron security best practices

#### ✅ Principle V: Workspace Architecture
**Post-Design Verification**:
- Backend lives in `workers/auth/` (independent of desktop app)
- Shared types will go in `@issuedesk/shared/src/types/auth.ts`
- Auth schemas in `@issuedesk/shared/src/schemas/auth.schema.ts`
- No circular dependencies (Worker → GitHub API, Desktop → Worker API)
- **Monorepo compliance**: ✅ Structure documented in Project Structure section
- **Status**: PASS ✅ - Clean workspace boundaries maintained

### Quality Gates (Post-Design)

- **Security audit**: ✅ Zero secrets in client (confirmed in backend-api.md security section)
- **Performance targets**: ✅ All latency goals documented (<500ms backend, <100ms UI)
- **Type safety**: ✅ Full TypeScript contracts defined (IPC and REST APIs)
- **Error handling**: ✅ Comprehensive error codes and retry strategies defined

### Final Phase 1 Status: **PASS** ✅

All design artifacts complete. Zero constitutional violations. Ready for Phase 2 (task breakdown).

---

## Phase 2: Task Breakdown ✅ COMPLETE

**Status**: Completed on 2025-11-06

### Artifact Created

**`tasks.md`**: Complete implementation task list
- **Total tasks**: 87 tasks across 8 phases
- **MVP scope**: 40 tasks (Phases 1-4: Setup, Foundational, US1, US5)
- **Parallel opportunities**: 31 tasks marked [P] (35.6% of total)
- **Organization**: Tasks grouped by user story for independent implementation

### Task Organization

**Phase Structure**:
1. **Phase 1 - Setup** (7 tasks): Project initialization, shared types, basic configuration
2. **Phase 2 - Foundational** (9 tasks): Rate limiting, JWT, KV storage, IPC stubs (blocks all user stories)
3. **Phase 3 - US1: Initial Authentication** (16 tasks): Device flow backend + desktop UI
4. **Phase 4 - US5: Security** (8 tasks): Secrets management, CORS, encryption validation
5. **Phase 5 - US2: Installation Selection** (12 tasks): Multi-installation support
6. **Phase 6 - US4: Session Persistence** (8 tasks): Session restoration across restarts
7. **Phase 7 - US3: Token Refresh** (10 tasks): Automatic token refresh logic
8. **Phase 8 - Polish** (17 tasks): Logout, AuthGuard, styling, accessibility, final audit

### Task Mapping to User Stories

- **US1 (Initial Authentication - P1)**: 16 implementation tasks
  - Backend: Device flow endpoints (T017-T021)
  - Desktop IPC: Login handler, polling, events (T022-T025)
  - Desktop UI: Login page, device code modal, profile (T026-T032)

- **US5 (Security - P1)**: 8 validation tasks
  - Worker secrets configuration (T033-T034)
  - CORS, CSP, encryption verification (T035-T037)
  - Security audit and logging (T038-T040)

- **US2 (Installation Selection - P2)**: 12 tasks
  - Backend: Installations API, token exchange (T041-T045)
  - Desktop: Selection IPC, UI components (T046-T052)

- **US4 (Session Persistence - P2)**: 8 tasks
  - Desktop: Session restoration (T053-T057)
  - Backend: KV TTL, sliding window (T058-T060)

- **US3 (Token Refresh - P3)**: 10 tasks
  - Backend: Refresh endpoint (T061-T062)
  - Desktop: Auto-refresh logic, UI feedback (T063-T070)

### Implementation Strategy

**MVP First** (40 tasks):
- Phases 1-4 deliver secure authentication
- Users can log in, see profile, system is secure
- Estimated: 1-2 weeks (single developer)

**Incremental Delivery**:
- Foundation (16 tasks) → US1+US5 (24 tasks) → US2 (12 tasks) → US4 (8 tasks) → US3 (10 tasks) → Polish (17 tasks)
- Each increment is independently testable and deployable

**Parallel Team Strategy**:
- After Foundation: 3 developers can work on US1 backend, desktop IPC, desktop UI simultaneously
- Different user stories have minimal cross-dependencies

### Dependencies

**Critical Path**:
1. Setup → Foundational (blocks everything)
2. Foundational → US1 (must complete first, all others depend on auth)
3. US1 → US2, US4, US3 (can proceed in parallel after US1)

**Independent Stories**:
- US2, US4, US3 have no interdependencies (after US1 complete)
- Can be implemented/shipped independently

### Validation

- ✅ All tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with path`
- ✅ Each user story has complete implementation tasks (models → services → endpoints → UI)
- ✅ Foundational phase clearly blocks user stories
- ✅ Independent test criteria defined for each user story
- ✅ MVP scope clearly identified (Phases 1-4)

### Final Phase 2 Status: **COMPLETE** ✅

Task breakdown ready for implementation. Clear MVP scope (40 tasks). Parallel execution plan defined.

---

## Next Steps

**STOP**: Do NOT proceed with implementation yet.

The planning phase is complete. Next actions:

1. **Review**: Review `tasks.md` with stakeholders
2. **Prioritize**: Confirm MVP scope (US1 + US5)
3. **Staff**: Assign tasks to developers
4. **Execute**: Begin with Phase 1 (Setup) tasks

**When ready to implement**:
- Start with T001 (Create Worker structure)
- Follow task order strictly within each phase
- Mark tasks complete as you go: `- [x] T001 ...`
- Commit frequently (after each task or logical group)
- Test each user story independently before moving to next

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitutional principles satisfied without requiring exceptions.
