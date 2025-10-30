# Feature Specification: GitHub Issues Management App

**Feature Branch**: `001-issues-management`  
**Created**: 2025-10-26  
**Status**: Draft  
**Implementation Strategy**: API-first (GitHub REST API direct integration for Phases 1-8), followed by SQLite caching layer (Phase 9+) for offline support  
**Input**: User description: "github issues management app. It have four menus including dashboard, issues, labels and settings. The dashboard page has some data analysis aboud github issue and lable. In the issues page, user can create a new issue, edit a new issue, delete a issue and filter issues list. Issues list filter conditions are label, issue name and so on. User can create a new lable, edit a new label, and see all labels. User can set up some settings aboud editor, current github repository and app appearance. The editor needs to support markdown that has two options about code and preview like github website. The issues and label list support list and card options to show. Every issue has a external link to github page."

## Clarifications

### Session 2025-10-26

- Q: When the app is offline and users make multiple changes (create/edit/delete issues and labels), how should these changes be synced when connectivity returns? → A: Sequential sync with conflict detection - prompt user to review conflicts before applying (IMPLEMENTATION: Phase 9+ with SQLite caching)
- Q: The app requires a GitHub Personal Access Token for authentication. Where and how should this sensitive credential be stored? → A: System keychain/credential manager (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Q: GitHub's REST API has rate limits (5000/hour authenticated, 60/hour unauthenticated). How should the app handle rate limit exhaustion? → A: Track remaining rate limit, warn user at 20% remaining, queue operations for after reset
- Q: The app needs local storage for offline functionality. Which database solution should be used? → A: SQLite - embedded relational database with full SQL support (IMPLEMENTATION: Phase 9+, initially app is online-only)
- Q: The dashboard displays issue and label analytics. What level of analytics detail should be provided? → A: Basic stats + trend data (last 7/30 days) + label distribution chart
- **Clarification**: Project should support multiple caches (one per repository) (IMPLEMENTATION: Phase 9+)

### Session 2025-10-27

- **Clarification**: Issues should contain full Label objects (with id, name, color, description, issueCount), not just label IDs. This provides richer UI context without additional lookups.
- **Clarification**: When creating/updating issues, label references are still passed as string IDs for simplicity. The full Label objects are only included in read operations.
- **Clarification**: Label color picker should offer 20 preset colors plus random generation capability, matching GitHub's label creation UX.
- **Clarification**: Each label should track an issue count for dashboard analytics and UI display purposes.
- **Clarification**: External API responses (GitHub API) must be transformed to match internal type contracts - GitHub's label structure differs from the app's Label type.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Issue Management (Priority: P1)

User can perform full CRUD operations on GitHub issues directly from the desktop app, including creating, editing, and deleting issues with markdown support.

**Why this priority**: Core value proposition - managing issues is the primary use case. Without this, the app has no purpose.

**Independent Test**: Can be fully tested by connecting to a test GitHub repository, creating/editing/deleting issues, and verifying changes appear both locally and on GitHub.

**Implementation Note**: Initial implementation (Phases 1-3) uses GitHub REST API directly. Changes are immediately synced to GitHub. Offline support via SQLite caching added in Phase 9+.

**Acceptance Scenarios**:

1. **Given** user is on the Issues page, **When** user clicks "New Issue" and fills in title and markdown body, **Then** issue is created and synced to GitHub immediately with a success notification (Phase 1-3: direct API call; Phase 9+: local-first with background sync)
2. **Given** user selects an existing issue, **When** user edits the title or body and saves, **Then** changes are synced to GitHub immediately (Phase 1-3: direct API call; Phase 9+: local-first with background sync)
3. **Given** user views an issue in the list or detail view, **When** the issue has labels, **Then** user sees complete label information (name, color, description) without additional loading, displayed as colored badges
4. **Given** user selects an issue, **When** user clicks delete and confirms, **Then** issue is closed on GitHub immediately (Phase 1-3: direct API call; Phase 9+: removed from local database and closed on GitHub)
5. **Given** user is editing an issue, **When** user toggles between "Code" and "Preview" modes, **Then** markdown content is displayed as raw text or rendered HTML respectively
6. **Given** user is viewing an issue card, **When** user clicks the external link icon, **Then** issue opens in default browser on GitHub website

---

### User Story 2 - Issue Filtering and Display (Priority: P2)

User can filter issues by multiple criteria (label, title, status) and switch between list and card view layouts.

**Why this priority**: Essential for usability when managing multiple issues, but the app is still functional with just basic issue CRUD.

**Independent Test**: Can be tested by creating issues with different labels and states, then verifying filtering and view switching works correctly.

**Acceptance Scenarios**:

1. **Given** user is on the Issues page, **When** user selects a label filter, **Then** only issues with that label are displayed
2. **Given** user has applied filters, **When** user types in the search box, **Then** issues are filtered by title containing the search term
3. **Given** user is viewing issues in list view, **When** user clicks "Card View" toggle, **Then** issues are displayed as cards with visual previews
4. **Given** user has multiple filters active, **When** user clears filters, **Then** all issues are displayed again
5. **Given** user switches views, **When** user navigates away and returns, **Then** view preference is persisted

---

### User Story 3 - Issue Comments Management (Priority: P2)

User can view, filter, create, edit, and delete comments on GitHub issues with enhanced metadata (title, description, tags) stored in HTML comments within the markdown body.

**Why this priority**: Comments are essential for issue collaboration and discussion, making them a core feature alongside issue management.

**Independent Test**: Can be tested by creating comments with metadata on an issue, verifying they sync to GitHub and can be filtered/edited locally.

**Implementation Note**: Initial implementation (Phase 4) uses GitHub REST API directly. Offline support via SQLite caching added in Phase 9+.

**Acceptance Scenarios**:

1. **Given** user is viewing an issue detail page, **When** user clicks "Add Comment" and fills in title, description, tags, and markdown body, **Then** comment is created with HTML comment metadata embedded in the markdown body and synced to GitHub
2. **Given** user has created a comment with metadata, **When** viewing the comment, **Then** the title, description, and tags are parsed from HTML comments and displayed in the UI separately from the markdown body
3. **Given** user is viewing comments on an issue, **When** user toggles between list and card view, **Then** comments are displayed in the selected layout showing title, description, tags, and preview of body
4. **Given** user is viewing comments, **When** user applies tag filters, **Then** only comments containing all selected tags are displayed
5. **Given** user selects an existing comment, **When** user edits the title, description, tags, or body and saves, **Then** changes are persisted locally with updated HTML comment metadata and synced to GitHub
6. **Given** user selects a comment, **When** user clicks delete and confirms, **Then** comment is removed from local database and deleted on GitHub
7. **Given** user is editing a comment, **When** user toggles between "Code" and "Preview" modes, **Then** markdown body is displayed as raw text or rendered HTML respectively
8. **Given** a GitHub comment exists without metadata HTML comments, **When** user views the comment, **Then** it displays with empty title/description and no tags, showing only the markdown body

**HTML Comment Format**:
```html
<!-- title: Comment Title Here -->
<!-- description: Brief description of the comment -->
<!-- tags: tag1, tag2, tag3 -->

Regular markdown content of the comment body...
```

---

### User Story 4 - Label Management (Priority: P3)

User can create, edit, and view labels with custom colors and descriptions.

**Why this priority**: Labels enhance issue organization but aren't required for basic issue management functionality.

**Independent Test**: Can be tested by creating/editing labels and verifying they appear in issue filters and on GitHub.

**Acceptance Scenarios**:

1. **Given** user is on the Labels page, **When** user clicks "New Label" and provides name and color, **Then** label is created locally and synced to GitHub
2. **Given** user is creating or editing a label, **When** user opens the color picker, **Then** user sees 20 preset colors matching common GitHub label colors, plus a random color generator button for quick selection
3. **Given** user selects an existing label, **When** user edits the name, color, or description, **Then** changes are persisted and reflected on all associated issues
4. **Given** user is viewing labels, **When** user toggles between list and card view, **Then** labels are displayed in the selected layout
5. **Given** user is on the Labels page, **When** labels load, **Then** all repository labels are displayed with their colors, descriptions, and issue counts as badges

---

### User Story 5 - Dashboard Analytics (Priority: P4)

User can view analytics and statistics about their GitHub issues and labels on a dashboard.

**Why this priority**: Nice-to-have feature that provides insights but isn't essential for core issue management.

**Independent Test**: Can be tested by creating various issues and labels, then verifying dashboard displays accurate statistics.

**Acceptance Scenarios**:

1. **Given** user is on the Dashboard page, **When** the page loads, **Then** user sees total issue count, open/closed ratio, issues by label distribution chart, and activity trends for last 7 and 30 days
2. **Given** user has issues with different labels, **When** viewing the dashboard, **Then** label distribution chart displays percentage and count for each label
3. **Given** dashboard analytics are displayed, **When** user clicks on a statistic or chart segment, **Then** user is navigated to filtered issues view showing relevant items
4. **Given** user's repository data changes, **When** user refreshes the dashboard, **Then** analytics are updated to reflect current state with trend data recalculated

---

### User Story 6 - Settings Configuration (Priority: P5)

User can configure application settings including editor preferences, GitHub repository connection, and appearance theme.

**Why this priority**: Important for customization and multi-repository support, but can use defaults initially.

**Independent Test**: Can be tested by changing settings and verifying they persist and affect app behavior.

**Acceptance Scenarios**:

1. **Given** user is on the Settings page, **When** user enters GitHub token and repository owner/name, **Then** app connects to the specified repository and creates/switches to its dedicated cache
2. **Given** user is configuring editor settings, **When** user changes default editor mode (code/preview), **Then** preference is saved and applied to new issues
3. **Given** user is on the Settings page, **When** user switches between light and dark theme, **Then** entire app appearance updates immediately
4. **Given** user has configured settings, **When** user restarts the app, **Then** all settings are persisted and loaded correctly
5. **Given** user has worked with multiple repositories, **When** user switches active repository in Settings, **Then** app loads cached data for selected repository without re-fetching from GitHub

---

### Edge Cases

- When GitHub API rate limit is exhausted, system MUST display warning when remaining requests fall below 20% of hourly limit, queue pending operations locally (Phase 9+), and automatically retry queued operations after rate limit reset time
- When an issue is modified both locally and on GitHub simultaneously, system MUST detect the conflict and display a conflict resolution dialog showing both versions (local and remote) with options to: keep local changes, accept remote changes, or manually merge the differences (IMPLEMENTATION: Phase 10 with sync engine; Phase 1-8: last-write-wins via GitHub API)
- When a comment is modified both locally and on GitHub simultaneously, system MUST detect the conflict and display a conflict resolution dialog showing both versions (local and remote) with options to: keep local changes, accept remote changes, or manually merge the differences (IMPLEMENTATION: Phase 10 with sync engine; Phase 1-8: last-write-wins via GitHub API)
- What happens when user has no internet connection? (IMPLEMENTATION: Phase 1-8: app requires internet; Phase 9+: offline mode with SQLite cache)
- How does the app behave with a repository that has no issues or labels?
- When user's GitHub token is invalid or expires, system MUST detect authentication failure, clear the stored token from keychain, and prompt user to enter a new valid token in Settings
- How does the system handle extremely long issue titles or bodies?
- What happens when user deletes a label that is assigned to existing issues?
- How does markdown preview handle malformed markdown syntax?
- What happens when a GitHub comment exists without HTML metadata comments (legacy comments or comments created outside the app)?
- How does the system handle malformed HTML comment metadata (missing closing tags, invalid format)?
- What happens when a comment has duplicate HTML metadata tags (e.g., two `<!-- title: -->` comments)?
- How does the app handle comments with very long tag lists (e.g., 50+ tags)?
- What happens when user deletes an issue that has comments?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display four main navigation menu items (Dashboard, Issues, Labels, Settings)
- **FR-002**: System MUST allow users to create new issues with title and markdown body
- **FR-003**: System MUST allow users to edit existing issues (title, body, labels, status)
- **FR-004**: System MUST allow users to delete issues
- **FR-005**: System MUST filter issues by label, title search, and status (open/closed)
- **FR-005a**: System MUST allow users to view all comments for a selected issue
- **FR-005b**: System MUST allow users to create new comments with title, description, tags, and markdown body
- **FR-005c**: System MUST parse HTML comment metadata (title, description, tags) from GitHub comment markdown body using regex patterns
- **FR-005d**: System MUST embed metadata as HTML comments at the beginning of comment markdown body when creating/updating comments
- **FR-005e**: System MUST allow users to edit existing comments (title, description, tags, body)
- **FR-005f**: System MUST allow users to delete comments
- **FR-005g**: System MUST filter comments by tags (AND logic - all selected tags must match)
- **FR-005h**: System MUST display comments in both list view and card view layouts
- **FR-006**: System MUST display issues in both list view and card view layouts
- **FR-007**: System MUST provide markdown editor with "Code" and "Preview" toggle modes for both issues and comments
- **FR-008**: System MUST render markdown preview matching GitHub's markdown rendering
- **FR-009**: System MUST display an external link icon on each issue that opens the GitHub issue page
- **FR-010**: System MUST allow users to create new labels with name, color, and optional description
- **FR-011**: System MUST allow users to edit existing labels
- **FR-012**: System MUST display labels in both list and card view layouts
- **FR-013**: System MUST display dashboard with issue analytics including: total counts, open/closed ratios, label distribution chart, and activity trend graphs for 7-day and 30-day periods
- **FR-014**: System MUST persist user settings for editor preferences, repository configuration, and theme
- **FR-014a**: System MUST maintain separate data cache (SQLite database) for each repository configured by user (IMPLEMENTATION: Phase 9+; Phase 1-8: no local cache)
- **FR-014b**: System MUST allow users to switch between multiple configured repositories without data loss
- **FR-015**: System MUST support light and dark theme modes
- **FR-016**: System MUST store all data locally using one SQLite database per repository, with tables for issues, comments, labels, sync queue, and repository metadata (IMPLEMENTATION: Phase 9+; Phase 1-8: GitHub API as data source)
- **FR-017**: System MUST sync local changes with GitHub repository when online using sequential processing of queued operations (including comment CRUD operations) (IMPLEMENTATION: Phase 10 with sync engine; Phase 1-8: immediate sync via direct API calls)
- **FR-017a**: System MUST detect conflicts when both local and remote versions of an issue/comment/label have been modified (IMPLEMENTATION: Phase 10; Phase 1-8: no conflict detection, last-write-wins)
- **FR-017b**: System MUST prompt user to resolve conflicts before completing sync, displaying both versions for comparison (IMPLEMENTATION: Phase 10)
- **FR-018**: System MUST handle authentication via GitHub Personal Access Token stored securely in OS-native keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **FR-019**: System MUST display loading states during API operations
- **FR-019a**: System MUST track GitHub API rate limit consumption from response headers (X-RateLimit-Remaining, X-RateLimit-Reset)
- **FR-019b**: System MUST display warning notification when rate limit falls below 20% of hourly quota
- **FR-019c**: System MUST queue operations locally when rate limit exhausted and auto-retry after reset (IMPLEMENTATION: Phase 9+ with SQLite; Phase 1-8: display error and block operations)
- **FR-020**: System MUST display error messages when operations fail

### Implementation Phases

**Phase 1-8: GitHub API Direct Integration (Online-Only)**
- All CRUD operations use GitHub REST API directly
- No local SQLite database
- Immediate sync to GitHub on every operation
- Requires internet connection for all features
- Simple architecture: UI → IPC → GitHub API
- Faster initial development and deployment

**Phase 9: SQLite Caching Layer**
- Add SQLite database for local data persistence
- Implement cache-first read strategy
- Write-through caching to GitHub
- Enable offline data viewing
- Foundation for offline editing

**Phase 10: Sync Engine & Offline Support**
- Implement sync queue for offline changes
- Add conflict detection and resolution
- Sequential sync with GitHub when online
- Full offline editing capabilities
- Background sync orchestration

**Phase 11-12: System Integration & Polish**
- Error handling and edge cases
- Performance optimization
- Production readiness
- Security audits

### Key Entities

- **Issue**: Represents a GitHub issue with title, body (markdown), labels (full Label objects with all properties for rich UI display), state (open/closed), created/updated timestamps, GitHub URL, local sync status (Phase 9+), comment count, and repository identifier
- **Comment**: Represents a GitHub issue comment with markdown body containing embedded HTML comment metadata (title, description, tags), author information, created/updated timestamps, issue ID reference, local sync status (Phase 9+), and repository identifier. HTML metadata format:
  ```html
  <!-- title: Comment Title -->
  <!-- description: Comment description -->
  <!-- tags: tag1, tag2, tag3 -->
  ```
- **Label**: Represents a GitHub label with name, color (hex), optional description, issue count (for analytics and UI badges), and repository identifier
- **Repository**: Represents a configured GitHub repository with owner, name, last sync timestamp (Phase 9+), cache file path (Phase 9+), and active status (current vs. historical)
- **Settings**: User preferences including GitHub token, active repository ID, editor mode preference (code/preview), theme (light/dark), and view preferences (list/card for issues, labels, and comments)
- **SyncQueue** (Phase 10+): Tracks pending operations to sync with GitHub when online (create, update, delete for issues, comments, and labels), maintains operation order, includes conflict detection metadata (local/remote timestamps and checksums), stores rate-limit queued operations with scheduled retry time, scoped per repository

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, edit, and delete issues within 3 clicks from the Issues page
- **SC-002**: Markdown preview renders within 200ms of toggling from code mode
- **SC-003**: App remains functional offline with all core features (viewing, editing, creating) available using local data (IMPLEMENTATION: Phase 9+; Phase 1-8: requires internet connection)
- **SC-004**: Filter operations return results within 100ms for repositories with up to 1000 issues (Phase 1-8: client-side filtering of API results; Phase 9+: SQLite indexed queries)
- **SC-004a**: Comment filter operations by tags return results within 100ms for issues with up to 500 comments
- **SC-004b**: HTML comment metadata parsing completes within 50ms for comments up to 10KB in size
- **SC-005**: App launches to the Dashboard in under 3 seconds on first load
- **SC-006**: View preferences (list/card) persist across app restarts for issues, labels, and comments
- **SC-007**: Dashboard analytics display accurate counts matching GitHub repository state (Phase 1-8: fetched from GitHub API; Phase 9+: after sync, with trend calculations based on cached timestamps)
- **SC-008**: Theme changes apply instantly across all app screens within 100ms
