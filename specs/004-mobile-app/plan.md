# Implementation Plan: IssueDesk Mobile App

**Branch**: `004-mobile-app` | **Date**: 2026-02-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-mobile-app/spec.md`

## Summary

Build a React Native/Expo mobile application for iOS and Android that enables users to manage GitHub issues on the go. The app reuses the existing Cloudflare Worker backend for GitHub App authentication and the @issuedesk/shared package for types and utilities. Core features include issue browsing, creation, editing, commenting, and basic dashboard analytics.

## Technical Context

**Language/Version**: TypeScript 5.3+, React Native 0.81+, Expo SDK 54  
**Primary Dependencies**: expo, react-native, @issuedesk/shared, expo-secure-store, expo-linking, react-navigation  
**Storage**: expo-secure-store (credentials), AsyncStorage (preferences), in-memory state (issues/labels)  
**Testing**: Jest + React Native Testing Library, Expo testing utilities  
**Target Platform**: iOS 14+, Android 10+  
**Project Type**: mobile (apps/mobile)  
**Performance Goals**: 60fps scrolling, <2s issue list load, <500ms markdown render  
**Constraints**: Works on 320px-428px screen widths, graceful offline handling  
**Scale/Scope**: Single repository at a time, up to 1000 issues, mobile-optimized workflows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Minimal Dependencies | ✅ PASS | Uses Expo SDK built-ins, minimal additional libraries |
| II. Local-First Architecture | ⚠️ PARTIAL | MVP is online-only; matches desktop Phase 1-8 approach |
| III. GitHub-Inspired UI | ✅ PASS | Will follow GitHub design patterns for mobile |
| IV. Electron Native Patterns | N/A | Not applicable to mobile |
| V. Workspace Architecture | ✅ PASS | Reuses @issuedesk/shared, follows monorepo structure |
| Prohibited Dependencies | ✅ PASS | No heavy frameworks, no CSS-in-JS |
| Performance Standards | ✅ PASS | Mobile-appropriate targets defined |

**Gate Decision**: PASS - Proceed with Phase 0 research. Local-first partial compliance is acceptable as it matches desktop MVP approach.

## Project Structure

### Documentation (this feature)

```text
specs/004-mobile-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (IPC-like API definitions)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/mobile/
├── App.tsx              # Root component with navigation
├── app.json             # Expo configuration
├── index.ts             # Entry point
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── assets/              # Icons, images, fonts
├── src/
│   ├── api/             # GitHub API client adapter
│   │   ├── client.ts    # API wrapper using @issuedesk/github-api
│   │   └── auth.ts      # Auth service (device flow, token management)
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Button, Card, Input, Loading, etc.
│   │   ├── issue/       # IssueCard, IssueForm, IssueDetail
│   │   ├── label/       # LabelBadge, LabelList
│   │   └── comment/     # CommentCard, CommentForm
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.tsx
│   │   └── RepositoryContext.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useIssues.ts
│   │   ├── useLabels.ts
│   │   └── useComments.ts
│   ├── navigation/      # React Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainTabNavigator.tsx
│   ├── screens/         # Screen components
│   │   ├── auth/        # Login, InstallApp
│   │   ├── dashboard/   # DashboardScreen
│   │   ├── issues/      # IssueListScreen, IssueDetailScreen, CreateIssueScreen
│   │   ├── labels/      # LabelsScreen
│   │   └── settings/    # SettingsScreen, RepositorySelectScreen
│   ├── services/        # Business logic
│   │   ├── storage.ts   # Secure storage wrapper
│   │   └── theme.ts     # Theme management
│   ├── styles/          # Shared styles
│   │   └── theme.ts     # Colors, typography, spacing
│   └── types/           # Mobile-specific types (extends @issuedesk/shared)
└── tests/
    ├── components/
    ├── screens/
    └── services/

packages/shared/         # Shared types, schemas (already exists)
packages/github-api/     # GitHub API client (already exists, reuse)
```

**Structure Decision**: Mobile app follows React Native/Expo conventions with feature-based screen organization. Reuses existing shared packages for maximum code sharing with desktop.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Online-only MVP | Matches desktop Phase 1-8 | Local-first adds significant complexity; can add in future phase |
| react-navigation | Expo standard for navigation | Native navigation APIs insufficient for complex flows |

---

## Phase Completion Status

### Phase 0: Research ✅

- [x] Markdown rendering library selection
- [x] Secure storage solution
- [x] Navigation library decision
- [x] State management approach
- [x] HTTP client / API reuse strategy
- [x] Deep linking for OAuth
- [x] Theme system design

**Output**: [research.md](./research.md)

### Phase 1: Design & Contracts ✅

- [x] Data model extracted from spec
- [x] API contracts defined
- [x] Quickstart guide created
- [x] Agent context updated

**Outputs**:
- [data-model.md](./data-model.md)
- [contracts/api.md](./contracts/api.md)
- [quickstart.md](./quickstart.md)

### Post-Design Constitution Re-Check ✅

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Minimal Dependencies | ✅ PASS | Only 3 additional deps: react-navigation (3 packages) + react-native-markdown-display |
| II. Local-First Architecture | ⚠️ PARTIAL | Acceptable for MVP, documented in Complexity Tracking |
| III. GitHub-Inspired UI | ✅ PASS | Theme system designed, GitHub patterns documented |
| V. Workspace Architecture | ✅ PASS | Confirmed @issuedesk/shared reuse viable |

**Final Gate Decision**: PASS - Ready for Phase 2 task generation (`/speckit.tasks`)

---

## Next Steps

Run `/speckit.tasks` to generate implementation tasks from this plan.
