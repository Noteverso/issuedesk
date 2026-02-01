# Feature Specification: IssueDesk Mobile App

**Feature Branch**: `004-mobile-app`  
**Created**: 2026-02-01  
**Status**: Draft  
**Platform**: React Native / Expo  
**Input**: User description: "Create mobile app version of IssueDesk desktop features using React Native/Expo, based on existing desktop functionality from 001-issues-management and 002-github-app-auth"

## Overview

This mobile application brings the core IssueDesk functionality to iOS and Android devices, allowing users to manage GitHub issues on the go. The app reuses the shared package for types and utilities, and integrates with the same Cloudflare Worker backend for authentication.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - GitHub App Authentication (Priority: P1)

A user opens the mobile app for the first time and needs to authenticate with their GitHub account to access their repositories and issues.

**Why this priority**: Authentication is the entry point for all users. Without authentication, no other features can be used.

**Independent Test**: User can tap "Login with GitHub", complete the device flow authorization on GitHub's mobile website, and successfully return to the app with an authenticated session.

**Acceptance Scenarios**:

1. **Given** a user opens the app for the first time, **When** they tap "Login with GitHub", **Then** they see a unique device code with option to copy to clipboard and a button to open GitHub authorization page
2. **Given** a user has received a device code, **When** they tap "Open GitHub" and complete authorization in browser, **Then** the app detects authorization and fetches available installations
3. **Given** a user has completed authentication, **When** the app loads installations, **Then** the first available installation is automatically selected or user is prompted to choose if multiple exist
4. **Given** a user has no GitHub App installations, **When** authentication completes, **Then** the app displays installation guidance with link to install the GitHub App
5. **Given** a user receives a device code but does not complete authorization within 15 minutes, **When** the timeout occurs, **Then** user sees "Authorization timeout" message with "Try Again" button

---

### User Story 2 - Repository Selection (Priority: P1)

After authenticating, a user needs to select which repository they want to manage from their accessible repositories.

**Why this priority**: Users must select a repository before they can view or manage issues. This is required for core functionality.

**Independent Test**: User can view list of accessible repositories, select one, and have the app remember their selection for future sessions.

**Acceptance Scenarios**:

1. **Given** a user has authenticated with an installation token, **When** they view the repository list, **Then** they see all repositories accessible by the GitHub App installation
2. **Given** a user views the repository list, **When** they tap a repository, **Then** it becomes the active repository and the app navigates to the main content
3. **Given** a user has selected a repository, **When** they close and reopen the app, **Then** the previously selected repository is automatically loaded
4. **Given** a user wants to switch repositories, **When** they access settings, **Then** they can select a different repository

---

### User Story 3 - Issue List and Browsing (Priority: P1)

A user can view and browse their GitHub issues in a scrollable list with filtering capabilities.

**Why this priority**: Viewing issues is the primary use case for a mobile user who needs quick access to their issues on the go.

**Independent Test**: User can open the issues tab, see a list of issues, scroll through them, and filter by label or search term.

**Acceptance Scenarios**:

1. **Given** a user has selected a repository, **When** they navigate to the Issues tab, **Then** they see a scrollable list of issues with title, labels (colored badges), and state (open/closed indicator)
2. **Given** a user is viewing the issue list, **When** they pull down to refresh, **Then** the list is updated with the latest issues from GitHub
3. **Given** a user is viewing the issue list, **When** they tap the search icon and enter a term, **Then** only issues containing that term in the title are displayed
4. **Given** a user is viewing the issue list, **When** they tap the filter button and select a label, **Then** only issues with that label are displayed
5. **Given** a user has filters active, **When** they tap "Clear Filters", **Then** all issues are displayed again

---

### User Story 4 - Issue Detail View (Priority: P2)

A user can view the full details of an issue including the markdown body, labels, and comments.

**Why this priority**: After seeing the list, users need to view full issue details to understand context and content.

**Independent Test**: User can tap an issue from the list and see its full title, rendered markdown body, labels, and comments.

**Acceptance Scenarios**:

1. **Given** a user is viewing the issue list, **When** they tap an issue, **Then** they navigate to the issue detail screen showing title, body (rendered markdown), labels, and state
2. **Given** a user is viewing issue details, **When** the issue has comments, **Then** comments are displayed below the body with author and timestamp
3. **Given** a user is viewing issue details, **When** they tap the external link button, **Then** the issue opens in the device's browser on GitHub's website
4. **Given** a user is viewing issue details with markdown content, **When** the content includes images, code blocks, or links, **Then** they render appropriately for mobile viewing

---

### User Story 5 - Create New Issue (Priority: P2)

A user can create a new GitHub issue from their mobile device.

**Why this priority**: Creating issues on the go is essential for capturing ideas and bug reports when away from desktop.

**Independent Test**: User can tap "New Issue", enter title and markdown body, and submit to create the issue on GitHub.

**Acceptance Scenarios**:

