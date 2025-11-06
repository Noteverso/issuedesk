# issuedesk Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-31

## Active Technologies
- TypeScript 5.3+, Node.js ≥18.0.0 (Electron 33+), JavaScript ES2020+ (Cloudflare Workers) (002-github-app-auth)

- TypeScript 5.3+, Node.js ≥18.0.0, React 18+ (001-issues-management)
- Electron 33+, SQLite (better-sqlite3), Tiptap (markdown editor), react-markdown + remark-gfm (001-issues-management)
- Comment metadata system: HTML comments embedded in markdown for title, description, and tags (001-issues-management)

## Project Structure

```text
apps/desktop/src/
├── main/          # Electron main process
│   ├── ipc/       # IPC handlers (issues, comments, labels, sync, settings, analytics)
│   ├── database/  # SQLite per-repository databases
│   └── sync/      # GitHub sync engine
├── renderer/      # React UI
│   ├── components/ # UI components (issue, comment, label, dashboard, common)
│   ├── hooks/     # React hooks (useIssues, useComments, useLabels, etc.)
│   └── pages/     # Main pages (Dashboard, Issues, Labels, Settings)
packages/
├── shared/        # Types, Zod schemas, utilities
└── github-api/    # GitHub REST API client
tests/
├── contract/      # IPC contract tests
└── e2e/          # End-to-end tests
```

## Commands

npm run dev:desktop  # Start Electron in dev mode
npm test             # Run all tests
npm run test:contract # Test IPC contracts
npm run build:packages # Build shared packages

## Code Style

TypeScript 5.3+, Node.js ≥18.0.0, React 18+: Follow standard conventions

## Recent Changes
- 002-github-app-auth: Added TypeScript 5.3+, Node.js ≥18.0.0 (Electron 33+), JavaScript ES2020+ (Cloudflare Workers)

- 001-issues-management: Added TypeScript 5.3+, Node.js ≥18.0.0, React 18+
- 001-issues-management: Added comment management feature with HTML metadata embedding (2025-10-31)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
