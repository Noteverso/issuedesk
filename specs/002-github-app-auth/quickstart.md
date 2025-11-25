# Quickstart: GitHub App Authorization

**Feature**: 002-github-app-auth  
**Last Updated**: 2025-11-06  
**Estimated Setup Time**: 30 minutes

## Overview

This guide walks you through setting up the development environment for GitHub App authentication in IssueDesk. You'll configure both the Electron desktop app and Cloudflare Worker backend.

---

## Prerequisites

### Required Tools

1. **Node.js** ≥18.0.0
   ```fish
   node --version  # Should be v18.0.0 or higher
   ```

2. **pnpm** (package manager)
   ```fish
   npm install -g pnpm
   pnpm --version
   ```

3. **Wrangler** (Cloudflare CLI)
   ```fish
   npm install -g wrangler
   wrangler --version
   ```

4. **GitHub Account** with organization/repo where you can install apps

5. **Cloudflare Account** (free tier works)
   - Sign up at https://dash.cloudflare.com/sign-up
   - Note your Account ID (found in Workers & Pages dashboard)

---

## Step 1: Create GitHub App

### 1.1 Register New GitHub App

1. Go to **Settings → Developer settings → GitHub Apps → New GitHub App**
   - Or direct link: https://github.com/settings/apps/new

2. Fill in app details:
   - **GitHub App name**: `IssueDesk-Dev-YourName` (must be unique)
   - **Homepage URL**: `https://github.com/yourusername/issuedesk`
   - **Callback URL**: Leave blank (not used for device flow)
   - **Request user authorization (OAuth) during installation**: ✅ Check this
   - **Device flow**: ✅ Enable
   - **Webhook**: ❌ Uncheck "Active" (not needed)

3. Set **Permissions**:
   - Repository permissions:
     - **Issues**: Read & Write
     - **Pull requests**: Read & Write
     - **Contents**: Read-only
   - Account permissions:
     - **Email addresses**: Read-only (optional, for user email)

4. **Where can this GitHub App be installed?**
   - Select "Only on this account" (for development)

5. Click **Create GitHub App**

### 1.2 Generate Private Key

1. After creation, scroll to **Private keys** section
2. Click **Generate a private key**
3. Download the `.pem` file (e.g., `issuedesk-dev.2025-11-06.private-key.pem`)
4. **Keep this file secure** - you'll upload it to Cloudflare

### 1.3 Note App Credentials

From your GitHub App settings page, copy:

- **App ID**: (e.g., `123456`)
- **Client ID**: (starts with `Iv1.`)
- **Client secrets**: Click "Generate a new client secret" and copy it immediately

**Save these values** - you'll need them in Step 3.

### 1.4 Install App on Your Account

1. Go to **Install App** tab (left sidebar)
2. Click **Install** next to your account/organization
3. Choose repositories:
   - **All repositories** (recommended for dev), or
   - **Only select repositories** (choose test repos)
4. Click **Install**

---

## Step 2: Set Up Cloudflare Worker

### 2.1 Authenticate Wrangler

```fish
wrangler login
```

This opens a browser to authorize Wrangler with your Cloudflare account.

### 2.2 Create KV Namespaces

Create two KV namespaces (one for production, one for development):

```fish
cd /Users/byodian/personal/noteverso/issuedesk/workers/auth

# Production namespace
wrangler kv:namespace create "AUTH_SESSIONS"
# Output: { binding = "AUTH_SESSIONS", id = "abc123..." }

# Development namespace
wrangler kv:namespace create "AUTH_SESSIONS" --preview
# Output: { binding = "AUTH_SESSIONS", preview_id = "def456..." }
```

**Save the namespace IDs** - you'll add them to `wrangler.toml`.

### 2.3 Configure `wrangler.toml`

Edit `workers/auth/wrangler.toml`:

