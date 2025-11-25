# Feature Specification: GitHub App Authorization with Cloudflare Worker Backend

**Feature Branch**: `002-github-app-auth`  
**Created**: 2025-11-06  
**Status**: In Progress (Phase 3)  
**Input**: User description: "Add GitHub App authorization with Cloudflare Worker backend. Use private key and installationId to exchange for temporary tokens. Store all sensitive secrets in backend, safely store temporary tokens in client."

**Migration Note**: This feature replaces the Personal Access Token (PAT) authentication from 001-issues-management. See `MIGRATION-FROM-PAT.md` for details on the migration strategy, breaking changes, and user impact.

## Clarifications

### Session 2025-11-06

- Q: How long should backend user sessions persist before requiring full re-authentication? → A: 30 days - Industry standard, balances security and UX
- Q: What rate limiting strategy should the backend use for token generation endpoints? → A: 5 requests per minute per user - Fair per-user limit
- Q: What retry strategy should be used when the backend service is unreachable during token operations? → A: 3 retries with exponential backoff (1s, 2s, 4s) - Industry standard

### Session 2025-11-20

- Q: Should backend sessions use fixed 30-day expiration or sliding window that resets on activity? → A: Sliding window - extends 30 days on each token refresh; active users never re-authenticate, inactive users (30+ days) require full device flow
- Q: Should system cache access tokens for multiple installations to enable instant switching? → A: Yes, cache all installation tokens - enables instant switching without backend requests; evict on expiration (1 hour) or logout
- Q: What operations should work when backend is unreachable after retry attempts fail? → A: Limited offline - continue read-only operations with cached token until rejected by GitHub; disable/queue write operations with user notification
- Q: Should backend use Cloudflare KV or Durable Objects for session storage? → A: Cloudflare KV for MVP - simpler, cheaper, read-optimized; use application-layer request deduplication for concurrent refresh handling
- Q: What should happen when device flow polling times out after 15 minutes? → A: Show clear timeout message with "Try Again" button that generates fresh device code; automatically discard expired codes

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initial Authentication (Priority: P1)

A user opens the desktop application for the first time and needs to authenticate with their GitHub account to access their repositories and issues.

**Why this priority**: This is the entry point for all users. Without authentication, no other features can be used. This is the absolute minimum viable feature.

**Independent Test**: User can click "Login with GitHub", complete the device flow authorization on GitHub's website, and successfully return to the application with an authenticated session. The application displays the user's GitHub profile information.

**Acceptance Scenarios**:

1. **Given** a user opens the desktop application for the first time, **When** they click "Login with GitHub", **Then** they are shown a unique device code (automatically copied to clipboard) and a modal with "Open GitHub" button
2. **Given** a user has received a device code, **When** they click "Open GitHub" button and navigate to the authorization page, **Then** they can paste the code (already in clipboard) to authorize the application
3. **Given** a user has authorized the application on GitHub, **When** the application detects the authorization, **Then** the first available installation is automatically selected and its token is fetched
4. **Given** a user has completed authentication, **When** the application requests access to repositories, **Then** the installation token is used for GitHub API calls (visible in console logs)
5. **Given** a user receives a device code but does not complete authorization within 15 minutes, **When** the polling timeout occurs, **Then** the user sees a clear "Authorization timeout" message with explanation and a "Try Again" button that generates a new device code
6. **Given** a user completes device flow authorization but has not installed the GitHub App (zero installations), **When** authentication completes, **Then** the backend creates session using GitHub User API for profile data and the application displays InstallAppPrompt with installation guidance, direct link to installation page, and "Check Again" button that refreshes installations without re-authentication (IMPLEMENTED 2025-12-07)

---

### User Story 2 - Installation Selection (Priority: P2)

After authenticating, a user needs to select which GitHub account/organization they want to work with when the app is installed in multiple locations.

**Why this priority**: Multi-organization support is common for developers. This enhances usability but the app can function with just one installation.

**Independent Test**: User can view a list of all GitHub installations, select one, and the application stores this preference. Subsequent API calls use the selected installation's access token.

**Acceptance Scenarios**:

1. **Given** a user has authenticated and has multiple GitHub App installations, **When** they view the installation selection screen, **Then** they see all organizations/accounts where the app is installed with names and avatars
2. **Given** a user views the installation list, **When** they select an installation, **Then** the backend exchanges the installation ID for a temporary access token valid for that installation only
3. **Given** a user has selected an installation, **When** they navigate to other parts of the application, **Then** all GitHub API requests use the access token for the selected installation
4. **Given** a user wants to switch installations, **When** they access the settings or account menu, **Then** they can select a different installation and obtain a new access token

