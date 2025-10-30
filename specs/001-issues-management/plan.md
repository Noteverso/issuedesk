# Implementation Plan: GitHub Issues Management App

**Branch**: `001-issues-management` | **Date**: 2025-10-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-issues-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Desktop application for managing GitHub issues with offline-first architecture. Users can perform full CRUD operations on issues and labels, view analytics dashboard, filter/search issues, and sync changes with GitHub. Built using Electron for native desktop integration, React + Tailwind CSS for UI, SQLite for local persistence (one database per repository), and electron-store for app settings/preferences.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js ≥18.0.0, React 18+  
**Primary Dependencies**: 
- Electron 33+ (desktop framework)
- React 18 + React Router (UI)
- Tailwind CSS 3 + @primer/css (styling)
- Tiptap + tiptap-markdown (WYSIWYG markdown editor)
- react-markdown + remark-gfm (read-only markdown preview)
- better-sqlite3 (SQLite for per-repository caches)
- electron-store (app settings/preferences)
- Octokit (GitHub API client via @issuedesk/github-api)
- Zod (runtime validation in @issuedesk/shared)

**Storage**: 
- SQLite (one database per repository for issues, labels, sync queue)
- electron-store (global app settings, active repository, theme)
- OS keychain (GitHub token via electron-store with encryption)

**Testing**: Vitest (unit tests), Playwright (E2E tests), NEEDS CLARIFICATION (integration test strategy for IPC contracts)  
**Target Platform**: Desktop (macOS, Windows, Linux via Electron)  
**Project Type**: Desktop Electron app with workspace monorepo architecture  
**Performance Goals**: 
- App launch <3s (cold start)
- Markdown preview render <200ms
- Filter operations <100ms for 1000 issues
- UI interactions 60fps (<16ms per frame)

**Constraints**: 
- Offline-first (all core features work without network)
- <200MB RAM idle
- <100MB installed size
- Sequential sync with conflict detection
- GitHub API rate limit tracking (warn at 20% remaining)

**Scale/Scope**: 
- Support multiple repositories (unlimited)
- 1000+ issues per repository
- 4 main screens (Dashboard, Issues, Labels, Settings)
- 5 user stories (P1-P5 priority)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Phase 0)

| Principle | Compliance | Notes |
|-----------|-----------|-------|
| **I. Minimal Dependencies** | ✅ PASS | All dependencies justified: Electron (desktop framework), React (UI), Tailwind (styling per constitution), better-sqlite3 (local-first), electron-store (settings), Octokit (GitHub API abstraction), Zod (validation). No prohibited deps (no Lodash, moment.js, jQuery, CSS-in-JS). |
| **II. Local-First Architecture** | ✅ PASS | SQLite provides offline capability; sync is enhancement; conflict resolution defined (user prompt); users own data locally. |
| **III. GitHub-Inspired UI** | ✅ PASS | Spec requires GitHub-matching markdown preview, external links to GitHub, familiar patterns (list/card views, label chips). Dark mode required. |
| **IV. Electron Native Patterns** | ⚠️ NEEDS VERIFICATION | Will use contextBridge + preload scripts, nodeIntegration=false, contextIsolation=true. Heavy operations (SQLite, markdown) in main process. Auto-updates via electron-builder. Must verify in Phase 1. |
| **V. Workspace Architecture** | ✅ PASS | Existing monorepo structure (`apps/desktop`, `packages/shared`, `packages/github-api`). GitHub API calls go through `@issuedesk/github-api` only. |
| **Performance Standards** | ✅ PASS | Targets align: <3s launch, <200ms markdown, <100ms filters, <200MB RAM. |
| **Prohibited Dependencies** | ✅ PASS | No Next.js, Remix, styled-components, Lodash, moment.js, jQuery. |

**Overall Status**: ✅ PASS with verification needed in Phase 1 for IPC architecture.

---

### Post-Phase 1 Check

| Principle | Compliance | Notes |
|-----------|-----------|-------|
| **I. Minimal Dependencies** | ✅ PASS | Added dependencies verified: Tiptap (120KB, WYSIWYG editor), react-markdown (50KB, read-only preview), remark-gfm (GFM support), Recharts (80KB, analytics charts), @primer/css (GitHub styling). All justified in research.md. Total bundle: ~90MB < 100MB limit. |
| **II. Local-First Architecture** | ✅ PASS | Data model confirms: SQLite per repository, sync via queue, conflict detection with user resolution UI. Users control merge strategy. |
| **III. GitHub-Inspired UI** | ✅ PASS | Will use @primer/css for markdown styling, GitHub-compatible markdown rendering (react-markdown + remark-gfm). |
| **IV. Electron Native Patterns** | ✅ PASS VERIFIED | IPC contract defines type-safe contextBridge API (contracts/ipc.md). Main process handles SQLite, sync, keychain. Renderer isolated with contextIsolation=true. electron-builder for packaging. |
| **V. Workspace Architecture** | ✅ PASS | Project structure confirms: `apps/desktop/{main,preload,renderer}`, `packages/shared` (types/schemas), `packages/github-api` (Octokit wrapper). No circular dependencies. |
| **Performance Standards** | ✅ PASS | Indexed SQLite queries, WAL mode, prepared statements, transaction batching confirmed in data-model.md. Performance budgets met. |
| **Prohibited Dependencies** | ✅ PASS | No prohibited libraries added. Using Tailwind (required), native date formatting, React (no jQuery). |