```toml
name = "issuedesk-auth"
main = "src/index.ts"
compatibility_date = "2025-11-06"
nodejs_compat = true

[env.production]
kv_namespaces = [
  { binding = "AUTH_SESSIONS", id = "abc123..." }  # Replace with your production ID
]

[env.development]
kv_namespaces = [
  { binding = "AUTH_SESSIONS", preview_id = "def456..." }  # Replace with your preview ID
]

# Environment variables (non-secret)
[vars]
GITHUB_APP_ID = "123456"  # Replace with your App ID
GITHUB_CLIENT_ID = "Iv1.abc123def456"  # Replace with your Client ID
```

### 2.4 Store Secrets

Store sensitive values as Cloudflare secrets (never in git):

```fish
cd /Users/byodian/personal/noteverso/issuedesk/workers/auth

# Store client secret
wrangler secret put GITHUB_CLIENT_SECRET
# Paste your client secret when prompted

# Store private key
cat ~/Downloads/issuedesk-dev.2025-11-06.private-key.pem | wrangler secret put GITHUB_PRIVATE_KEY
# This uploads the entire private key file content
```

**Verify secrets** (won't show values, just confirms they exist):
```fish
wrangler secret list
```

---

## Step 3: Set Up Desktop App

### 3.1 Install Dependencies

```fish
cd /Users/byodian/personal/noteverso/issuedesk
pnpm install
```

### 3.2 Configure Environment

Create `.env.local` in `apps/desktop/`:

```fish
cd apps/desktop
echo 'VITE_AUTH_WORKER_URL=http://localhost:8787' > .env.local
```

**For production** (after deploying worker):
```env
VITE_AUTH_WORKER_URL=https://issuedesk-auth.your-subdomain.workers.dev
```

---

## Step 4: Local Development

### 4.1 Start Cloudflare Worker (Terminal 1)

```fish
cd /Users/byodian/personal/noteverso/issuedesk/workers/auth
pnpm run dev
```

**Expected output**:
```
⛅️ wrangler 3.x.x
------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

**Test the worker**:
```fish
curl http://localhost:8787/auth/device
```

Expected response:
```json
{
  "device_code": "...",
  "user_code": "ABCD-1234",
  "verification_uri": "https://github.com/login/device",
  "interval": 5,
  "expires_in": 900
}
```

### 4.2 Start Desktop App (Terminal 2)

```fish
cd /Users/byodian/personal/noteverso/issuedesk
pnpm run dev:desktop
```

**Expected**: Electron window opens with IssueDesk UI.

---

## Step 5: Test Authentication Flow

### 5.1 Test Login

1. In the Electron app, click **"Login with GitHub"**
2. A dialog should show:
   - User code (e.g., "ABCD-1234")
   - "Open GitHub to authorize" button
3. Click the button → GitHub authorization page opens
4. Enter the user code and authorize the app
5. Return to Electron app → should show "Logged in as [your username]"

### 5.2 Test Installation Selection

1. After login, you should see a dropdown or list of installations
2. Select your test installation
3. App should now be able to make authenticated GitHub API calls

### 5.3 Verify Token Storage

```fish
# On macOS, tokens are stored in Keychain
# Check electron-store location:
ls ~/Library/Application\ Support/issuedesk/
# You should see a config.json file (encrypted)
```

**DO NOT commit this file** - it contains encrypted tokens.

---

## Step 6: Deploy to Production

### 6.1 Deploy Cloudflare Worker

```fish
cd /Users/byodian/personal/noteverso/issuedesk/workers/auth
wrangler deploy --env production
```

**Expected output**:
```
Uploaded issuedesk-auth (X.XX sec)
Published issuedesk-auth (X.XX sec)
  https://issuedesk-auth.your-subdomain.workers.dev
```

**Copy the worker URL** - you'll need it for desktop app config.

### 6.2 Update Desktop App Config

1. Create production GitHub App (separate from dev):
   - Follow Step 1 again with production app name
   - Use production domain in Homepage URL

2. Update Cloudflare secrets for production:
   ```fish
   wrangler secret put GITHUB_CLIENT_SECRET --env production
   wrangler secret put GITHUB_PRIVATE_KEY --env production
   ```

3. Update `wrangler.toml` vars for production:
   ```toml
   [env.production.vars]
   GITHUB_APP_ID = "789012"  # Production app ID
   GITHUB_CLIENT_ID = "Iv1.xyz789"  # Production client ID
   ```

4. Build desktop app with production worker URL:
   ```fish
   cd apps/desktop
   echo 'VITE_AUTH_WORKER_URL=https://issuedesk-auth.your-subdomain.workers.dev' > .env.production
   pnpm run build
   ```

---

## Troubleshooting

### Issue: "Failed to initiate device flow"

**Cause**: GitHub App credentials incorrect

**Fix**:
1. Verify `GITHUB_APP_ID` and `GITHUB_CLIENT_ID` in `wrangler.toml`
2. Check `GITHUB_CLIENT_SECRET` is set: `wrangler secret list`
3. Ensure GitHub App has "Device flow" enabled

---

### Issue: "Invalid private key"

**Cause**: Private key not formatted correctly

**Fix**:
```fish
# Ensure private key has proper newlines
cat ~/Downloads/your-private-key.pem | wrangler secret put GITHUB_PRIVATE_KEY

# Verify it starts with:
# -----BEGIN RSA PRIVATE KEY-----
# And ends with:
# -----END RSA PRIVATE KEY-----
```

---

### Issue: Worker returns CORS errors

**Cause**: Electron app origin not allowed

**Fix**: Update `workers/auth/src/index.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'electron://issuedesk'   // Electron protocol
];
```

---

### Issue: "Installation not accessible"

**Cause**: App not installed on user's account

**Fix**:
1. Go to GitHub App settings → Install App
2. Verify app is installed on your account/org
3. Check permissions match spec (Issues: write, PRs: write)

---

### Issue: Polling times out

**Cause**: User didn't authorize within 15 minutes

**Fix**:
1. Check polling interval is 5 seconds (not faster)
2. Verify user code is displayed correctly
3. Ensure browser opens to correct `verification_uri`

---

## Verification Checklist

Before considering setup complete, verify:

- [ ] Worker responds to `POST /auth/device`
- [ ] Desktop app shows user code dialog on login click
- [ ] Browser opens to GitHub authorization page
- [ ] After authorization, app shows user profile
- [ ] Installation list displays correctly
- [ ] Selecting installation enables GitHub API calls
- [ ] Tokens are stored encrypted (check electron-store)
- [ ] Logout clears all local session data
- [ ] Worker enforces rate limits (test with 6 rapid requests)
- [ ] Token auto-refreshes before 1-hour expiry

---

## Next Steps

After completing setup:

1. **Read the contracts**:
   - `specs/002-github-app-auth/contracts/ipc.md` (Electron IPC)
   - `specs/002-github-app-auth/contracts/backend-api.md` (REST API)

2. **Review data model**:
   - `specs/002-github-app-auth/data-model.md` (Entities & schemas)

3. **Run tests**:
   ```fish
   pnpm test:contract  # IPC contract tests
   pnpm test:e2e       # End-to-end auth flow
   ```

4. **Implement features**:
   - Follow task breakdown in `specs/002-github-app-auth/tasks.md`
   - Start with P1 tasks (Initial Authentication & Security)

---

## Security Reminders

🔒 **Never commit these files**:
- `.env.local`, `.env.production`
- `*.pem` (private keys)
- `~/Library/Application Support/issuedesk/config.json` (encrypted tokens)

🔒 **Use Cloudflare secrets for**:
- `GITHUB_CLIENT_SECRET`
- `GITHUB_PRIVATE_KEY`

🔒 **Public values (safe in git)**:
- `GITHUB_APP_ID`
- `GITHUB_CLIENT_ID`
- Worker URL

---

## Resources

- **GitHub Device Flow Docs**: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#using-the-device-flow-to-generate-a-user-access-token
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Cloudflare KV Docs**: https://developers.cloudflare.com/kv/
- **Wrangler CLI Reference**: https://developers.cloudflare.com/workers/wrangler/
- **electron-store**: https://github.com/sindresorhus/electron-store

---

**Questions?** Open an issue or check `specs/002-github-app-auth/spec.md` for feature details.
