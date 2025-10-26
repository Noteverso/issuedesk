<!--
Sync Impact Report:
- Version change: Initial → 1.0.0
- Added principles: Minimal Dependencies, Local-First Architecture, GitHub-Inspired UI, Electron Native Patterns, Workspace Architecture
- Added sections: Technical Constraints, Architecture Standards
- Templates requiring updates: ✅ All templates validated for consistency
- Follow-up TODOs: None
-->

# IssueDesk Constitution

## Core Principles

### I. Minimal Dependencies (MUST)
- **Dependencies must be justified**: Every npm dependency MUST solve a critical problem that would require significant effort to implement ourselves
- **Prefer built-in solutions**: Use Node.js built-ins, Electron APIs, and browser standards before adding external libraries
- **Zero-dependency preference**: Shared packages (`@issuedesk/shared`, `@issuedesk/github-api`) SHOULD have zero runtime dependencies unless absolutely necessary
- **Bundle size consciousness**: Desktop app MUST remain under 100MB installed size; evaluate every dependency's impact
- **Rationale**: Minimal dependencies reduce security surface area, improve maintainability, ensure long-term stability, and keep the app lightweight

### II. Local-First Architecture (MUST)
- **Offline capability**: All core features MUST work without network connectivity; data persists locally first
- **Sync as enhancement**: Network operations are enhancements that sync local state with GitHub, not primary data storage
- **Local database required**: Use built-in solutions (SQLite via better-sqlite3, or IndexedDB) for local persistence
- **Conflict resolution**: Define clear merge strategies for local vs. remote state conflicts
- **Data ownership**: Users own their data locally; GitHub is a backup/sync target, not the source of truth
- **Rationale**: Local-first ensures reliability, speed, privacy, and user control over their content

### III. GitHub-Inspired UI (MUST)
- **Design language**: Follow GitHub's visual design system: typography, spacing, color palette, component patterns
- **Consistency over innovation**: Reuse familiar GitHub UI patterns (issue cards, label chips, markdown editor) rather than inventing new ones
- **Accessibility standards**: Match GitHub's WCAG 2.1 AA compliance; keyboard navigation, screen reader support, focus management
- **Dark mode support**: MUST support both light and dark themes matching GitHub's implementation
- **Rationale**: Familiar UI reduces learning curve, leverages user's existing mental models, ensures professional appearance

### IV. Electron Native Patterns (MUST)
- **IPC communication**: Main process ↔ Renderer communication MUST use contextBridge with type-safe preload scripts
- **Security first**: nodeIntegration MUST be false; contextIsolation MUST be true; follow Electron security checklist
- **Native integration**: Leverage Electron APIs for system features (menus, notifications, file dialogs) before web alternatives
- **Process separation**: Heavy computation (markdown parsing, git operations) MUST run in main process or worker threads, never block renderer
- **Auto-updates**: MUST use electron-builder + electron-updater for cross-platform updates
- **Rationale**: Following Electron best practices ensures security, performance, and native desktop experience

### V. Workspace Architecture (MUST)
- **Monorepo structure**: Maintain npm workspaces with clear separation: `apps/*` for applications, `packages/*` for shared libraries
- **Shared type safety**: `@issuedesk/shared` contains all TypeScript types, Zod schemas, and utilities shared across apps
- **API abstraction**: `@issuedesk/github-api` encapsulates all GitHub API interactions; apps MUST NOT call GitHub directly
- **Independent buildability**: Each package MUST build independently; circular dependencies are PROHIBITED
- **Version synchronization**: All workspace packages share the same version number for simplicity
- **Rationale**: Workspace architecture enables code reuse between desktop/mobile, maintains clear boundaries, simplifies testing

## Technical Constraints

### Technology Stack (REQUIRED)
- **Desktop**: Electron 33+ + React 18+ + TypeScript 5+ + Tailwind CSS 3+
- **Mobile**: React Native + Expo + TypeScript (future)
- **Build tools**: electron-builder for packaging, tsup/esbuild for library builds
- **Runtime**: Node.js ≥18.0.0, npm ≥9.0.0
- **Type validation**: Zod for runtime schema validation in `@issuedesk/shared`

### Prohibited Dependencies
- **No heavy frameworks**: Avoid Next.js, Remix, or other full-stack frameworks (Electron is the framework)
- **No CSS-in-JS**: Use Tailwind utility classes; avoid styled-components, emotion, etc. (bundle size, runtime cost)
- **No Lodash/Underscore**: Use native ES2020+ methods or write small utilities
- **No moment.js**: Use native `Intl.DateTimeFormat` or date-fns (smaller alternative)
- **No jQuery**: Use native DOM APIs and React

### Performance Standards
- **Cold start**: Desktop app MUST launch in <3 seconds on modern hardware (SSD, 8GB RAM)
- **Hot reload**: Development changes MUST reflect in <1 second
- **Memory footprint**: Idle app MUST use <200MB RAM
- **Rendering**: UI interactions MUST respond in <100ms (60fps)

## Architecture Standards

### Data Flow
1. **User action** → Renderer process
2. **IPC call** → Main process (via preload bridge)
3. **Local database** → Read/write local state (immediate)
4. **Background sync** → GitHub API (eventual, non-blocking)
5. **Conflict resolution** → Merge strategy (last-write-wins, manual, or auto-merge)
6. **UI update** → Renderer re-renders from local state

### File Structure (MUST)
```
apps/desktop/
├── src/
│   ├── main/          # Main process (Node.js)
│   ├── preload/       # Preload scripts (context bridge)
│   ├── renderer/      # React UI
│   └── shared/        # Desktop-specific shared code
packages/shared/       # Types, schemas, utilities (zero deps)
packages/github-api/   # GitHub API client (minimal deps: axios, octokit)
```

### Error Handling
- **Network errors**: MUST NOT crash app; queue operations for retry
- **Validation errors**: Use Zod schemas; display user-friendly messages
- **IPC errors**: Type-safe error handling; log to main process console + display toast in renderer
- **GitHub API errors**: Handle rate limits, authentication failures, network timeouts gracefully

## Governance

### Constitution Authority
- This constitution supersedes all feature specifications and implementation plans
- Any feature violating these principles MUST be rejected or redesigned
- Amendments require:
  1. Documentation of rationale (why change is necessary)
  2. Impact analysis on existing code and principles
  3. Migration plan for affected features
  4. Version bump (MAJOR for breaking principle changes, MINOR for additions, PATCH for clarifications)

### Quality Gates (MUST)
- **All code reviews**: Verify compliance with principles (especially dependency justification, local-first design)
- **Pull requests**: MUST NOT introduce dependencies without explicit justification in PR description
- **Architecture decisions**: Document in `specs/*/research.md` with alternatives considered
- **Security**: Run `npm audit` before each release; MUST have zero high/critical vulnerabilities

### Development Workflow
- **Feature development**: Follow `/speckit` workflow (specify → clarify → plan → tasks → implement)
- **Testing**: Write tests for shared packages; integration tests for IPC contracts
- **Documentation**: Update README and architecture docs when adding major features
- **Versioning**: Semantic versioning (MAJOR.MINOR.PATCH) across all workspace packages

**Version**: 1.0.0 | **Ratified**: 2025-10-26 | **Last Amended**: 2025-10-26
