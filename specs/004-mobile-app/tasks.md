# Implementation Tasks: IssueDesk Mobile App

**Branch**: `004-mobile-app` | **Generated**: 2026-02-01 | **Plan**: [plan.md](./plan.md)

## Overview

Implementation tasks for React Native/Expo mobile app. Organized into setup, foundational phases, then user stories by priority (P1 → P4).

**Tech Stack**: TypeScript 5.3+, React Native 0.81+, Expo SDK 54
**Key Dependencies**: @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs, expo-secure-store, react-native-markdown-display

---

## Phase 1: Setup

- [x] [T001] [P0] Initialize Expo project with TypeScript template (`apps/mobile/`)
- [x] [T002] [P0] Configure package.json with workspace dependencies (@issuedesk/shared, @issuedesk/github-api)
- [x] [T003] [P0] Update tsconfig.json for monorepo path aliases
- [x] [T004] [P0] Create base folder structure (`src/api/`, `src/components/`, `src/contexts/`, `src/hooks/`, `src/navigation/`, `src/screens/`, `src/services/`, `src/styles/`, `src/types/`)
- [x] [T005] [P0] Install and configure navigation packages (@react-navigation/native, native-stack, bottom-tabs)
- [x] [T006] [P0] Install expo-secure-store and expo-linking
- [x] [T007] [P0] Install react-native-markdown-display
- [x] [T008] [P0] Create theme system with light/dark mode support (`src/styles/theme.ts`)

---

## Phase 2: Foundational

- [x] [T009] [P0] Create secure storage service wrapper (`src/services/storage.ts`) - wraps expo-secure-store
- [x] [T010] [P0] Create API client adapter (`src/api/client.ts`) - wraps @issuedesk/github-api for React Native
- [x] [T011] [P0] Create AuthContext with session state management (`src/contexts/AuthContext.tsx`)
- [x] [T012] [P0] Create RepositoryContext for active repository state (`src/contexts/RepositoryContext.tsx`)
- [x] [T013] [P0] Create ThemeContext for light/dark mode (`src/contexts/ThemeContext.tsx`)
- [x] [T014] [P0] Create root App.tsx with context providers
- [x] [T015] [P0] Create AuthNavigator for login flow (`src/navigation/AuthNavigator.tsx`)
- [x] [T016] [P0] Create MainTabNavigator with bottom tabs (`src/navigation/MainTabNavigator.tsx`)
- [x] [T017] [P0] Create AppNavigator with conditional auth routing (`src/navigation/AppNavigator.tsx`)

---

## Phase 3: Authentication (US1 - P1)

- [x] [T018] [P1] [US1] Create auth service with device flow logic (`src/api/auth.ts`)
  - Implements FR-001, FR-004, FR-008
- [x] [T019] [P1] [US1] Create LoginScreen with "Login with GitHub" button (`src/screens/auth/LoginScreen.tsx`)
  - Implements FR-001
- [x] [T020] [P1] [US1] Create DeviceCodeScreen showing code and copy button (`src/screens/auth/DeviceCodeScreen.tsx`)
  - Implements FR-002, FR-003, FR-005
- [x] [T021] [P1] [US1] Implement device code polling with 15-minute timeout handling
  - Implements FR-004, FR-005
- [x] [T022] [P1] [US1] Create InstallAppScreen for users without GitHub App installation (`src/screens/auth/InstallAppScreen.tsx`)
  - Implements FR-006
- [x] [T023] [P1] [US1] Implement secure token storage using expo-secure-store
  - Implements FR-007, FR-009
- [x] [T024] [P1] [US1] Implement token refresh logic with 5-minute buffer
  - Implements FR-008
- [x] [T025] [P1] [US1] Add useAuth hook for authentication state access (`src/hooks/useAuth.ts`)

---

## Phase 4: Repository Selection (US2 - P1)

- [x] [T026] [P1] [US2] Create RepositorySelectScreen with repository list (`src/screens/settings/RepositorySelectScreen.tsx`)
  - Implements FR-010, FR-011
- [x] [T027] [P1] [US2] Implement repository list fetching from GitHub API
  - Implements FR-010
- [x] [T028] [P1] [US2] Persist selected repository in AsyncStorage
  - Implements FR-012
