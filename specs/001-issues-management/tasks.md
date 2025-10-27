# Tasks: GitHub Issues Management App

**Input**: Design documents from `/specs/001-issues-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ipc.md

**Tests**: Tests are explicitly included as the specification requires comprehensive test coverage (Vitest for unit, Playwright for E2E and IPC contracts).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project uses monorepo workspace structure:
- Desktop app: `apps/desktop/src/`
- Shared types: `packages/shared/src/`
- GitHub API: `packages/github-api/src/`
- Tests: `tests/` (contract, integration, unit)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and workspace configuration

- [X] T001 Install Electron dependencies in apps/desktop/package.json (electron, electron-builder, electron-reload)
- [X] T002 [P] Install React dependencies in apps/desktop/package.json (react, react-dom, react-router-dom, @types/react)
- [X] T003 [P] Install Tailwind CSS and configure in apps/desktop/tailwind.config.js
- [X] T004 [P] Install Tiptap editor dependencies (@tiptap/react, @tiptap/starter-kit, @tiptap/extension-task-list, @tiptap/extension-table, tiptap-markdown)
- [X] T005 [P] Install other UI dependencies (react-markdown, remark-gfm, recharts, @primer/css)
- [X] T006 [P] Install data dependencies (better-sqlite3, electron-store)
- [X] T007 [P] Configure Vite for Electron in apps/desktop/vite.config.ts (main, preload, renderer)
- [X] T008 [P] Setup TypeScript configuration in apps/desktop/tsconfig.json (extends shared config)
- [X] T009 [P] Configure ESLint and Prettier in .eslintrc.js and .prettierrc
- [X] T010 Create Electron main entry point in apps/desktop/src/main/index.ts (app lifecycle, window creation)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Type System

- [X] T011 [P] Define core types in packages/shared/src/types/issue.ts (Issue, IssueState, SyncStatus)
- [X] T012 [P] Define Label types in packages/shared/src/types/label.ts (Label, LabelColor)
- [X] T013 [P] Define Repository types in packages/shared/src/types/repository.ts (Repository, RepositoryConfig)
- [X] T014 [P] Define Settings types in packages/shared/src/types/settings.ts (AppSettings, ViewPreferences)
- [X] T015 [P] Define Sync types in packages/shared/src/types/sync.ts (SyncQueue, ConflictResolution)
- [X] T016 [P] Define IPC API types in packages/shared/src/types/ipc.ts (IpcApi, all request/response interfaces)

### Zod Schemas

- [X] T017 [P] Create Issue schema in packages/shared/src/schemas/issue.schema.ts
- [X] T018 [P] Create Label schema in packages/shared/src/schemas/label.schema.ts
- [X] T019 [P] Create Settings schema in packages/shared/src/schemas/settings.schema.ts
- [X] T020 [P] Create IPC request/response schemas in packages/shared/src/schemas/ipc.schema.ts

### Database Infrastructure

- [X] T021 Create SQLite schema definitions in apps/desktop/src/main/database/schemas/initial.sql (issues, labels, issue_labels, sync_queue, _meta tables)
- [X] T022 Implement DatabaseManager in apps/desktop/src/main/database/manager.ts (multi-repo connection management, migrations)
- [X] T023 [P] Create Issue repository in apps/desktop/src/main/database/repositories/issues.ts (CRUD operations, filtering)
- [X] T024 [P] Create Label repository in apps/desktop/src/main/database/repositories/labels.ts (CRUD operations)
- [X] T025 [P] Create SyncQueue repository in apps/desktop/src/main/database/repositories/sync-queue.ts (queue operations)

### IPC Bridge

- [X] T026 Implement preload script in apps/desktop/src/preload/index.ts (contextBridge setup, type-safe API exposure)
- [X] T027 Create IPC client utility in apps/desktop/src/renderer/src/services/ipc.ts (type-safe wrapper for renderer)

### GitHub API Abstraction

- [X] T028 [P] Create Octokit client wrapper in packages/github-api/src/client.ts (authentication, rate limiting)
- [X] T029 [P] Implement Issues API in packages/github-api/src/issues.ts (list, get, create, update, delete)
- [X] T030 [P] Implement Labels API in packages/github-api/src/labels.ts (list, create, update, delete)
- [X] T031 [P] Implement rate limit tracker in packages/github-api/src/rate-limit.ts (header parsing, warning threshold)

### Security & Settings

- [X] T032 Implement secure token storage in apps/desktop/src/main/security/keychain.ts (electron-store with OS keychain)
- [X] T033 Create settings manager in apps/desktop/src/main/settings/manager.ts (electron-store wrapper, repository management)

### UI Foundation

- [X] T034 Create main App component in apps/desktop/src/renderer/src/App.tsx (routing, theme provider)
- [X] T035 [P] Create Layout component in apps/desktop/src/renderer/src/components/common/Layout.tsx (sidebar, header)
- [X] T036 [P] Create Sidebar navigation in apps/desktop/src/renderer/src/components/common/Sidebar.tsx (Dashboard, Issues, Labels, Settings)
- [X] T037 [P] Create ThemeProvider in apps/desktop/src/renderer/src/components/common/ThemeProvider.tsx (light/dark mode)
- [X] T038 [P] Setup Tailwind globals in apps/desktop/src/renderer/src/styles/globals.css (Primer CSS imports, Tiptap styling)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Issue Management (Priority: P1) 🎯 MVP

**Goal**: Users can create, edit, delete, and view GitHub issues with markdown support (code/preview modes)

**Independent Test**: Connect to test repository, create issue with markdown body, edit title/body, toggle code/preview modes, delete issue - verify changes sync to GitHub

### IPC Handlers for User Story 1

- [X] T039 [P] [US1] Implement issues.list IPC handler in apps/desktop/src/main/ipc/issues.ts (pagination, filtering, validation)
- [X] T040 [P] [US1] Implement issues.get IPC handler in apps/desktop/src/main/ipc/issues.ts
- [X] T041 [P] [US1] Implement issues.create IPC handler in apps/desktop/src/main/ipc/issues.ts (local-first, queue for sync)
- [X] T042 [P] [US1] Implement issues.update IPC handler in apps/desktop/src/main/ipc/issues.ts (conflict detection)
- [X] T043 [P] [US1] Implement issues.delete IPC handler in apps/desktop/src/main/ipc/issues.ts (soft delete, queue)

### React Hooks for User Story 1

- [X] T044 [P] [US1] Create useIssues hook in apps/desktop/src/renderer/src/hooks/useIssues.ts (list, pagination, filters)
- [X] T045 [P] [US1] Create useIssue hook in apps/desktop/src/renderer/src/hooks/useIssue.ts (single issue CRUD)

### UI Components for User Story 1

- [X] T046 [US1] Create Issues page in apps/desktop/src/renderer/src/pages/Issues.tsx (layout, filter bar, issue list)
- [X] T047 [P] [US1] Create IssueList component in apps/desktop/src/renderer/src/components/issue/IssueList.tsx (table view with pagination)
- [X] T048 [P] [US1] Create IssueCard component in apps/desktop/src/renderer/src/components/issue/IssueCard.tsx (card view)
- [X] T049 [P] [US1] Create IssueFilters component in apps/desktop/src/renderer/src/components/issue/IssueFilters.tsx (search, state filter)
- [X] T050 [US1] Create MarkdownEditor component in apps/desktop/src/renderer/src/components/markdown/MarkdownEditor.tsx (Tiptap with code/preview toggle)
- [X] T051 [US1] Create IssueEditor component in apps/desktop/src/renderer/src/components/issue/IssueEditor.tsx (modal form with MarkdownEditor)
- [X] T052 [P] [US1] Create ViewToggle component in apps/desktop/src/renderer/src/components/common/ViewToggle.tsx (list/card switch)

### Tests for User Story 1

- [X] T053 [P] [US1] IPC contract test for issues.list in tests/contract/issues.spec.ts (validates Issue[] response)
- [X] T054 [P] [US1] IPC contract test for issues.create in tests/contract/issues.spec.ts (validates title required, body optional)
- [X] T055 [P] [US1] IPC contract test for issues.update in tests/contract/issues.spec.ts
- [X] T056 [P] [US1] E2E test for issue creation flow in tests/e2e/issue-management.spec.ts (Playwright)
- [X] T057 [P] [US1] E2E test for markdown code/preview toggle in tests/e2e/markdown-editor.spec.ts

**Checkpoint**: User Story 1 complete - can create, edit, delete issues with markdown support

---

## Phase 4: User Story 2 - Issue Filtering and Display (Priority: P2)

**Goal**: Users can filter issues by label/title/status and switch between list and card view layouts

**Independent Test**: Create issues with different labels and states, apply filters, verify only matching issues displayed, switch views and verify preference persists

### IPC Handlers for User Story 2

- [ ] T058 [US2] Extend issues.list handler to support label filtering in apps/desktop/src/main/ipc/issues.ts
- [ ] T059 [P] [US2] Implement settings.update IPC handler in apps/desktop/src/main/ipc/settings.ts (view preferences)

### React Hooks for User Story 2

- [ ] T060 [US2] Extend useIssues hook with filter state management in apps/desktop/src/renderer/src/hooks/useIssues.ts
- [ ] T061 [P] [US2] Create useSettings hook in apps/desktop/src/renderer/src/hooks/useSettings.ts (theme, view preferences)

### UI Components for User Story 2

- [ ] T062 [US2] Extend IssueFilters component with label multi-select in apps/desktop/src/renderer/src/components/issue/IssueFilters.tsx
- [ ] T063 [US2] Wire ViewToggle to persist preference in apps/desktop/src/renderer/src/components/common/ViewToggle.tsx

### Tests for User Story 2

- [ ] T064 [P] [US2] IPC contract test for issues.list with filters in tests/contract/issues.spec.ts
- [ ] T065 [P] [US2] E2E test for filtering workflow in tests/e2e/issue-filtering.spec.ts (apply label filter, clear filter)
- [ ] T066 [P] [US2] E2E test for view preference persistence in tests/e2e/view-toggle.spec.ts

**Checkpoint**: User Stories 1 AND 2 complete - can filter and switch views

---

## Phase 5: User Story 3 - Label Management (Priority: P3)

**Goal**: Users can create, edit, and view labels with custom colors and descriptions

**Independent Test**: Create label with name/color, edit label, verify changes on GitHub, delete label and verify removed from issues

### IPC Handlers for User Story 3

- [X] T067 [P] [US3] Implement labels.list IPC handler in apps/desktop/src/main/ipc/labels.ts
- [X] T068 [P] [US3] Implement labels.create IPC handler in apps/desktop/src/main/ipc/labels.ts
- [X] T069 [P] [US3] Implement labels.update IPC handler in apps/desktop/src/main/ipc/labels.ts
- [X] T070 [P] [US3] Implement labels.delete IPC handler in apps/desktop/src/main/ipc/labels.ts

### React Hooks for User Story 3

- [X] T071 [US3] Create useLabels hook in apps/desktop/src/renderer/src/hooks/useLabels.ts (list, CRUD operations)

### UI Components for User Story 3

- [X] T072 [US3] Create Labels page in apps/desktop/src/renderer/src/pages/Labels.tsx (layout, label list)
- [X] T073 [P] [US3] Create LabelList component in apps/desktop/src/renderer/src/components/label/LabelList.tsx (table view)
- [X] T074 [P] [US3] Create LabelCard component in apps/desktop/src/renderer/src/components/label/LabelCard.tsx (card view with color preview)
- [X] T075 [US3] Create LabelEditor component in apps/desktop/src/renderer/src/components/label/LabelEditor.tsx (modal form with color picker)

### Tests for User Story 3

- [X] T076 [P] [US3] IPC contract test for labels.list in tests/contract/labels.spec.ts
- [X] T077 [P] [US3] IPC contract test for labels.create in tests/contract/labels.spec.ts (validate hex color format)
- [X] T078 [P] [US3] E2E test for label creation in tests/e2e/label-management.spec.ts

**Checkpoint**: User Stories 1, 2, AND 3 complete - can manage labels

---

## Phase 6: User Story 4 - Dashboard Analytics (Priority: P4)

**Goal**: Users can view analytics and statistics about issues and labels (total counts, open/closed ratio, 7/30 day trends, label distribution)

**Independent Test**: Create various issues with different labels and dates, verify dashboard displays accurate counts, trend charts, and label distribution

### IPC Handlers for User Story 4

- [ ] T079 [US4] Implement analytics.getDashboard IPC handler in apps/desktop/src/main/ipc/analytics.ts (aggregate SQLite queries for summary, trends, distribution)

### React Hooks for User Story 4

- [ ] T080 [US4] Create useAnalytics hook in apps/desktop/src/renderer/src/hooks/useAnalytics.ts (fetch dashboard data)

### UI Components for User Story 4

- [ ] T081 [US4] Create Dashboard page in apps/desktop/src/renderer/src/pages/Dashboard.tsx (grid layout for charts)
- [ ] T082 [P] [US4] Create StatsCard component in apps/desktop/src/renderer/src/components/dashboard/StatsCard.tsx (total, open, closed counts)
- [ ] T083 [P] [US4] Create TrendChart component in apps/desktop/src/renderer/src/components/dashboard/TrendChart.tsx (Recharts LineChart for 7/30 day trends)
- [ ] T084 [P] [US4] Create LabelDistributionChart component in apps/desktop/src/renderer/src/components/dashboard/LabelDistributionChart.tsx (Recharts PieChart)

### Tests for User Story 4

- [ ] T085 [P] [US4] IPC contract test for analytics.getDashboard in tests/contract/analytics.spec.ts
- [ ] T086 [P] [US4] E2E test for dashboard data accuracy in tests/e2e/dashboard.spec.ts (verify counts match created issues)

**Checkpoint**: User Stories 1-4 complete - dashboard displays analytics

---

## Phase 7: User Story 5 - Settings Configuration (Priority: P5)

**Goal**: Users can configure GitHub repository connection, editor preferences, and theme

**Independent Test**: Enter GitHub token and repository, connect successfully, switch theme, change editor mode, verify settings persist across app restarts

### IPC Handlers for User Story 5

- [ ] T087 [P] [US5] Implement settings.get IPC handler in apps/desktop/src/main/ipc/settings.ts
- [ ] T088 [P] [US5] Implement settings.setRepository IPC handler in apps/desktop/src/main/ipc/settings.ts (create new SQLite DB, add to repositories list)
- [ ] T089 [P] [US5] Implement settings.switchRepository IPC handler in apps/desktop/src/main/ipc/settings.ts
- [ ] T090 [P] [US5] Implement settings.getToken IPC handler in apps/desktop/src/main/ipc/settings.ts (return preview only)
- [ ] T091 [P] [US5] Implement settings.setToken IPC handler in apps/desktop/src/main/ipc/settings.ts (store in keychain)

### UI Components for User Story 5

- [ ] T092 [US5] Create Settings page in apps/desktop/src/renderer/src/pages/Settings.tsx (tabs for GitHub, Editor, Appearance)
- [ ] T093 [US5] Extend ThemeProvider to apply theme immediately in apps/desktop/src/renderer/src/components/common/ThemeProvider.tsx

### Tests for User Story 5

- [ ] T094 [P] [US5] IPC contract test for settings.setRepository in tests/contract/settings.spec.ts
- [ ] T095 [P] [US5] E2E test for repository connection in tests/e2e/settings.spec.ts (enter token, connect, verify issues load)
- [ ] T096 [P] [US5] E2E test for theme switching in tests/e2e/theme.spec.ts (toggle dark mode, verify UI updates)

**Checkpoint**: All 5 user stories complete - full application functional

---

## Phase 8: Sync Engine Implementation

**Goal**: Background sync with GitHub, conflict detection, and rate limit handling

**Independent Test**: Make changes offline, reconnect, verify sync queue processes, trigger conflict by editing same issue remotely, verify conflict UI appears

### Sync Core

- [ ] T097 Create sync engine orchestrator in apps/desktop/src/main/sync/engine.ts (process queue, sequential sync)
- [ ] T098 [P] Implement conflict detector in apps/desktop/src/main/sync/conflict.ts (compare timestamps, generate diff)
- [ ] T099 [P] Implement rate limit handler in apps/desktop/src/main/sync/rate-limit.ts (queue retry logic, emit warnings)

### IPC Handlers for Sync

- [ ] T100 [P] Implement sync.start IPC handler in apps/desktop/src/main/ipc/sync.ts
- [ ] T101 [P] Implement sync.getStatus IPC handler in apps/desktop/src/main/ipc/sync.ts
- [ ] T102 [P] Implement sync.resolveConflict IPC handler in apps/desktop/src/main/ipc/sync.ts

### React Hooks for Sync

- [ ] T103 Create useSync hook in apps/desktop/src/renderer/src/hooks/useSync.ts (sync status, trigger sync, listen for events)

### UI Components for Sync

- [ ] T104 Create ConflictModal component in apps/desktop/src/renderer/src/components/sync/ConflictModal.tsx (side-by-side diff, resolution buttons)
- [ ] T105 [P] Create SyncStatusIndicator component in apps/desktop/src/renderer/src/components/sync/SyncStatusIndicator.tsx (status bar indicator)

### Tests for Sync

- [ ] T106 [P] IPC contract test for sync.getStatus in tests/contract/sync.spec.ts
- [ ] T107 [P] E2E test for sync queue processing in tests/e2e/sync.spec.ts (create issue offline, go online, verify synced)
- [ ] T108 E2E test for conflict resolution in tests/e2e/conflict.spec.ts (simulate conflict, resolve, verify GitHub updated)

**Checkpoint**: Sync engine complete - offline-first architecture functional

---

## Phase 9: System Integration & Error Handling

**Goal**: External link opening, version display, error boundaries, and edge case handling

### IPC Handlers for System

- [ ] T109 [P] Implement system.openExternal IPC handler in apps/desktop/src/main/ipc/system.ts (shell.openExternal for GitHub links)
- [ ] T110 [P] Implement system.getVersion IPC handler in apps/desktop/src/main/ipc/system.ts

### UI Components for System

- [ ] T111 [P] Create ErrorBoundary component in apps/desktop/src/renderer/src/components/common/ErrorBoundary.tsx
- [ ] T112 [P] Create Toast notification system in apps/desktop/src/renderer/src/components/common/Toast.tsx (sync errors, rate limit warnings)

### Edge Case Handling

- [ ] T113 Handle empty repository state in apps/desktop/src/renderer/src/pages/Issues.tsx (no issues yet)
- [ ] T114 Handle GitHub API unavailable in packages/github-api/src/client.ts (queue operations)
- [ ] T115 Handle invalid token in apps/desktop/src/main/ipc/settings.ts (clear token, emit token:invalid event)
- [ ] T116 Handle extremely long issue titles/bodies in apps/desktop/src/renderer/src/components/issue/IssueCard.tsx (truncation)

### Tests for System

- [ ] T117 [P] E2E test for external link opening in tests/e2e/system.spec.ts (click GitHub link, verify browser opens)
- [ ] T118 [P] E2E test for error handling in tests/e2e/errors.spec.ts (invalid token, network error)

**Checkpoint**: System integration complete - robust error handling in place

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and production readiness

- [ ] T119 [P] Update README.md with feature overview, screenshots, installation instructions
- [ ] T120 [P] Add keyboard shortcuts in apps/desktop/src/renderer/src/App.tsx (Cmd+N for new issue, Cmd+K for search)
- [ ] T121 [P] Implement loading skeletons in apps/desktop/src/renderer/src/components/common/Skeleton.tsx
- [ ] T122 [P] Add accessibility labels (aria-label) to all interactive components
- [ ] T123 [P] Optimize bundle size by lazy loading routes in apps/desktop/src/renderer/src/App.tsx (React.lazy)
- [ ] T124 Configure electron-builder for production packaging in apps/desktop/electron-builder.json (icons, code signing)
- [ ] T125 [P] Add GitHub Actions workflow for CI/CD in .github/workflows/ci.yml (test, build, release)
- [ ] T126 [P] Security audit with npm audit and fix vulnerabilities
- [ ] T127 Run quickstart.md validation (install, test, package)
- [ ] T128 Performance profiling for 1000+ issues in apps/desktop/src/main/database/repositories/issues.ts (verify <100ms filter)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Issue Management): Can start after Foundational
  - US2 (Filtering): Depends on US1 (extends issue list)
  - US3 (Labels): Independent of US1/US2, can start after Foundational
  - US4 (Dashboard): Depends on US1 (needs issues for analytics), can include US3 (label distribution)
  - US5 (Settings): Independent, can start after Foundational
- **Sync Engine (Phase 8)**: Depends on US1 (needs issue CRUD), US3 (needs label CRUD)
- **System Integration (Phase 9)**: Depends on all core features
- **Polish (Phase 10)**: Depends on all desired features being complete

### User Story Dependencies

- **User Story 1 (P1)**: Issue Management - No dependencies on other stories ✅ MVP
- **User Story 2 (P2)**: Filtering - Extends US1 issue list
- **User Story 3 (P3)**: Label Management - Independent, can run parallel with US1/US2
- **User Story 4 (P4)**: Dashboard Analytics - Needs US1 (issues), benefits from US3 (labels)
- **User Story 5 (P5)**: Settings - Independent, can run parallel with other stories

### Within Each User Story

- IPC handlers before React hooks (hooks call IPC)
- React hooks before UI components (components use hooks)
- Core implementation before tests (tests validate implementation)
- Story complete before moving to next priority

### Parallel Opportunities

#### Setup Phase (Phase 1)
All tasks marked [P] can run in parallel:
- T002, T003, T004, T005, T006 (dependency installation)
- T007, T008, T009 (configuration files)

#### Foundational Phase (Phase 2)
- All type definitions (T011-T016) can run in parallel
- All Zod schemas (T017-T020) can run in parallel
- All database repositories (T023-T025) can run in parallel
- All GitHub API implementations (T028-T031) can run in parallel

#### User Story 1 (Phase 3)
- All IPC handlers (T039-T043) can run in parallel
- All React hooks (T044-T045) can run in parallel
- All UI components (T047-T049) can run in parallel
- All tests (T053-T057) can run in parallel

#### Across User Stories (with team capacity)
After Foundational phase completes:
- US3 (Labels) can run parallel with US1 (Issues)
- US5 (Settings) can run parallel with US1/US3

---

## Parallel Example: User Story 1

```bash
# Launch all IPC handlers together:
Task: "Implement issues.list IPC handler"
Task: "Implement issues.get IPC handler"
Task: "Implement issues.create IPC handler"
Task: "Implement issues.update IPC handler"
Task: "Implement issues.delete IPC handler"

