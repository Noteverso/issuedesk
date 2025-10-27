# Test Settings Configuration

**✅ BUG FIXED:** IPC client was checking `window.electronAPI` but preload exposes `window.api`. See `IPC-FIX.md` for details.

This script helps test the settings configuration flow step by step.

## Step 1: Test Token Storage

Open the app and run in DevTools console:

```javascript
// Set a test token
const tokenResult = await window.api.settings.setToken({
  token: 'ghp_test_token_1234567890',
  username: 'testuser'
});

console.log('Token set result:', tokenResult);

// Verify token was saved
const tokenCheck = await window.api.settings.getToken();
console.log('Token retrieved:', tokenCheck);
```

**Expected Output:**
```
Token set result: { success: true, message: "Token saved successfully..." }
Token retrieved: { token: "ghp_test_token_1234567890" }
```

## Step 2: Test Repository Configuration

```javascript
// Set a repository
const repoResult = await window.api.settings.setRepository({
  owner: 'octocat',
  name: 'Hello-World'
});

console.log('Repository set result:', repoResult);

// Verify settings
const settings = await window.api.settings.get();
console.log('Current settings:', settings);
```

**Expected Output:**
```
Repository set result: { success: true }
Current settings: {
  settings: {
    activeRepositoryId: "octocat/Hello-World",
    repositories: [
      {
        id: "octocat/Hello-World",
        owner: "octocat",
        name: "Hello-World",
        dbPath: "...",
        lastSyncAt: null
      }
    ],
    ...
  }
}
```

## Step 3: Test Issues List

```javascript
// Try to list issues
try {
  const issues = await window.api.issues.list({
    filter: { state: 'open' },
    page: 1,
    perPage: 10
  });
  console.log('Issues:', issues);
} catch (error) {
  console.error('Error listing issues:', error);
}
```

**Expected:** Should either fetch issues or show a specific error (not "No active repository configured")

## Debugging

If you still see "No active repository configured", check the main process logs:

1. Look for lines starting with `📝 Setting repository:`
2. Check `Active ID:` and `All repos:` output
3. Compare with what `🔍 Debug - Getting active repository:` shows

## Common Issues

### Issue: Settings not persisting
**Cause:** electron-store file might be corrupted or in wrong location

**Fix:**
1. Find electron-store files (check logs for path)
2. Delete `app-settings.json`
3. Restart app and reconfigure

### Issue: Repository ID mismatch
**Cause:** Different ID formats in different parts

**Current format:** `"owner/name"` (e.g., `"octocat/Hello-World"`)

**Check:**
- SettingsManager stores with ID: `"octocat/Hello-World"`
- SettingsManager retrieves with same ID: `"octocat/Hello-World"`

## Manual Electron Store Check

To manually verify the stored data:

**Location:** `%APPDATA%/issuedesk/app-settings.json` (Windows)

**Expected content:**
```json
{
  "activeRepositoryId": "octocat/Hello-World",
  "repositories": [
    {
      "id": "octocat/Hello-World",
      "owner": "octocat",
      "name": "Hello-World",
      "dbPath": "C:\\Users\\...\\repositories\\octocat-Hello-World.db",
      "lastSyncAt": null
    }
  ],
  "theme": "light",
  "editorMode": "preview",
  "viewPreferences": {
    "issues": "list",
    "labels": "list"
  }
}
```

## Alternative: Use Legacy Config (if needed)

If the new SettingsManager doesn't work, you can temporarily use legacy config:

```javascript
// Legacy approach (backward compatibility)
await window.api.setConfig({
  github: {
    token: 'ghp_your_token',
    username: 'your-username',
    defaultRepository: 'owner/repo'
  }
});
```

Then update `issues.ts` to fall back to legacy config if SettingsManager returns null.