---

### User Story 3 - Automatic Token Refresh (Priority: P3)

As a user works with the application over an extended period, their access token expires and needs to be refreshed transparently without interrupting their workflow.

**Why this priority**: Improves user experience by preventing unexpected authentication failures, but initial MVP can function with manual re-authentication.

**Independent Test**: Application detects when a token is about to expire (within 5 minutes), automatically requests a new token from the backend, and continues operations without user intervention. User sees no interruption.

**Acceptance Scenarios**:

1. **Given** a user has an active session with a token expiring in 5 minutes, **When** the application checks token validity, **Then** it automatically requests a new token from the backend
2. **Given** the backend receives a token refresh request, **When** it validates the user's session, **Then** it exchanges the installation ID for a fresh temporary token and returns it to the client
3. **Given** a token has expired, **When** the user attempts an action requiring API access, **Then** the application requests a new token before making the API call, maintaining seamless operation
4. **Given** token refresh fails due to revoked permissions, **When** the application detects this, **Then** it gracefully prompts the user to re-authenticate

---

### User Story 4 - Session Persistence (Priority: P2)

A user closes the application and reopens it later, expecting to remain logged in without having to re-authenticate.

**Why this priority**: Essential for good user experience in a desktop application. Users expect to authenticate once, not on every launch.

