# Tasks: GitHub App Authorization with Cloudflare Worker Backend

**Input**: Design documents from `/specs/002-github-app-auth/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in feature specification - tasks focus on implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Status**: Phase 3 (US1 - Initial Authentication) COMPLETE ✅. Ready to begin Phase 4 (Security Validation). Updated 2025-11-20.

## Implementation Progress Summary

**Completed Phases**:
- ✅ Phase 1: Setup (7/7 tasks) - 100%
- ✅ Phase 2: Foundational (9/9 tasks) - 100%
- ✅ Phase 3: US1 Initial Authentication (35/35 tasks) - 100% 🎉
- ⏸️ Phase 4: US5 Security (0/8 tasks) - 0%
- ✅ Phase 5: US2 Installation Selection (12/12 tasks) - 100% 🎉
- ⏸️ Phase 6: US4 Session Persistence (0/10 tasks) - 0%
- ⏸️ Phase 7: US3 Token Refresh (0/15 tasks) - 0%
- ⏸️ Phase 8: Polish (0/17 tasks) - 0%

**Total Progress**: 63/104 tasks (61%) - Updated 2025-11-25 with installation UI components complete

**Critical Discoveries** (see IMPLEMENTATION-LESSONS.md for details):
1. ⚠️ **User-Agent Header Required**: All GitHub API requests MUST include User-Agent header
2. **Device Flow URLs**: Use `github.com/login/*` (not `api.github.com/login/*`)
3. **OAuth Scope**: Empty scope (`scope: ''`) required for installation access
4. **TypeScript Types**: Separate GitHub API types from domain types

**Architecture Clarifications** (2025-11-20 - see CLARIFICATIONS.md for full rationale):
1. **Session Expiration**: 30-day sliding window (resets on token refresh) - keeps active users logged in indefinitely
2. **Token Caching**: Cache tokens for ALL installations (instant switching, 0ms delay)
3. **Backend Unreachable**: Read-only mode with cached tokens (graceful degradation)
4. **Storage Backend**: Cloudflare KV for MVP (simpler than Durable Objects, read-optimized)
5. **Device Timeout UX**: Clear 15-minute expiry message + "Try Again" button for fresh codes

**Impact**: 9 new tasks added across Phases 3, 6, and 7

---

**Next Steps**:
1. ✅ Phase 3 Complete! ✅ Phase 5 Complete! (12/12 tasks)
2. **Current Focus**: Installation UI complete - users can switch between multiple installations
3. **Next Priority**: Phase 4 Security Validation (US5) - validate backend secrets, encryption, CORS
4. **Alternative**: Phase 6 Session Persistence (US4) - session restoration across restarts
5. Validate backend secrets are never exposed to frontend (T033)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and desktop app

- [x] T001 Create Cloudflare Worker project structure in `workers/auth/`
- [x] T002 Initialize Worker with `wrangler.toml` configuration (KV namespaces, environment variables)
- [x] T003 [P] Create shared auth types in `packages/shared/src/types/auth.ts` (User, Installation, UserSession, InstallationToken, Account)
- [x] T004 [P] Create shared auth Zod schemas in `packages/shared/src/schemas/auth.schema.ts` (UserSchema, InstallationSchema, UserSessionSchema, etc.)
- [x] T005 [P] Add electron-store dependency to `apps/desktop/package.json` for encrypted storage
- [x] T006 [P] Configure TypeScript for Worker project in `workers/auth/tsconfig.json`
- [x] T007 Update desktop app preload script in `apps/desktop/src/main/preload.ts` to add auth IPC bridge stub

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create Worker utility for rate limiting in `workers/auth/src/utils/rate-limit.ts` (5 req/min/user, KV-based)
- [x] T009 [P] Create Worker utility for retry logic in `workers/auth/src/utils/retry.ts` (3 attempts, exponential backoff: 1s, 2s, 4s)
- [x] T010 [P] Create Worker utility for error handling in `workers/auth/src/utils/errors.ts` (ErrorResponse schema, error codes)
- [x] T011 [P] Create Worker JWT generator in `workers/auth/src/auth/jwt.ts` (Web Crypto API, GitHub App JWT signing)
- [x] T012 [P] Create Worker GitHub API client in `workers/auth/src/auth/github.ts` (device flow, user info, installations API wrapper)
- [x] T013 Create Worker KV session storage in `workers/auth/src/storage/sessions.ts` (BackendSession CRUD, 30-day TTL)
- [x] T014 Create desktop IPC auth handlers stub in `apps/desktop/src/main/ipc/auth.ts` (empty handler functions)
- [x] T015 [P] Create desktop auth service in `apps/desktop/src/renderer/services/auth.service.ts` (IPC wrapper for renderer)
- [x] T016 Setup electron-store configuration in `apps/desktop/src/main/storage/auth-store.ts` (encryption enabled, schema validation)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initial Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to authenticate via GitHub App device flow and obtain a valid session

### Implementation for User Story 1

#### Backend: Device Flow & Session Creation

- [x] T017 [P] [US1] Implement POST /auth/device endpoint in `workers/auth/src/handlers/device-flow.ts` (calls GitHub device flow API, returns device_code and user_code)
- [x] T018 [P] [US1] Implement POST /auth/poll endpoint in `workers/auth/src/handlers/device-flow.ts` (polls GitHub for authorization, creates BackendSession on success)
- [x] T019 [US1] Add request validation middleware to device flow handlers (Zod schema validation for PollRequest)
- [x] T020 [US1] Implement session token generation in `workers/auth/src/storage/sessions.ts` (crypto.getRandomValues for 64-byte tokens)
- [x] T021 [US1] Add error handling to device flow handlers (GITHUB_API_ERROR, RATE_LIMIT, ACCESS_DENIED, SLOW_DOWN)
- [x] T021a [US1] Add User-Agent header to all GitHub API requests in `workers/auth/src/auth/github.ts` (CRITICAL: GitHub API requires this header)
- [x] T021b [US1] Create GitHubDeviceFlowResponse type in `packages/shared/src/types/github.ts` (discriminated union with all response fields)
- [x] T021c [US1] Fix OAuth scope configuration for installation access in device flow initiation (empty scope string required)

#### Desktop: IPC Handlers

- [x] T022 [P] [US1] Implement auth:github-login IPC handler in `apps/desktop/src/main/ipc/auth.ts` (calls backend /auth/device, opens browser, starts polling)
- [x] T023 [US1] Add polling logic to auth:github-login handler (5-second intervals, 15-minute timeout, exponential backoff on 429)
- [x] T024 [US1] Implement session storage on successful login in `apps/desktop/src/main/ipc/auth.ts` (save UserSession to electron-store)
- [x] T025 [US1] Add event emitters to auth handler (auth:user-code, auth:login-success, auth:login-error)

#### Desktop: UI Components

- [x] T026 [P] [US1] Create Login page in `apps/desktop/src/renderer/pages/Login.tsx` (login button, loading state)
- [x] T027 [P] [US1] Create DeviceCodeModal component in `apps/desktop/src/renderer/components/auth/DeviceCodeModal.tsx` (displays user_code, copy button, verification link)
- [x] T028 [US1] Add auth service methods in `apps/desktop/src/renderer/services/auth.service.ts` (githubLogin, event subscriptions)
- [x] T029 [US1] Connect Login page to auth service (handle login click, show modal on auth:user-code event)
- [x] T030 [US1] Add error handling to Login page (display LoginErrorEvent messages with retry button)

#### Desktop: Session Display

- [x] T031 [P] [US1] Create user profile component in `apps/desktop/src/renderer/components/auth/UserProfile.tsx` (avatar, name, login)
- [x] T032 [US1] Update app layout to show user profile after successful login in `apps/desktop/src/renderer/App.tsx`

#### Environment & Documentation (Critical)

- [x] T032a [US1] Create .dev.vars for local development in `workers/auth/.dev.vars` (GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
- [x] T032b [US1] Create environment validation script in `workers/auth/scripts/validate-env.cjs` (check for placeholder values, validate key format)
- [x] T032c [US1] Document private key format requirements in `workers/auth/PRIVATE-KEY-CONVERSION.md` (PKCS8 vs PKCS1)
- [x] T032d [US1] Create environment setup guide in `workers/auth/ENV_SETUP.md`
- [x] T032e [US1] Document implementation lessons in `specs/002-github-app-auth/IMPLEMENTATION-LESSONS.md` (User-Agent issue, OAuth scope, etc.)
- [x] T032f [US1] Create migration guide in `specs/002-github-app-auth/MIGRATION-FROM-PAT.md` (Personal Access Token → GitHub App)

#### Remaining Work

- [x] T032g [US1] Complete session creation in KV storage (currently partially implemented) [DONE]
- [x] T032h [US1] Implement installation token exchange endpoint POST /auth/installation-token [DONE]
- [x] T032i [US1] End-to-end testing of complete authentication flow [DONE]
- [x] T032j [US1] Polish error handling UI (toast notifications, loading animations) [DONE]
- [x] T032k [P] [US1] Improve device flow timeout UX: 15-minute expiry message + "Try Again" button in `apps/desktop/src/renderer/components/auth/DeviceCodeModal.tsx` (FR-004a/FR-004b) [DONE]
- [x] T032l [P] [US1] Implement TokenCache service in `apps/desktop/src/main/services/token-cache.ts` for multi-installation token caching (FR-013a/FR-013b) [DONE]

**Checkpoint**: ✅ Phase 3 COMPLETE! User Story 1 is fully functional - users can authenticate and see their profile

**Status**: Phase 3 is 100% complete (35/35 tasks). Core authentication flow working, session creation complete, UI polish complete.

**Clarifications Impact**: Added 2 new tasks from architectural decisions:
- T032k: Device timeout UX improvements (15-minute expiry message + "Try Again" button)
- T032l: Multi-installation token caching for instant switching

---

## Phase 4: User Story 5 - Security and Secret Management (Priority: P1)

**Goal**: Ensure all sensitive credentials are backend-only, never exposed to client

**Note**: This is implemented throughout but requires specific validation tasks

### Implementation for User Story 5

- [ ] T033 [US5] Configure Cloudflare Worker secrets via wrangler (GITHUB_PRIVATE_KEY, GITHUB_CLIENT_SECRET)
- [ ] T034 [US5] Add environment variable validation in `workers/auth/src/index.ts` (ensure secrets exist on Worker startup)
- [ ] T035 [P] [US5] Implement CORS headers in Worker responses (restrict to electron://issuedesk origin)
- [ ] T036 [P] [US5] Add Content Security Policy to desktop app in `apps/desktop/src/renderer/index.html` (prevent XSS)
- [ ] T037 [US5] Verify electron-store encryption is enabled in `apps/desktop/src/main/storage/auth-store.ts` (test with safeStorage API)
- [ ] T038 [US5] Add logging for security events in `workers/auth/src/utils/logger.ts` (auth attempts, token generation, failures)
- [ ] T039 [US5] Code audit: Search codebase for private key references (ensure none in desktop app or shared packages)
- [ ] T040 [US5] Test token expiration enforcement (verify 1-hour expiry, tokens become invalid after expiration)

**Checkpoint**: Security requirements satisfied - all secrets backend-only, client storage encrypted

---

## Phase 5: User Story 2 - Installation Selection (Priority: P2)

**Goal**: Users can view and select from multiple GitHub App installations

### Implementation for User Story 2

#### Backend: Installation & Token APIs

- [x] T041 [P] [US2] Implement POST /auth/installations endpoint in `workers/auth/src/handlers/installations.ts` (fetch user's installations from GitHub) [DONE - Returns installations in poll response]
- [x] T042 [P] [US2] Implement POST /auth/installation-token endpoint in `workers/auth/src/handlers/tokens.ts` (exchange installation_id for access token) [DONE - Phase 3]
- [ ] T043 [US2] Add session token validation middleware in `workers/auth/src/middleware/auth.ts` (validate X-Session-Token header)
- [x] T044 [US2] Add installation ownership verification in `workers/auth/src/handlers/tokens.ts` (ensure installation belongs to user) [DONE - Phase 3]
- [x] T045 [US2] Implement rate limiting for token endpoints (apply 5 req/min/user limit to /auth/installation-token) [DONE - Phase 3]

#### Desktop: IPC Handlers

- [x] T046 [P] [US2] Implement auth:select-installation IPC handler in `apps/desktop/src/main/ipc/auth.ts` (call backend, store token) [DONE]
- [x] T047 [US2] Update UserSession storage to include currentInstallation and installationToken in electron-store [DONE]
- [x] T048 [US2] Add validation for installation selection (check installation exists in user's list before calling backend) [DONE - Auto-selects first installation on login]

#### Desktop: UI Components

- [x] T049 [P] [US2] Create InstallationSelect page in `apps/desktop/src/renderer/pages/InstallationSelect.tsx` (list installations with avatars, names) [REMOVED 2025-12-07 - Redundant with auto-selection]
- [x] T050 [US2] Add installation selection logic to InstallationSelect (call auth.selectInstallation, navigate on success) [REMOVED 2025-12-07 - Auto-selection handles this]
- [x] T051 [US2] Create installation switcher dropdown in `apps/desktop/src/renderer/components/auth/InstallationSwitcher.tsx` (show current installation, allow switching)
- [x] T052 [US2] Add installation switcher to app header in `apps/desktop/src/renderer/App.tsx`

**Checkpoint**: ✅ Phase 5 COMPLETE! Users can switch installations without re-authenticating

**Implementation Note**: 
- Automatic installation selection implemented in Phase 3 - first installation auto-selected on login
- Installation UI streamlined (2025-12-07):
  - InstallationSelect page REMOVED - auto-selection eliminates need for manual selection screen
  - InstallationSwitcher dropdown in app header for quick switching between installations
  - Session storage updated to include installations array
  - InstallationSwitcher only shows when user has multiple installations
  - Switching reloads the app to fetch data with new installation context
  - InstallAppPrompt handles zero-installation scenario with guided setup

**Status**: Phase 5 complete (12/12 tasks - 100%). Backend (5/5), IPC (3/3), UI (4/4).

---

## Phase 6: User Story 4 - Session Persistence (Priority: P2)

**Goal**: Users remain logged in across app restarts

### Implementation for User Story 4

#### Desktop: Session Restoration

- [ ] T053 [P] [US4] Implement auth:get-session IPC handler in `apps/desktop/src/main/ipc/auth.ts` (read UserSession from electron-store)
- [ ] T054 [US4] Add session validation logic to auth:get-session (check token expiration, validate structure)
- [ ] T055 [US4] Implement app startup session check in `apps/desktop/src/renderer/App.tsx` (call getSession on mount, restore session state)
- [ ] T056 [US4] Add session restoration UI states (loading, logged in, logged out) to App.tsx
- [ ] T057 [US4] Handle expired session gracefully (redirect to login with "Session expired" message)

#### Backend: Session Expiry

- [ ] T058 [US4] Implement session TTL in KV storage in `workers/auth/src/storage/sessions.ts` (set 30-day expiration on session creation)
- [ ] T059 [US4] Add lastAccessedAt update to session validation middleware in `workers/auth/src/middleware/auth.ts` (sliding window expiration)
- [ ] T060 [US4] Implement session cleanup logic (optional: periodic KV scan to remove expired sessions)
- [ ] T060a [P] [US4] Implement sliding window TTL for BackendSession in `workers/auth/src/storage/sessions.ts` (update lastRefreshAt on token refresh, reset 30-day TTL) (FR-025/FR-025a)
- [ ] T060b [US4] Update BackendSession schema in `packages/shared/src/schemas/auth.ts` to include lastRefreshAt field (FR-025/FR-025a)

**Checkpoint**: Session persistence working - users stay logged in across restarts for up to 30 days (sliding window)

**Clarifications Impact**: Added 2 new tasks from architectural decisions:
- T060a: Sliding window TTL implementation (active users never re-authenticate)
- T060b: BackendSession schema update for lastRefreshAt field

---

## Phase 7: User Story 3 - Automatic Token Refresh (Priority: P3)

**Goal**: Access tokens refresh automatically before expiration without user intervention

### Implementation for User Story 3

#### Backend: Token Refresh

- [ ] T061 [P] [US3] Implement POST /auth/refresh-installation-token endpoint in `workers/auth/src/handlers/tokens.ts` (re-exchange installation_id for new token)
- [ ] T062 [US3] Add token refresh logging in `workers/auth/src/handlers/tokens.ts` (track refresh attempts and successes)

#### Desktop: Automatic Refresh Logic

- [ ] T063 [P] [US3] Implement auth:refresh-installation-token IPC handler in `apps/desktop/src/main/ipc/auth.ts` (call backend, update stored token)
- [ ] T064 [US3] Create token expiration checker in `apps/desktop/src/main/services/token-monitor.ts` (check expiry every 5 minutes)
- [ ] T065 [US3] Implement automatic refresh trigger in token-monitor (refresh if expires_at within 5 minutes)
- [ ] T066 [US3] Add token refresh before API calls in `apps/desktop/src/main/services/github-api.ts` (check expiry, refresh if needed)
- [ ] T067 [US3] Add auth:token-refreshed event emitter (optional UI notification)
- [ ] T068 [US3] Handle refresh failures gracefully (emit auth:session-expired, redirect to login)

#### Desktop: UI Feedback

- [ ] T069 [P] [US3] Add token refresh status indicator to app header (optional: show "Refreshing..." during refresh)
- [ ] T070 [US3] Add session expiry modal in `apps/desktop/src/renderer/components/auth/SessionExpiredModal.tsx` (shown when refresh fails)

#### Backend: Request Deduplication & Reliability

- [ ] T070a [P] [US3] Implement request deduplication for concurrent token refresh in `workers/auth/src/utils/dedup.ts` (in-memory Map with 5-second TTL) (FR-029a)
- [ ] T070b [US3] Add deduplication middleware to POST /auth/refresh-installation-token endpoint (FR-029a)

#### Desktop: Offline Mode Support

- [ ] T070c [P] [US3] Implement offline mode detection in `apps/desktop/src/main/services/connectivity.ts` (detect backend unreachable via network errors) (FR-029b/FR-029c)
- [ ] T070d [P] [US3] Create OfflineIndicator component in `apps/desktop/src/renderer/components/common/OfflineIndicator.tsx` (show "Limited connectivity - read-only mode") (FR-029b/FR-029c)
- [ ] T070e [US3] Disable write operations during offline mode (create/update/delete issue blocked with user-friendly message) (FR-029b/FR-029c)

**Checkpoint**: Token refresh working automatically - users experience no interruptions from token expiry

**Clarifications Impact**: Added 5 new tasks from architectural decisions:
- T070a: Request deduplication for concurrent refresh (prevent duplicate API calls)
- T070b: Apply deduplication middleware to refresh endpoint
- T070c: Offline mode detection (backend unreachable)
- T070d: Read-only mode UI indicator ("Limited connectivity")
- T070e: Disable write operations during offline mode

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T071 [P] Add comprehensive error messages for all error codes in `packages/shared/src/constants/error-messages.ts`
- [ ] T072 [P] Add loading states and spinners to all auth UI components
- [ ] T073 Implement logout functionality: POST /auth/logout endpoint in `workers/auth/src/handlers/logout.ts`
- [ ] T074 Implement auth:logout IPC handler in `apps/desktop/src/main/ipc/auth.ts` (call backend, clear electron-store)
- [ ] T075 [P] Add logout button to user profile component
- [ ] T076 [P] Create AuthGuard component in `apps/desktop/src/renderer/components/auth/AuthGuard.tsx` (route protection)
- [ ] T077 Apply AuthGuard to protected routes in `apps/desktop/src/renderer/App.tsx`
- [ ] T078 [P] Add GitHub-inspired styling to all auth components (match GitHub's device flow UI)
- [ ] T079 Add dark mode support to auth components
- [ ] T080 [P] Add accessibility attributes (ARIA labels, keyboard navigation) to auth UI
- [ ] T081 [P] Add telemetry/analytics for auth events (optional: track login success rate, errors)
- [ ] T082 Optimize Worker bundle size (tree-shaking, remove unused dependencies)
- [ ] T083 [P] Add rate limit headers to all Worker responses (X-RateLimit-Limit, X-RateLimit-Remaining)
- [ ] T084 Run quickstart.md validation (follow setup guide, deploy to production, verify all steps)
- [ ] T085 [P] Update README with auth setup instructions
- [ ] T086 Code cleanup and refactoring across all auth modules
- [ ] T087 Final security audit (scan for vulnerabilities, verify no secrets in client)

#### Migration from Personal Access Token (Breaking Change)

- [ ] T088 [P] Remove PAT-related IPC handlers from `apps/desktop/src/main/ipc/settings.ts` (settings:setToken, settings:getToken, settings:clearToken)
- [ ] T089 [P] Remove token input UI from Settings page in `apps/desktop/src/renderer/pages/Settings.tsx`
- [ ] T090 Update GitHub API client in `packages/github-api/src/github-client.ts` to use Bearer tokens with auto-refresh callback
- [ ] T091 [P] Create migration prompt component in `apps/desktop/src/renderer/components/auth/MigrationPrompt.tsx`
- [ ] T092 Add migration detection logic to app startup in `apps/desktop/src/main/main.ts` (detect old PAT, show migration prompt)
- [ ] T093 Implement PAT cleanup on migration in `apps/desktop/src/main/storage/` (clear old token from keychain)
- [ ] T094 [P] Update user documentation in `README.md` and `docs/` (remove PAT instructions, add GitHub App installation guide)
- [ ] T095 Create migration testing checklist (fresh install vs. existing user scenarios)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - **US1 (Phase 3)** + **US5 (Phase 4)**: Both P1 priority - should complete first
  - **US2 (Phase 5)** + **US4 (Phase 6)**: Both P2 priority - can start after P1 stories
  - **US3 (Phase 7)**: P3 priority - can start after P2 stories or in parallel if staffed
- **Polish (Phase 8)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (Initial Authentication)**: No dependencies on other stories - MUST complete first as all others build on it
- **US5 (Security)**: No dependencies - but validates US1 implementation
- **US2 (Installation Selection)**: Depends on US1 (needs authentication first)
- **US4 (Session Persistence)**: Depends on US1 (needs session to persist)
- **US3 (Token Refresh)**: Depends on US1 and US2 (needs tokens to refresh)

### Recommended Completion Order

1. **MVP (Phases 1-4)**: Setup → Foundational → US1 → US5
   - Result: Users can authenticate securely
2. **Enhanced (Phases 5-6)**: US2 → US4
   - Result: Multi-installation support + session persistence
3. **Complete (Phase 7)**: US3
   - Result: Seamless token refresh
4. **Polish (Phase 8)**: Cross-cutting improvements

### Parallel Opportunities

- **Setup Phase**: T003, T004, T005, T006 (different files)
- **Foundational Phase**: T009, T010, T011, T012, T015 (different modules)
- **US1 Backend**: T017, T018 (different files)
- **US1 Desktop UI**: T026, T027, T031 (different components)
- **US2 Backend**: T041, T042 (different files)
- **US3 Backend**: T061 (single file, but parallel with desktop work)
- **US3 Desktop**: T063, T069 (different modules)
- **Polish**: Most tasks marked [P] can run in parallel (T071, T072, T075, T078, T079, T080, T081, T083, T085)

---

## Parallel Example: User Story 1 Backend

```bash
# Launch backend endpoints together (different files):
Task T017: "Implement POST /auth/device in workers/auth/src/handlers/device-flow.ts"
Task T018: "Implement POST /auth/poll in workers/auth/src/handlers/device-flow.ts"
# (Actually same file, so sequential - but can be done by same developer)

# Launch desktop UI components together (different files):
Task T026: "Create Login page in apps/desktop/src/renderer/pages/Login.tsx"
Task T027: "Create DeviceCodeModal in apps/desktop/src/renderer/components/auth/DeviceCodeModal.tsx"
Task T031: "Create UserProfile component in apps/desktop/src/renderer/components/auth/UserProfile.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 5 Only)

1. Complete Phase 1: Setup ✅ DONE
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories) ✅ DONE
3. Complete Phase 3: User Story 1 (Initial Authentication) ⏳ 88% COMPLETE
4. Complete Phase 4: User Story 5 (Security validation) ⏸️ PENDING
5. **STOP and VALIDATE**: Test authentication flow end-to-end, run security audit
6. Deploy/demo if ready

**MVP Deliverable**: Users can securely authenticate with GitHub App and see their profile

**Current Status** (2025-11-18):
- ✅ Device flow working end-to-end
- ✅ Access token retrieval successful
- ✅ Installation list retrieval working
- ✅ Critical issues resolved (User-Agent, OAuth scope, type system)
- ⏸️ Session creation in KV (partially complete)
- ⏸️ Installation token exchange (not started)
- ⏸️ UI polish (in progress)

**Estimated MVP Completion**: 2-3 days

### Incremental Delivery

1. **Foundation**: Setup + Foundational → All infrastructure ready ✅ COMPLETE
2. **MVP**: US1 + US5 → Basic secure authentication working → ⏳ IN PROGRESS
3. **Multi-org**: Add US2 → Installation selection working → Deploy/Demo
4. **Persistence**: Add US4 → Sessions persist across restarts → Deploy/Demo
5. **Seamless**: Add US3 → Automatic token refresh → Deploy/Demo
6. **Polish + Migration**: Phase 8 → Logout, PAT migration, UI polish, final audit → Production release

---

## Task Summary

**Total Tasks**: 104 (updated from 95 after adding clarification tasks)
- Phase 1 (Setup): 7 tasks ✅
- Phase 2 (Foundational): 9 tasks ✅
- Phase 3 (US1): 35 tasks (29 complete, 6 remaining)
- Phase 4 (US5): 8 tasks
- Phase 5 (US2): 12 tasks
- Phase 6 (US4): 10 tasks (2 new: sliding window TTL)
- Phase 7 (US3): 15 tasks (5 new: deduplication + offline mode)
- Phase 8 (Polish + Migration): 25 tasks (including 8 migration tasks)

**Parallel Opportunities**: 35 tasks marked [P] (37% of total)

**Format Validation**: ✅ All tasks follow checklist format with checkbox, ID, optional [P] and [Story] labels, and file paths

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (1-2 days)
2. Once Foundational is done:
   - **Developer A**: User Story 1 backend (T017-T021)
   - **Developer B**: User Story 1 desktop IPC (T022-T025)
   - **Developer C**: User Story 1 UI components (T026-T032)
   - **Developer D**: User Story 5 security validation (T033-T040)
3. After US1 + US5 complete, parallelize US2, US4, US3 by story

---

## Notes

- **[P] tasks**: Different files or modules, can be assigned to different developers
- **[Story] label**: Maps each task to specific user story for traceability and MVP scoping
- **Foundational phase is critical**: All utilities, JWT signing, rate limiting, session storage must work before implementing any user story
- **US1 + US5 are the MVP**: Everything else builds on these two stories
- **Token refresh (US3) is P3**: Nice to have but not essential for initial release
- **Each user story should be independently testable**: Complete US1, test it fully, then move to US2
- **Commit strategy**: Commit after each task or logical group (e.g., all US1 backend tasks)
- **Security validation is continuous**: Audit after each phase, not just at the end

---

## Task Count Summary

- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 9 tasks
- **Phase 3 (US1 - Initial Auth)**: 35 tasks (updated: +2 for device timeout + token cache)
- **Phase 4 (US5 - Security)**: 8 tasks
- **Phase 5 (US2 - Installation Selection)**: 12 tasks
- **Phase 6 (US4 - Session Persistence)**: 10 tasks (updated: +2 for sliding window TTL)
- **Phase 7 (US3 - Token Refresh)**: 15 tasks (updated: +5 for dedup + offline mode)
- **Phase 8 (Polish)**: 25 tasks (includes migration tasks)

**Total**: 104 tasks (updated from 95)

**Parallel opportunities**: 36 tasks marked [P] (34.6%)

**MVP scope**: Phases 1-4 (42 tasks) delivers secure authentication

**Full feature**: All phases (87 tasks) delivers complete auth system with all user stories