1. **Given** a user is on the Issues screen, **When** they tap the "+" or "New Issue" button, **Then** they see a form with title input and markdown body editor
2. **Given** a user is creating an issue, **When** they enter title and body and tap "Create", **Then** the issue is created on GitHub and appears in the local list
3. **Given** a user is creating an issue, **When** they tap the label selector, **Then** they can choose labels from the repository's available labels
4. **Given** a user is creating an issue, **When** they leave the form without saving, **Then** they are prompted to confirm discarding changes

---

### User Story 6 - Edit Existing Issue (Priority: P2)

A user can edit an existing issue's title, body, labels, and state.

**Why this priority**: Editing allows users to update issues with new information while mobile, maintaining productivity.

**Independent Test**: User can open an issue, tap edit, modify the content, and save changes that sync to GitHub.

**Acceptance Scenarios**:

1. **Given** a user is viewing issue details, **When** they tap the "Edit" button, **Then** they can modify the title, body, and labels
2. **Given** a user is editing an issue, **When** they change content and tap "Save", **Then** changes are synced to GitHub and the local view updates
3. **Given** a user is viewing issue details, **When** they tap the state toggle (open/close), **Then** the issue state changes on GitHub

---

### User Story 7 - Comment Management (Priority: P3)

A user can view, create, and manage comments on issues.

**Why this priority**: Comments are essential for collaboration but less frequently used on mobile than viewing and creating issues.

**Independent Test**: User can view comments on an issue, add a new comment, and see it appear in the thread.

**Acceptance Scenarios**:

1. **Given** a user is viewing issue details, **When** comments exist, **Then** they are displayed with author, timestamp, and markdown body
2. **Given** a user is viewing issue details, **When** they tap "Add Comment", **Then** they can enter markdown text and submit
3. **Given** a user has created a comment, **When** they submit it, **Then** it syncs to GitHub and appears in the comment thread

---

### User Story 8 - Label Browsing (Priority: P3)

A user can view all repository labels to understand the labeling system.

**Why this priority**: Labels provide context for issue organization but are less frequently managed on mobile.

**Independent Test**: User can navigate to Labels tab and see all repository labels with names, colors, and descriptions.

**Acceptance Scenarios**:

1. **Given** a user has selected a repository, **When** they navigate to the Labels tab, **Then** they see all labels with name, color badge, and description
2. **Given** a user is viewing labels, **When** they tap a label, **Then** they navigate to a filtered issues view showing only issues with that label

---

### User Story 9 - Dashboard Overview (Priority: P4)

A user can view basic analytics about their repository's issues on a dashboard.

**Why this priority**: Dashboard provides insights but is less critical for mobile use cases focused on quick actions.

**Independent Test**: User can navigate to Dashboard and see issue counts, open/closed ratio, and label distribution.

**Acceptance Scenarios**:

1. **Given** a user has selected a repository, **When** they navigate to the Dashboard tab, **Then** they see total issue count, open/closed counts, and label distribution
2. **Given** a user is viewing the dashboard, **When** they tap on a statistic, **Then** they navigate to the filtered issues view

---

### User Story 10 - Settings and Preferences (Priority: P4)

A user can configure app settings including theme and repository switching.

**Why this priority**: Settings enhance user experience but core functionality works with defaults.

**Independent Test**: User can access settings, switch theme, and change active repository.

**Acceptance Scenarios**:

1. **Given** a user opens the Settings screen, **When** they toggle the theme switch, **Then** the app appearance changes between light and dark mode
2. **Given** a user opens the Settings screen, **When** they tap "Change Repository", **Then** they can select a different repository
3. **Given** a user opens the Settings screen, **When** they tap "Logout", **Then** they are logged out and returned to the login screen

---

### Edge Cases

- What happens when the device has no internet connection while using the app?
  - App should display offline indicator, allow viewing cached data (if implemented), and queue actions for when connectivity returns
- What happens when a user's GitHub App installation is revoked while using the app?
  - App should detect API authorization errors and redirect to login with appropriate message
- What happens when the app is backgrounded during device flow authentication?
  - App should resume polling when foregrounded or show login screen if device code expired
- What happens when user's access token expires during an operation?
  - App should automatically refresh token and retry the operation transparently
- How does the app handle very long issue titles or bodies?
  - Text should be truncated with ellipsis in list view, fully scrollable in detail view
- What happens when markdown contains unsupported or malformed syntax?
  - Render gracefully with best-effort parsing, show raw text for unparsable sections

## Requirements *(mandatory)*

### Functional Requirements

**Authentication:**

- **FR-001**: App MUST implement GitHub App device flow for user authentication
- **FR-002**: App MUST display device code with copy-to-clipboard functionality
- **FR-003**: App MUST provide deep link or button to open GitHub's device authorization page
- **FR-004**: App MUST poll backend service to detect when user completes authorization
- **FR-005**: App MUST handle 15-minute device code timeout with clear message and retry option
- **FR-006**: App MUST display installation guidance when user has zero GitHub App installations
- **FR-007**: App MUST store access tokens securely using platform-specific secure storage (iOS Keychain, Android Keystore)
- **FR-008**: App MUST automatically refresh tokens before expiration (5-minute buffer)
- **FR-009**: App MUST persist user session across app restarts