**Independent Test**: User authenticates once, closes the application, reopens it hours or days later, and is automatically logged in with a valid session (if tokens haven't expired beyond refresh capability).

**Acceptance Scenarios**:

1. **Given** a user has authenticated successfully, **When** they close and reopen the application, **Then** they are automatically logged in without re-entering credentials
2. **Given** a user's session is stored locally, **When** the application starts, **Then** it verifies the stored token is still valid or can be refreshed
3. **Given** a user's session has expired beyond refresh capability, **When** they reopen the application, **Then** they are redirected to the login screen with a clear message
4. **Given** a user logs out explicitly, **When** they reopen the application, **Then** all stored session data is cleared and they must re-authenticate

---

### User Story 5 - Security and Secret Management (Priority: P1)

The application must protect sensitive credentials (GitHub App private keys, client secrets) by storing them only on the backend server, never exposing them to the desktop client.

**Why this priority**: Security is non-negotiable. Compromised secrets would allow unauthorized access to all user repositories. This is a fundamental architectural requirement.

**Independent Test**: Security audit shows that private keys and secrets are only stored in Cloudflare Worker environment variables, never transmitted to or stored on the client. Client only receives and stores short-lived access tokens.

**Acceptance Scenarios**:

1. **Given** the backend service is deployed, **When** examining environment configuration, **Then** GitHub App private key and client secret are stored only in Cloudflare Worker secrets
2. **Given** a client makes an authentication request, **When** the backend processes it, **Then** the backend uses the private key to generate a JWT but never sends the private key to the client
3. **Given** a client needs an access token, **When** the backend exchanges installation ID for a token, **Then** the client receives only the temporary access token (expires in 1 hour) and expiration timestamp
4. **Given** a client stores an access token locally, **When** examining client-side storage, **Then** only the encrypted temporary token and user session data are present, no permanent secrets
5. **Given** a token is stored on the client, **When** the application is running, **Then** the token is encrypted using platform-specific secure storage (Electron secure store)

---

### Edge Cases

- What happens when a user's GitHub App installation is uninstalled while they have an active session?
  - Application should detect API authorization errors and prompt user to re-install the app or select a different installation
  
- What happens when the backend service is unreachable during token refresh?
  - Application should retry 3 times with exponential backoff (1s, 2s, 4s), show offline indicator during retries, and cache the last known good state to allow limited offline functionality if all retries fail
  
- What happens when a user authorizes on GitHub but closes the desktop app before polling completes?
  - Next time the app opens, it should either resume polling for a brief period or show the login screen again without error
  
- What happens when Cloudflare Worker secrets are rotated (e.g., new GitHub App private key)?
  - Existing sessions should continue to work until tokens expire, then seamlessly use new secrets for refresh without user intervention
  
- What happens when a user has no GitHub App installations (never installed the app)?
  - After device flow completes, backend creates session with empty installations array using GitHub User API for profile data; frontend displays InstallAppPrompt with step-by-step installation guide, direct link to GitHub App installation page, and "Check Again" button that triggers POST /auth/installations to refresh installations without re-authentication; first installation is auto-selected after refresh (✅ IMPLEMENTED 2025-12-07)
  
- What happens when network connection is lost during device flow authorization?
  - Application should handle polling failures gracefully, show connection status, and resume polling when connection is restored
  
- What happens when concurrent requests need the same expired token refreshed?
  - Backend should deduplicate refresh requests and client should queue API calls until a single refresh completes

## Requirements *(mandatory)*

### Functional Requirements

**Authentication Flow:**

- **FR-001**: System MUST implement GitHub App device flow for user authentication without requiring OAuth redirect URLs
- **FR-002**: System MUST display a unique device code to users and provide a link to GitHub's device authorization page
- **FR-003**: System MUST poll the backend service at regular intervals to detect when user completes authorization on GitHub
- **FR-004**: System MUST stop polling after authorization is complete or after a maximum timeout period of 15 minutes
- **FR-004a**: When device flow polling times out after 15 minutes, System MUST display a clear timeout message explaining the device code has expired and provide a "Try Again" action that initiates a new device flow with a fresh device code
- **FR-004b**: System MUST automatically discard expired device codes and ensure users cannot attempt authorization with codes older than 15 minutes
- **FR-004c**: System MUST allow authentication session creation when user has zero GitHub App installations and MUST fetch user profile from GitHub User API instead of installation account data (IMPLEMENTED 2025-12-07)
- **FR-004d**: System MUST provide POST /auth/installations endpoint that refreshes installations list from GitHub API using stored access token without requiring full re-authentication (IMPLEMENTED 2025-12-07)
- **FR-004e**: System MUST display installation guidance UI when authenticated user has zero installations, including clear explanation, direct link to GitHub App installation page, step-by-step instructions, and retry mechanism to refresh installations after user installs app (IMPLEMENTED 2025-12-07)
- **FR-005**: Desktop application MUST NOT store or have access to GitHub App private keys or client secrets at any time

**Backend Service:**

- **FR-006**: Backend service MUST be implemented as a Cloudflare Worker for serverless deployment and global distribution
- **FR-007**: Backend MUST store GitHub App private key and client secret in Cloudflare Worker environment secrets
- **FR-008**: Backend MUST generate JWT tokens signed with the private key for GitHub App authentication
- **FR-009**: Backend MUST exchange installation IDs for temporary access tokens using GitHub App installation API
- **FR-010**: Backend MUST validate user sessions before issuing or refreshing access tokens
- **FR-011**: Backend MUST implement rate limiting of 5 requests per minute per user for token generation endpoints to prevent abuse
- **FR-011a**: Backend MUST return HTTP 429 (Too Many Requests) status code when rate limit is exceeded with retry-after header
- **FR-012**: Backend MUST log security events (authentication attempts, token generation, failures) for audit purposes

**Token Management:**

- **FR-013**: System MUST obtain temporary access tokens that expire in 1 hour (GitHub's default for installation tokens)
- **FR-013a**: System MUST cache valid installation access tokens for all authorized installations to enable instant switching without repeated backend requests
- **FR-013b**: System MUST evict cached installation tokens when they expire (1-hour lifetime) or when user logs out, requiring fresh tokens on next use
- **FR-014**: Desktop application MUST store access tokens in encrypted platform-specific secure storage (Electron's safeStorage or similar)
- **FR-015**: System MUST check token expiration before making API requests and refresh if expiring within 5 minutes
- **FR-016**: System MUST automatically request new tokens from backend when current token is about to expire
- **FR-017**: Desktop application MUST clear all stored tokens when user explicitly logs out

**Installation Management:**

- **FR-018**: System MUST retrieve and display all GitHub App installations for the authenticated user
- **FR-019**: System MUST allow users to select which installation (organization/account) to use
- **FR-020**: System MUST store the selected installation preference locally for future sessions
- **FR-021**: System MUST allow users to switch between installations without re-authenticating

**Session Persistence:**

- **FR-022**: System MUST persist user authentication session across application restarts
- **FR-023**: System MUST validate stored session on application startup and refresh tokens if needed
- **FR-024**: System MUST redirect users to login if stored session cannot be validated or refreshed
- **FR-025**: System MUST implement a backend session token separate from GitHub access tokens for user session management with 30-day sliding window expiration that resets on each successful token refresh
- **FR-025a**: Backend MUST automatically invalidate and purge user sessions after 30 days of complete inactivity (no token refreshes) requiring full re-authentication through device flow

**Error Handling:**

- **FR-026**: System MUST handle network failures gracefully during authentication and token refresh
- **FR-027**: System MUST detect when GitHub App installation is revoked and prompt user to re-install
- **FR-028**: System MUST provide clear error messages when authentication or authorization fails
- **FR-029**: System MUST implement retry logic with 3 attempts using exponential backoff (1 second, 2 seconds, 4 seconds) for transient backend failures
- **FR-029a**: System MUST display appropriate user feedback during retry attempts without blocking the UI
- **FR-029b**: When backend is unreachable after all retry attempts, System MUST continue using the last valid access token for read-only GitHub API operations until token is rejected by GitHub API or backend becomes reachable
- **FR-029c**: When backend is unreachable, System MUST display persistent "Limited connectivity" indicator and disable or queue write operations (create/update/delete) with user notification

**Security:**

- **FR-030**: Backend MUST validate all incoming requests to prevent CSRF and injection attacks
- **FR-031**: Backend MUST use HTTPS for all communications
- **FR-032**: Desktop application MUST use Content Security Policy to prevent XSS attacks on auth UI
- **FR-033**: System MUST implement CORS headers on backend to restrict access to legitimate clients only

**Type System & Configuration:**

- **FR-034**: System MUST define WorkerEnv interface in shared package as single source of truth for Cloudflare Worker environment types, imported as @issuedesk/shared (IMPLEMENTED 2025-12-07)
- **FR-035**: Desktop application MUST use Vite environment variables with VITE_ prefix for configuration values exposed to renderer process, with proper TypeScript definitions in vite-env.d.ts (IMPLEMENTED 2025-12-07)
- **FR-036**: System MUST provide default fallback values for optional environment variables to ensure application functions without manual configuration during development (IMPLEMENTED 2025-12-07)

### Key Entities

- **User Session**: Represents an authenticated user's session, including user ID, username, avatar, and backend session token for re-authentication
- **Installation**: Represents a GitHub App installation with installation ID, account name, account type (user/organization), and repository access scope
- **Access Token**: Temporary GitHub API token with the token string, expiration timestamp, associated installation ID, and permissions granted
- **Device Authorization**: Temporary authorization state with device code, user code, verification URL, polling interval, and expiration timestamp
- **Backend Session**: Server-side session record linking a user to their authorized installations, stored in Cloudflare KV for persistence with 30-day sliding window TTL; application-layer request deduplication handles concurrent token refresh scenarios

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete initial authentication and access their GitHub repositories within 2 minutes from first app launch
- **SC-002**: Zero instances of GitHub App private keys or client secrets being stored on or transmitted to client devices
- **SC-003**: 99% of token refresh operations complete transparently without user intervention or workflow interruption
- **SC-004**: Application maintains user sessions across restarts with successful auto-login rate of 95% or higher (excluding explicit logouts and expired refresh capabilities)
- **SC-005**: Backend service responds to token requests within 500ms for 95th percentile, ensuring responsive user experience
- **SC-006**: System handles up to 1000 concurrent authentication requests without service degradation
- **SC-007**: Failed authentication attempts provide actionable error messages within 5 seconds, with 90% of users able to resolve issues without support
- **SC-008**: All security audit scans show zero critical or high vulnerabilities related to credential storage and transmission

## Assumptions

- Users have a GitHub account and are willing to install the GitHub App on their repositories
- Desktop application is built with Electron or similar framework supporting secure storage APIs
- Cloudflare Workers platform is available and meets performance/availability requirements
- GitHub App has been registered and configured with appropriate permissions before deployment
- Users have stable internet connectivity during authentication (offline use comes after initial auth)
- Installation tokens from GitHub have a consistent 1-hour expiration period as per current GitHub API documentation
- Cloudflare KV storage provides acceptable read/write latency for session persistence (typically <50ms global reads, <500ms writes)
- Vite-based build system is used for desktop renderer process with proper environment variable configuration (confirmed 2025-12-07)
- TypeScript compilation targets support import.meta.env for Vite environment variables (confirmed 2025-12-07)

## Dependencies

- GitHub App must be created and registered in GitHub's developer settings
- Cloudflare Workers account with ability to create workers and set environment secrets
- Cloudflare KV namespace for storing user session data with appropriate read/write capacity
- Desktop application framework with secure storage capabilities (e.g., Electron's safeStorage API)
- GitHub's device flow API and installation token APIs must remain stable and available

## Out of Scope

- Multi-factor authentication (MFA) - relies on GitHub's built-in MFA during device flow
- Custom user permission systems - uses GitHub App's repository access controls
- OAuth web flow as alternative to device flow - device flow is primary authentication method
- Support for GitHub Enterprise Server - focuses on GitHub.com cloud service initially
- Offline mode functionality - users must authenticate online first; limited read-only functionality with cached tokens during temporary backend outages is supported
- Migration from other authentication methods - assumes greenfield implementation
- Custom GitHub App installation UI - users install via GitHub's standard installation flow
- Backend monitoring and alerting infrastructure - assumes Cloudflare's built-in monitoring