- [x] [T029] [P1] [US2] Auto-load previously selected repository on app start
  - Implements FR-012
- [x] [T030] [P1] [US2] Display current repository name in navigation header
  - Implements FR-014

---

## Phase 5: Issue List (US3 - P1)

- [x] [T031] [P1] [US3] Create IssueCard component (`src/components/issue/IssueCard.tsx`)
  - Shows title, labels (colored badges), state indicator
- [x] [T032] [P1] [US3] Create LabelBadge component (`src/components/label/LabelBadge.tsx`)
  - Renders colored label badge
- [x] [T033] [P1] [US3] Create IssueListScreen with FlatList (`src/screens/issues/IssueListScreen.tsx`)
  - Implements FR-015
- [x] [T034] [P1] [US3] Create useIssues hook for issue data fetching (`src/hooks/useIssues.ts`)
  - Implements FR-015, FR-016
- [x] [T035] [P1] [US3] Implement pull-to-refresh on issue list
  - Implements FR-016
- [x] [T036] [P1] [US3] Create search bar component and title search filtering
  - Implements FR-018
- [x] [T037] [P1] [US3] Create label filter selector with modal
  - Implements FR-017
- [x] [T038] [P1] [US3] Add "Clear Filters" button when filters active
- [x] [T039] [P1] [US3] Add loading and empty state indicators
  - Implements FR-023

---

## Phase 6: Issue Detail (US4 - P2)

- [x] [T040] [P2] [US4] Create IssueDetailScreen (`src/screens/issues/IssueDetailScreen.tsx`)
  - Implements FR-019
- [x] [T041] [P2] [US4] Integrate markdown rendering with react-native-markdown-display
  - Implements FR-019, handles images, code blocks, links
- [x] [T042] [P2] [US4] Display comments section below issue body
  - Implements FR-025
- [x] [T043] [P2] [US4] Create CommentCard component (`src/components/comment/CommentCard.tsx`)
  - Shows author, timestamp, rendered markdown
- [x] [T044] [P2] [US4] Create useComments hook for comment fetching (`src/hooks/useComments.ts`)
  - Implements FR-025
- [x] [T045] [P2] [US4] Add external link button to open in browser
  - Implements FR-022

---

## Phase 7: Create Issue (US5 - P2)

- [x] [T046] [P2] [US5] Create CreateIssueScreen with form (`src/screens/issues/CreateIssueScreen.tsx`)
  - Implements FR-020
- [x] [T047] [P2] [US5] Create IssueForm component with title and body inputs (`src/components/issue/IssueForm.tsx`)
- [x] [T048] [P2] [US5] Create label multi-select component for issue creation
  - Implements FR-020
- [x] [T049] [P2] [US5] Create useLabels hook for label fetching (`src/hooks/useLabels.ts`)
- [x] [T050] [P2] [US5] Implement issue creation API call
  - Implements FR-020
- [x] [T051] [P2] [US5] Add discard confirmation dialog when leaving form with changes
- [x] [T052] [P2] [US5] Add "+" FAB button on IssueListScreen to navigate to create
- [x] [T053] [P2] [US5] Display loading state during creation
  - Implements FR-023
- [x] [T054] [P2] [US5] Display error message on creation failure
  - Implements FR-024

---

## Phase 8: Edit Issue (US6 - P2)

- [x] [T055] [P2] [US6] Create EditIssueScreen (`src/screens/issues/EditIssueScreen.tsx`)
  - Implements FR-021
- [x] [T056] [P2] [US6] Add Edit button to IssueDetailScreen
- [x] [T057] [P2] [US6] Reuse IssueForm component for editing
- [x] [T058] [P2] [US6] Implement issue update API call
  - Implements FR-021
- [x] [T059] [P2] [US6] Add open/close state toggle on IssueDetailScreen
  - Implements FR-021

---

## Phase 9: Comments (US7 - P3)

- [x] [T060] [P3] [US7] Create CommentForm component (`src/components/comment/CommentForm.tsx`)
- [x] [T061] [P3] [US7] Add "Add Comment" button to IssueDetailScreen
  - Implements FR-026
- [x] [T062] [P3] [US7] Implement comment creation API call
  - Implements FR-026
- [x] [T063] [P3] [US7] Render markdown in comments
  - Implements FR-027

---

## Phase 10: Labels (US8 - P3)