**Repository Management:**

- **FR-010**: App MUST display list of repositories accessible by the selected installation
- **FR-011**: App MUST allow user to select and switch active repository
- **FR-012**: App MUST persist selected repository preference locally

**Navigation:**

- **FR-013**: App MUST provide bottom tab navigation with Dashboard, Issues, Labels, and Settings tabs
- **FR-014**: App MUST display current repository name in header or navigation

**Issue Management:**

- **FR-015**: App MUST display scrollable list of issues with title, labels, and state
- **FR-016**: App MUST support pull-to-refresh to update issue list
- **FR-017**: App MUST allow filtering issues by label
- **FR-018**: App MUST allow searching issues by title
- **FR-019**: App MUST display issue detail view with rendered markdown body
- **FR-020**: App MUST allow creating new issues with title, body, and label selection
- **FR-021**: App MUST allow editing existing issue title, body, labels, and state
- **FR-022**: App MUST provide external link to open issue on GitHub website
- **FR-023**: App MUST display loading states during API operations
- **FR-024**: App MUST display error messages when operations fail

**Comments:**

- **FR-025**: App MUST display comments on issue detail view
- **FR-026**: App MUST allow creating new comments on issues
- **FR-027**: App MUST render comment markdown content

**Labels:**

- **FR-028**: App MUST display all repository labels with name, color, and description
- **FR-029**: App MUST allow navigation from label to filtered issues view

**Dashboard:**

- **FR-030**: App MUST display total issue count
- **FR-031**: App MUST display open and closed issue counts
- **FR-032**: App MUST display label distribution visualization

**Settings:**

- **FR-033**: App MUST support light and dark theme modes
- **FR-034**: App MUST persist theme preference locally
- **FR-035**: App MUST provide logout functionality that clears stored credentials and session
- **FR-036**: App MUST allow switching between configured repositories

**Offline Handling:**

- **FR-037**: App MUST detect and display offline status indicator
- **FR-038**: App MUST gracefully handle network failures with retry options

### Key Entities

- **User Session**: Authenticated user's session with user ID, username, avatar, backend session token, and installation selection
- **Installation**: GitHub App installation with installation ID, account name, account type, and repository access scope
- **Access Token**: Temporary GitHub API token with token string, expiration timestamp, and associated installation ID
- **Repository**: GitHub repository with owner, name, description, and selection state
- **Issue**: GitHub issue with number, title, body (markdown), labels, state (open/closed), author, created/updated timestamps, comment count
- **Label**: Repository label with name, color (hex), description, and issue count
- **Comment**: Issue comment with ID, body (markdown), author, created/updated timestamps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete authentication and view their first issue list within 90 seconds of app launch
- **SC-002**: Issue list loads and displays within 2 seconds on standard mobile network (4G/LTE)
- **SC-003**: Pull-to-refresh completes within 3 seconds under normal network conditions
- **SC-004**: Users can create a new issue within 5 taps from the issues list
- **SC-005**: Markdown rendering in issue details completes within 500ms
- **SC-006**: Theme changes apply instantly (under 100ms) across all screens
- **SC-007**: App maintains user session across restarts with 95%+ success rate
- **SC-008**: Token refresh operations complete transparently without user intervention
- **SC-009**: App provides usable experience on devices with screen sizes from 320px to 428px width
- **SC-010**: App maintains 60fps scrolling performance in issue list with 100+ items

## Assumptions

- Users have a GitHub account with the IssueDesk GitHub App already installed (from desktop app usage) or are willing to install it
- The Cloudflare Worker backend from 002-github-app-auth is deployed and operational
- Users have iOS 14+ or Android 10+ devices
- Users have intermittent or consistent internet connectivity for most operations
- The @issuedesk/shared package is compatible with React Native/Expo environment
- Expo SDK provides necessary capabilities for secure storage, deep linking, and web browser integration

## Dependencies

- @issuedesk/shared package for types, schemas, and utilities
- Cloudflare Worker backend for authentication (from 002-github-app-auth)
- GitHub App registration (same as desktop app)
- Expo SDK and React Native libraries
- Platform-specific secure storage libraries (expo-secure-store)
- Markdown rendering library compatible with React Native

## Out of Scope

- Offline-first architecture with local SQLite database (potential future enhancement)
- Issue deletion from mobile (safety consideration - defer to desktop)
- Label creation/editing from mobile (less common use case)
- Comment editing/deletion (less critical for mobile workflow)
- Advanced dashboard analytics with charts (simplified stats only)
- Push notifications for issue updates
- Image upload for issues/comments
- Multiple account support (single GitHub account at a time)
- iPad/tablet-specific layouts (phone-first approach)