**Overall Status**: ✅ FULL COMPLIANCE

**Complexity Justifications**: None needed - all design choices align with constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/desktop/
├── src/
│   ├── main/                    # Main process (Node.js)
│   │   ├── index.ts            # App lifecycle, window management
│   │   ├── ipc/                # IPC handlers
│   │   │   ├── issues.ts       # Issue CRUD handlers
│   │   │   ├── comments.ts     # Comment CRUD handlers
│   │   │   ├── labels.ts       # Label CRUD handlers
│   │   │   ├── sync.ts         # Sync operations
│   │   │   ├── settings.ts     # Settings handlers
│   │   │   └── analytics.ts    # Dashboard analytics
│   │   ├── database/           # SQLite database layer
│   │   │   ├── manager.ts      # Multi-repo cache management
│   │   │   ├── migrations/     # Schema migrations
│   │   │   ├── repositories/   # Data access layer
│   │   │   │   ├── issues.ts
│   │   │   │   ├── comments.ts
│   │   │   │   ├── labels.ts
│   │   │   │   └── sync-queue.ts
│   │   │   └── schemas/        # SQLite table schemas
│   │   ├── sync/               # GitHub sync engine
│   │   │   ├── engine.ts       # Sync orchestration
│   │   │   ├── conflict.ts     # Conflict detection
│   │   │   └── rate-limit.ts   # Rate limit tracking
│   │   └── security/           # Keychain integration
│   │       └── keychain.ts     # Token storage
│   ├── preload/                # Preload scripts (context bridge)
│   │   └── index.ts            # Type-safe IPC bridge
│   ├── renderer/               # React UI
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx        # Entry point
│   │   │   ├── pages/          # Route components
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Issues.tsx
│   │   │   │   ├── Labels.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── components/     # Reusable components
│   │   │   │   ├── issue/
│   │   │   │   │   ├── IssueCard.tsx
│   │   │   │   │   ├── IssueList.tsx
│   │   │   │   │   ├── IssueEditor.tsx
│   │   │   │   │   └── IssueFilters.tsx
│   │   │   │   ├── comment/
│   │   │   │   │   ├── CommentCard.tsx
│   │   │   │   │   ├── CommentList.tsx
│   │   │   │   │   ├── CommentEditor.tsx
│   │   │   │   │   └── CommentFilters.tsx
│   │   │   │   ├── label/
│   │   │   │   │   ├── LabelCard.tsx
│   │   │   │   │   ├── LabelList.tsx
│   │   │   │   │   └── LabelEditor.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── StatsCard.tsx
│   │   │   │   │   ├── TrendChart.tsx
│   │   │   │   │   └── LabelDistributionChart.tsx
│   │   │   │   ├── markdown/
│   │   │   │   │   └── MarkdownEditor.tsx
│   │   │   │   └── common/
│   │   │   │       ├── Layout.tsx
│   │   │   │       ├── Sidebar.tsx
│   │   │   │       ├── ViewToggle.tsx
│   │   │   │       └── ThemeProvider.tsx
│   │   │   ├── hooks/          # React hooks
│   │   │   │   ├── useIssues.ts
│   │   │   │   ├── useIssue.ts
│   │   │   │   ├── useComments.ts
│   │   │   │   ├── useComment.ts
│   │   │   │   ├── useLabels.ts
│   │   │   │   ├── useSync.ts
│   │   │   │   ├── useSettings.ts
│   │   │   │   └── useTheme.ts
│   │   │   ├── services/       # Renderer-side services
│   │   │   │   └── ipc.ts      # Type-safe IPC client
│   │   │   └── styles/
│   │   │       └── globals.css # Tailwind imports
│   │   └── public/
│   └── shared/                 # Desktop-specific shared code
│       └── types.ts            # Desktop-specific types
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/

packages/shared/                # Types, schemas, utilities (zero deps)
├── src/
│   ├── types/
│   │   ├── issue.ts
│   │   ├── comment.ts
│   │   ├── label.ts
│   │   ├── repository.ts
│   │   ├── settings.ts
│   │   └── sync.ts
│   ├── schemas/                # Zod schemas
│   │   ├── issue.schema.ts
│   │   ├── comment.schema.ts
│   │   ├── label.schema.ts
│   │   └── settings.schema.ts
│   └── utils/
│       ├── date.ts
│       └── markdown.ts
└── package.json

packages/github-api/            # GitHub API client (minimal deps: octokit)
├── src/
│   ├── client.ts               # Octokit wrapper
│   ├── issues.ts               # Issues API
│   ├── comments.ts             # Comments API
│   ├── labels.ts               # Labels API
│   ├── rate-limit.ts           # Rate limit utilities
│   └── types.ts                # API-specific types
└── package.json

tests/
├── contract/                   # IPC contract tests
│   ├── issues.spec.ts
│   ├── comments.spec.ts
│   ├── labels.spec.ts
├── integration/                # Cross-package tests
└── unit/                       # Shared package unit tests
```

**Structure Decision**: Desktop Electron application using workspace monorepo. Main process handles SQLite databases (one per repository), GitHub sync, and keychain access. Renderer process is a React SPA with Tailwind CSS. IPC communication via type-safe preload bridge. Shared types/schemas in `@issuedesk/shared`, GitHub API abstraction in `@issuedesk/github-api`.

## Complexity Tracking

No constitutional violations. All design choices align with IssueDesk principles.