# Launch all React hooks together:
Task: "Create useIssues hook"
Task: "Create useIssue hook"

# Launch all UI components together:
Task: "Create IssueList component"
Task: "Create IssueCard component"
Task: "Create IssueFilters component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T038) - CRITICAL
3. Complete Phase 3: User Story 1 (T039-T057)
4. **STOP and VALIDATE**: Test issue CRUD with markdown editor
5. Deploy/demo MVP

**MVP Deliverable**: Desktop app that can create, edit, delete GitHub issues with Tiptap markdown editor (code/preview modes)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Issue Management) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Filtering) → Test independently → Deploy/Demo
4. Add US3 (Labels) → Test independently → Deploy/Demo
5. Add US4 (Dashboard) → Test independently → Deploy/Demo
6. Add US5 (Settings) → Test independently → Deploy/Demo
7. Add Sync Engine → Test offline/online scenarios → Deploy/Demo
8. Polish & Release

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (CRITICAL - blocks everything)
2. **Once Foundational is done**:
   - Developer A: US1 (Issue Management) - P1 priority
   - Developer B: US3 (Label Management) - Independent
   - Developer C: US5 (Settings) - Independent
3. **Sequential after US1**:
   - Developer A: US2 (Filtering) - Extends US1
4. **After US1 + US3**:
   - Any developer: US4 (Dashboard) - Needs both
5. **After all user stories**:
   - Any developer: Sync Engine (Phase 8)
   - Any developer: System Integration (Phase 9)
6. **Final**:
   - Team: Polish (Phase 10)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Constitution compliance**: All dependencies justified in research.md, bundle size ~90MB < 100MB limit
- **Performance targets**: SQLite queries <100ms, markdown render <200ms, app launch <3s
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Total Task Count: 128 tasks

- Setup: 10 tasks
- Foundational: 28 tasks
- User Story 1 (Issue Management): 19 tasks
- User Story 2 (Filtering): 9 tasks
- User Story 3 (Labels): 12 tasks
- User Story 4 (Dashboard): 8 tasks
- User Story 5 (Settings): 9 tasks
- Sync Engine: 12 tasks
- System Integration: 10 tasks
- Polish: 10 tasks

**MVP Scope** (US1 only): 57 tasks (Setup + Foundational + US1)
**Full Feature Set**: 128 tasks
