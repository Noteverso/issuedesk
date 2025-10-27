# Configuration Guide: Setting Up GitHub Token and Repository

## Issue: "No active repository configured" Error

After setting up your GitHub token, you may see the error:
```
Error: No active repository configured. Please configure a repository in Settings.
```

This is expected! The app requires **two configuration steps**:

## Step-by-Step Setup

### Step 1: Set Your GitHub Token

First, configure your GitHub Personal Access Token:

```typescript
// In Settings page or via IPC:
await window.api.settings.setToken({
  token: 'ghp_YourGitHubPersonalAccessToken',
  username: 'your-github-username' // optional
});
```

**Response:**
```json
{
  "success": true,
  "message": "Token saved successfully. Please select a repository to continue."
}
```

### Step 2: Set Your Repository

After setting the token, you must configure which repository to manage:

```typescript
await window.api.settings.setRepository({
  owner: 'your-username',
  name: 'your-repository'
});
```

**Example:**
```typescript
await window.api.settings.setRepository({
  owner: 'octocat',
  name: 'Hello-World'
});
```

This sets the active repository to `octocat/Hello-World`.

## Complete Setup Flow

Here's the recommended setup flow with user feedback:

```typescript
// 1. Set token
const tokenResult = await window.api.settings.setToken({
  token: userInputToken,
  username: userInputUsername
});

if (tokenResult.success) {
  console.log('✅ Token saved!');
  
  // 2. Fetch user's repositories to let them choose
  const reposResult = await window.api.getRepositories(userInputToken);
  
  if (reposResult.success && reposResult.data) {
    // Display list of repositories to user
    const repos = reposResult.data;
    
    // User selects a repository
    const selectedRepo = repos[0]; // or from UI selection
    
    // 3. Set the selected repository
    await window.api.settings.setRepository({
      owner: selectedRepo.owner.login,
      name: selectedRepo.name
    });
    
    console.log('✅ Setup complete!');
  }
}
```

## Available IPC Handlers

### Settings Handlers

1. **settings:setToken** - Save GitHub token
   ```typescript
   window.api.settings.setToken({ token, username })
   ```

2. **settings:setRepository** - Set active repository
   ```typescript
   window.api.settings.setRepository({ owner, name })
   ```

3. **settings:getToken** - Get current token
   ```typescript
   window.api.settings.getToken()
   ```

4. **settings:get** - Get all settings
   ```typescript
   window.api.settings.get()
   ```

### GitHub Data Handlers

1. **get-repositories** - Fetch user's repositories
   ```typescript
   window.api.getRepositories(token)
   ```

2. **get-github-user** - Get authenticated user info
   ```typescript
   window.api.getGitHubUser(token)
   ```

3. **test-github-connection** - Test token validity
   ```typescript
   window.api.testGitHubConnection(token)
   ```

## UI Implementation Example

### Settings Page Flow

```typescript
// SettingsPage.tsx
import { useState } from 'react';

function SettingsPage() {
  const [token, setToken] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [step, setStep] = useState(1); // 1 = token, 2 = repo selection

  const handleSaveToken = async () => {
    try {
      // Test connection first
      const testResult = await window.api.testGitHubConnection(token);
      
      if (!testResult.success) {
        alert('Invalid token: ' + testResult.message);
        return;
      }
      
      // Get user info
      const userResult = await window.api.getGitHubUser(token);
      const username = userResult.data?.login;
      
      // Save token
      await window.api.settings.setToken({ token, username });
      
      // Fetch repositories
      const reposResult = await window.api.getRepositories(token);
      setRepos(reposResult.data || []);
      setStep(2);
      
      alert('Token saved! Now select a repository.');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleSelectRepo = async (repo) => {
    try {
      await window.api.settings.setRepository({
        owner: repo.owner.login,
        name: repo.name
      });
      
      setSelectedRepo(repo);
      alert(`✅ Setup complete! Managing: ${repo.full_name}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      
      {step === 1 && (
        <div>
          <h2>Step 1: GitHub Token</h2>
          <input
            type="password"
            placeholder="ghp_..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button onClick={handleSaveToken}>Save Token</button>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h2>Step 2: Select Repository</h2>
          <ul>
            {repos.map(repo => (
              <li key={repo.id}>
                <button onClick={() => handleSelectRepo(repo)}>
                  {repo.full_name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {selectedRepo && (
        <div>
          <h3>✅ Active Repository</h3>
          <p>{selectedRepo.full_name}</p>
        </div>
      )}
    </div>
  );
}
```

## How Repository Selection Works

### Storage Format

The repository is stored in electron-store as:

```json
{
  "github": {
    "token": "ghp_...",
    "username": "octocat",
    "defaultRepository": "octocat/Hello-World"
  }
}
```

### Retrieval in Issues Handlers

When you call `issues:list`, `issues:create`, etc., the handler:

1. Reads `github.defaultRepository` from store → `"octocat/Hello-World"`
2. Splits by `/` → `owner: "octocat"`, `name: "Hello-World"`
3. Uses these to call GitHub API → `GET /repos/octocat/Hello-World/issues`

### Error If Not Configured

If `github.defaultRepository` is missing or empty:
```
Error: No active repository configured. Please configure a repository in Settings.
```

## Verification

After setup, verify it works:

```typescript
// Test listing issues
const result = await window.api.issues.list({
  filter: { state: 'open' },
  page: 1,
  perPage: 10
});

console.log('Issues:', result.issues);
```

## Creating GitHub Personal Access Token

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` - Full control of private repositories
   - ✅ `read:user` - Read user profile data
4. Generate and copy token (starts with `ghp_`)
5. Save it securely - you won't see it again!

## Troubleshooting

### "No GitHub token found"
- Run `settings:setToken` first
- Verify token is saved: `settings:getToken`

### "No active repository configured"
- Run `settings:setRepository` after setting token
- Check current settings: `settings:get`

### "Invalid repository format"
- Ensure repository is in format `owner/name`
- Example: `octocat/Hello-World`, NOT `Hello-World`

### Issues not loading
1. Check token is valid: `test-github-connection`
2. Check repository exists and you have access
3. Verify repository is set: `settings:get`

## Summary

**Required Configuration:**
1. ✅ GitHub Personal Access Token (`settings:setToken`)
2. ✅ Repository selection (`settings:setRepository`)

**Then you can:**
- ✅ List issues from GitHub
- ✅ Create issues on GitHub
- ✅ Update issues on GitHub
- ✅ Close/delete issues on GitHub

Both steps are **required** before using issue management features!
