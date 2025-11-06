# Tasks: GitHub App Authorization with Cloudflare Worker Backend

**Input**: Design documents from `/specs/002-github-app-auth/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in feature specification - tasks focus on implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and desktop app

- [ ] T001 Create Cloudflare Worker project structure in `workers/auth/`
- [ ] T002 Initialize Worker with `wrangler.toml` configuration (KV namespaces, environment variables)
- [ ] T003 [P] Create shared auth types in `packages/shared/src/types/auth.ts` (User, Installation, UserSession, InstallationToken, Account)
- [ ] T004 [P] Create shared auth Zod schemas in `packages/shared/src/schemas/auth.schema.ts` (UserSchema, InstallationSchema, UserSessionSchema, etc.)
- [ ] T005 [P] Add electron-store dependency to `apps/desktop/package.json` for encrypted storage
- [ ] T006 [P] Configure TypeScript for Worker project in `workers/auth/tsconfig.json`
- [ ] T007 Update desktop app preload script in `apps/desktop/src/main/preload.ts` to add auth IPC bridge stub

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Create Worker utility for rate limiting in `workers/auth/src/utils/rate-limit.ts` (5 req/min/user, KV-based)
- [ ] T009 [P] Create Worker utility for retry logic in `workers/auth/src/utils/retry.ts` (3 attempts, exponential backoff: 1s, 2s, 4s)
- [ ] T010 [P] Create Worker utility for error handling in `workers/auth/src/utils/errors.ts` (ErrorResponse schema, error codes)
- [ ] T011 [P] Create Worker JWT generator in `workers/auth/src/auth/jwt.ts` (Web Crypto API, GitHub App JWT signing)
- [ ] T012 [P] Create Worker GitHub API client in `workers/auth/src/auth/github.ts` (device flow, user info, installations API wrapper)
- [ ] T013 Create Worker KV session storage in `workers/auth/src/storage/sessions.ts` (BackendSession CRUD, 30-day TTL)
- [ ] T014 Create desktop IPC auth handlers stub in `apps/desktop/src/main/ipc/auth.ts` (empty handler functions)
- [ ] T015 [P] Create desktop auth service in `apps/desktop/src/renderer/services/auth.service.ts` (IPC wrapper for renderer)
- [ ] T016 Setup electron-store configuration in `apps/desktop/src/main/storage/auth-store.ts` (encryption enabled, schema validation)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initial Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to authenticate via GitHub App device flow and obtain a valid session

**Independent Test**: User clicks "Login with GitHub", sees device code modal, completes authorization on GitHub, and returns to app with authenticated session displaying their profile

### Implementation for User Story 1

#### Backend: Device Flow & Session Creation

- [ ] T017 [P] [US1] Implement POST /auth/device endpoint in `workers/auth/src/handlers/device-flow.ts` (calls GitHub device flow API, returns device_code and user_code)
- [ ] T018 [P] [US1] Implement POST /auth/poll endpoint in `workers/auth/src/handlers/device-flow.ts` (polls GitHub for authorization, creates BackendSession on success)
- [ ] T019 [US1] Add request validation middleware to device flow handlers (Zod schema validation for PollRequest)
- [ ] T020 [US1] Implement session token generation in `workers/auth/src/storage/sessions.ts` (crypto.getRandomValues for 64-byte tokens)
- [ ] T021 [US1] Add error handling to device flow handlers (GITHUB_API_ERROR, RATE_LIMIT, ACCESS_DENIED, SLOW_DOWN)

#### Desktop: IPC Handlers

- [ ] T022 [P] [US1] Implement auth:github-login IPC handler in `apps/desktop/src/main/ipc/auth.ts` (calls backend /auth/device, opens browser, starts polling)
- [ ] T023 [US1] Add polling logic to auth:github-login handler (5-second intervals, 15-minute timeout, exponential backoff on 429)
- [ ] T024 [US1] Implement session storage on successful login in `apps/desktop/src/main/ipc/auth.ts` (save UserSession to electron-store)
- [ ] T025 [US1] Add event emitters to auth handler (auth:user-code, auth:login-success, auth:login-error)

#### Desktop: UI Components

- [ ] T026 [P] [US1] Create Login page in `apps/desktop/src/renderer/pages/Login.tsx` (login button, loading state)
- [ ] T027 [P] [US1] Create DeviceCodeModal component in `apps/desktop/src/renderer/components/auth/DeviceCodeModal.tsx` (displays user_code, copy button, verification link)
- [ ] T028 [US1] Add auth service methods in `apps/desktop/src/renderer/services/auth.service.ts` (githubLogin, event subscriptions)
- [ ] T029 [US1] Connect Login page to auth service (handle login click, show modal on auth:user-code event)
- [ ] T030 [US1] Add error handling to Login page (display LoginErrorEvent messages with retry button)

#### Desktop: Session Display

- [ ] T031 [P] [US1] Create user profile component in `apps/desktop/src/renderer/components/auth/UserProfile.tsx` (avatar, name, login)
- [ ] T032 [US1] Update app layout to show user profile after successful login in `apps/desktop/src/renderer/App.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional - users can authenticate and see their profile

