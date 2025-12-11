# Repository Selection Testing Guide

Feature: 002-github-app-auth  
Component: Manual Repository Selection  
Date: 2025-12-09

## Overview

This guide covers testing the complete GitHub App authentication flow with manual repository selection.

## Prerequisites

1. **Desktop app running in dev mode**: `npm run dev:desktop`
2. **Auth worker running**: `npm run dev:auth` (wrangler dev)
3. **Clean slate**: No existing session stored (or logout first)
4. **GitHub App installed**: Must have at least one installation with accessible repositories

## Test Flow

### Phase 1: Initial Authentication

1. **Start**: Open the desktop app
2. **Expected**: Login page displays with "Sign in with GitHub" button
3. **Action**: Click "Sign in with GitHub"
4. **Expected**: Device code modal appears with:
   - Device code (e.g., E298-F3C5)
   - "Open GitHub" button
   - Instructions to enter code

### Phase 2: Device Authorization

1. **Action**: Click "Open GitHub" button
2. **Expected**: Browser opens to GitHub device authorization page
3. **Action**: Enter device code and authorize
4. **Expected**: 
   - Browser shows success message
   - Desktop app modal shows "Checking installations..."
   - Modal closes automatically

### Phase 3: Installation Selection

**Case 1: One Installation**
- **Expected**: Installation auto-selected (no UI shown)
- **Flow**: Proceeds directly to repository selection

**Case 2: Multiple Installations**
- **Expected**: InstallationSwitcher component shows dropdown
- **Action**: Select installation from dropdown
- **Expected**: Installation token obtained

**Case 3: No Installations**
- **Expected**: InstallAppPrompt displayed
- **Message**: "Install the IssueDesk GitHub App to continue"
- **Action**: Click "Install GitHub App" → Opens GitHub installation page

### Phase 4: Repository Selection (NEW)

This is the main focus of this test.

1. **Trigger Condition**: `isAuthenticated && session?.installationToken && !settings?.activeRepositoryId`
2. **Expected**: RepositorySelector component displays with:
   - Title: "Select a Repository"
   - Subtitle: "Choose which repository to manage with IssueDesk"
   - Grid of repository cards

3. **Repository Card Display**:
   ```
   [FolderGit2 Icon] Repository Name [Lock Icon if private]
                     owner/repo-name
                     Description text (if available)
   ```

4. **Loading State**:
   - Spinning refresh icon
   - "Loading repositories..." message

5. **Error State**:
   - GitHub icon (red)
   - Error message
   - "Retry" button

6. **Empty State**:
   - FolderGit2 icon (muted)
   - "No Repositories Found"
   - Explanation about installation settings

### Phase 5: Repository Configuration

1. **Action**: Click on any repository card
2. **Expected**:
   - Card shows checkmark icon
   - Spinning refresh icon appears
   - Console log: `[RepositorySelector] Selecting repository: owner/repo-name`

3. **Backend Processing**:
   - `settings:setRepository` IPC called with `{ owner, name }`
   - Settings updated with `activeRepositoryId: "owner/repo-name"`
   - Repository added to `settings.repositories` array

4. **Expected**: App automatically transitions to Dashboard

### Phase 6: Dashboard Load

1. **Expected**: Dashboard displays with:
   - Selected repository in header/title
   - Issues list (or empty state if no issues)
   - No "No active repository configured" error

2. **Console Logs Should Show**:
   ```
   [RepositorySelector] Fetching repositories with installation token...
   [RepositorySelector] Response: { success: true, data: [...] }
   [RepositorySelector] Loaded N repositories
   [RepositorySelector] Selecting repository: owner/repo-name
   [App] Configuring repository: owner/repo-name
   ✅ Repository set: { owner: "...", name: "..." }
   [App] ✅ Repository configured successfully
   ```

## Testing Scenarios

### Scenario 1: Happy Path
- Login → Auto-select installation → Select repository → Dashboard loads
- **Pass Criteria**: No errors, repository configured, issues displayed

### Scenario 2: Multiple Repositories
- Installation has 10+ repositories
- **Pass Criteria**: All repositories displayed in grid, scrollable if needed

### Scenario 3: Private vs Public
- Mix of private and public repositories
- **Pass Criteria**: Private repos show lock icon, all repos selectable

### Scenario 4: No Repositories
- Installation has no accessible repositories
- **Pass Criteria**: Empty state displayed with explanation

### Scenario 5: API Error
- Backend down or token expired
- **Pass Criteria**: Error state with retry button, can recover

### Scenario 6: Switch Repository
- After initial selection, go to Settings → Switch to different repository
- **Pass Criteria**: Can select different repo, dashboard updates

## Validation Checklist

- [ ] Login flow completes successfully
- [ ] Installation token obtained and stored
- [ ] RepositorySelector component displays
- [ ] Repositories fetched using `/installation/repositories` endpoint
- [ ] Repository cards show correct information (name, owner, description, privacy)
- [ ] Clicking repository triggers configuration
- [ ] `settings:setRepository` IPC called with correct parameters
- [ ] Settings updated with `activeRepositoryId`
- [ ] App transitions to Dashboard automatically
- [ ] Dashboard loads issues from selected repository
- [ ] No "No active repository configured" error
- [ ] Console logs show expected messages

## Known Issues

None currently.

## Implementation Files

- **Component**: `apps/desktop/src/renderer/components/auth/RepositorySelector.tsx`
- **Integration**: `apps/desktop/src/renderer/App.tsx`
- **IPC Handler**: `apps/desktop/src/main/ipc/settings.ts` (`settings:getRepositories`)
- **Preload**: `apps/desktop/src/main/preload.ts` (exposes `settings.getRepositories`)

## API Changes

### Updated Endpoint
- **Before**: `GET /user/repos` (PAT tokens)
- **After**: `GET /installation/repositories` (GitHub App installation tokens)
- **Response Format**: `{ total_count: number, repositories: Repository[] }`

## Next Steps

After successful testing:
1. Remove legacy PAT UI from Settings.tsx
2. Remove "configure PAT" skeleton from Dashboard.tsx
3. Complete Phase 8 polish tasks (17 remaining)
4. Final production audit