- [x] [T064] [P3] [US8] Create LabelList component (`src/components/label/LabelList.tsx`)
- [x] [T065] [P3] [US8] Create LabelsScreen (`src/screens/labels/LabelsScreen.tsx`)
  - Implements FR-028
- [x] [T066] [P3] [US8] Display label name, color, and description
  - Implements FR-028
- [x] [T067] [P3] [US8] Navigate to filtered issues when tapping label
  - Implements FR-029

---

## Phase 11: Dashboard (US9 - P4)

- [x] [T068] [P4] [US9] Create DashboardScreen (`src/screens/dashboard/DashboardScreen.tsx`)
  - Implements FR-030, FR-031, FR-032
- [x] [T069] [P4] [US9] Create stat cards for total, open, closed counts
  - Implements FR-030, FR-031
- [x] [T070] [P4] [US9] Create label distribution visualization
  - Implements FR-032
- [x] [T071] [P4] [US9] Navigate to filtered issues when tapping stats

---

## Phase 12: Settings (US10 - P4)

- [x] [T072] [P4] [US10] Create SettingsScreen (`src/screens/settings/SettingsScreen.tsx`)
  - Implements FR-033, FR-035, FR-036
- [x] [T073] [P4] [US10] Add theme toggle switch
  - Implements FR-033
- [x] [T074] [P4] [US10] Persist theme preference in AsyncStorage
  - Implements FR-034
- [x] [T075] [P4] [US10] Add "Change Repository" navigation
  - Implements FR-036
- [x] [T076] [P4] [US10] Implement logout with credential clearing
  - Implements FR-035

---

## Phase 13: Offline & Error Handling

- [x] [T077] [P3] Create network status hook using NetInfo or similar
  - Implements FR-037
- [x] [T078] [P3] Display offline indicator banner when disconnected
  - Implements FR-037
- [x] [T079] [P3] Add retry buttons on failed operations
  - Implements FR-038
- [x] [T080] [P2] Handle API authorization errors and redirect to login
  - Handles edge case: revoked installation

---

## Phase 14: Polish

- [ ] [T081] [P4] Add app icon and splash screen assets (`apps/mobile/assets/`)
- [ ] [T082] [P4] Optimize FlatList rendering for 60fps scrolling
  - SC-010: 60fps with 100+ items
- [ ] [T083] [P4] Add loading skeletons for issue list
- [ ] [T084] [P4] Test and optimize for 320px-428px screen widths
  - SC-009: Responsive layout
- [ ] [T085] [P4] Add haptic feedback for key interactions
- [ ] [T086] [P4] Write unit tests for auth service (`tests/services/`)
- [ ] [T087] [P4] Write component tests for IssueCard, LabelBadge (`tests/components/`)
- [ ] [T088] [P4] Write screen tests for LoginScreen, IssueListScreen (`tests/screens/`)
- [ ] [T089] [P4] Update app.json with production configuration
- [ ] [T090] [P4] Document build and release process in README

---

## Task Summary

| Phase | Priority | Task Count | User Story |
|-------|----------|------------|------------|
| 1 - Setup | P0 | 8 | - |
| 2 - Foundational | P0 | 9 | - |
| 3 - Authentication | P1 | 8 | US1 |
| 4 - Repository Selection | P1 | 5 | US2 |
| 5 - Issue List | P1 | 9 | US3 |
| 6 - Issue Detail | P2 | 6 | US4 |
| 7 - Create Issue | P2 | 9 | US5 |
| 8 - Edit Issue | P2 | 5 | US6 |
| 9 - Comments | P3 | 4 | US7 |
| 10 - Labels | P3 | 4 | US8 |
| 11 - Dashboard | P4 | 4 | US9 |
| 12 - Settings | P4 | 5 | US10 |
| 13 - Offline & Error | P2-P3 | 4 | - |
| 14 - Polish | P4 | 10 | - |
| **Total** | | **90** | |

---

## Implementation Notes

1. **Start with Phases 1-2** to establish project foundation
2. **P1 user stories (US1-US3)** are blocking - complete before P2
3. **Reuse @issuedesk/shared** types throughout - verify React Native bundler compatibility early
4. **Test auth flow early** - device flow polling is complex
5. **Markdown rendering** may need custom styles for mobile readability