---

## Phase 4: User Story 5 - Security and Secret Management (Priority: P1)

**Goal**: Ensure all sensitive credentials are backend-only, never exposed to client

**Independent Test**: Security audit shows private key and client secret only in Cloudflare Worker environment variables, client only stores short-lived tokens

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

**Independent Test**: User sees list of installations after login, selects one, and subsequent API calls use that installation's token

### Implementation for User Story 2

#### Backend: Installation & Token APIs

- [ ] T041 [P] [US2] Implement POST /auth/installations endpoint in `workers/auth/src/handlers/installations.ts` (fetch user's installations from GitHub)
- [ ] T042 [P] [US2] Implement POST /auth/installation-token endpoint in `workers/auth/src/handlers/tokens.ts` (exchange installation_id for access token)
- [ ] T043 [US2] Add session token validation middleware in `workers/auth/src/middleware/auth.ts` (validate X-Session-Token header)
- [ ] T044 [US2] Add installation ownership verification in `workers/auth/src/handlers/tokens.ts` (ensure installation belongs to user)
- [ ] T045 [US2] Implement rate limiting for token endpoints (apply 5 req/min/user limit to /auth/installation-token)

#### Desktop: IPC Handlers

- [ ] T046 [P] [US2] Implement auth:select-installation IPC handler in `apps/desktop/src/main/ipc/auth.ts` (call backend, store token)
- [ ] T047 [US2] Update UserSession storage to include currentInstallation and installationToken in electron-store
- [ ] T048 [US2] Add validation for installation selection (check installation exists in user's list before calling backend)

#### Desktop: UI Components

- [ ] T049 [P] [US2] Create InstallationSelect page in `apps/desktop/src/renderer/pages/InstallationSelect.tsx` (list installations with avatars, names)
- [ ] T050 [US2] Add installation selection logic to InstallationSelect (call auth.selectInstallation, navigate on success)
- [ ] T051 [US2] Create installation switcher dropdown in `apps/desktop/src/renderer/components/auth/InstallationSwitcher.tsx` (show current installation, allow switching)
- [ ] T052 [US2] Add installation switcher to app header in `apps/desktop/src/renderer/App.tsx`

**Checkpoint**: Users can select installations and switch between them without re-authenticating

---

## Phase 6: User Story 4 - Session Persistence (Priority: P2)

**Goal**: Users remain logged in across app restarts

**Independent Test**: User authenticates, closes app, reopens hours later, and is automatically logged in without re-entering credentials

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

**Checkpoint**: Session persistence working - users stay logged in across restarts for up to 30 days

---

## Phase 7: User Story 3 - Automatic Token Refresh (Priority: P3)

**Goal**: Access tokens refresh automatically before expiration without user intervention

**Independent Test**: User works in app for >1 hour, token refreshes automatically at 55-minute mark, no interruption to workflow

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

**Checkpoint**: Token refresh working automatically - users experience no interruptions from token expiry

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

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Initial Authentication)
4. Complete Phase 4: User Story 5 (Security validation)
5. **STOP and VALIDATE**: Test authentication flow end-to-end, run security audit
6. Deploy/demo if ready

**MVP Deliverable**: Users can securely authenticate with GitHub App and see their profile

### Incremental Delivery

1. **Foundation**: Setup + Foundational → All infrastructure ready
2. **MVP**: US1 + US5 → Basic secure authentication working → Deploy/Demo
3. **Multi-org**: Add US2 → Installation selection working → Deploy/Demo
4. **Persistence**: Add US4 → Sessions persist across restarts → Deploy/Demo
5. **Seamless**: Add US3 → Automatic token refresh → Deploy/Demo
6. **Polish**: Phase 8 → Logout, UI polish, final audit → Production release

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
- **Phase 3 (US1 - Initial Auth)**: 16 tasks
- **Phase 4 (US5 - Security)**: 8 tasks
- **Phase 5 (US2 - Installation Selection)**: 12 tasks
- **Phase 6 (US4 - Session Persistence)**: 8 tasks
- **Phase 7 (US3 - Token Refresh)**: 10 tasks
- **Phase 8 (Polish)**: 17 tasks

**Total**: 87 tasks

**Parallel opportunities**: 31 tasks marked [P] (35.6%)

**MVP scope**: Phases 1-4 (40 tasks) delivers secure authentication

**Full feature**: All phases (87 tasks) delivers complete auth system with all user stories
