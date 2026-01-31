# Cloudflare Worker Deployment Guide

**IssueDesk Auth Backend Service**  
**Feature**: 002-github-app-auth  
**Last Updated**: 2026-01-29

## Overview

This guide covers deploying the IssueDesk authentication backend as a Cloudflare Worker. The worker handles GitHub App device flow authentication, token management, and session storage.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloudflare Account Setup](#cloudflare-account-setup)
3. [KV Namespace Setup](#kv-namespace-setup)
4. [GitHub App Configuration](#github-app-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Deployment](#deployment)
7. [Custom Domain Setup](#custom-domain-setup)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- **Node.js** ≥18.0.0 installed
- **pnpm** package manager installed
- **Cloudflare account** (free tier is sufficient for testing)
- **GitHub App** created (see [GitHub App Configuration](#github-app-configuration))
- **Wrangler CLI** installed (included in dev dependencies)

## Cloudflare Account Setup

### 1. Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account (no credit card required for Workers)
3. Verify your email address

### 2. Install Wrangler CLI

Wrangler is already included in the project dependencies:

```bash
cd workers/auth
pnpm install
```

### 3. Authenticate Wrangler

Login to your Cloudflare account:

```bash
npx wrangler login
```

This will open a browser window to authorize Wrangler with your Cloudflare account.

### 4. Get Account ID

After logging in, find your Account ID:

```bash
npx wrangler whoami
```

Or visit: https://dash.cloudflare.com → Workers & Pages → Overview (Account ID displayed in right sidebar)

---

## KV Namespace Setup

Cloudflare KV (Key-Value) stores session data for authenticated users.

### Create KV Namespaces

You need separate KV namespaces for development and production:

```bash
cd workers/auth

# Create production namespace
npx wrangler kv:namespace create "SESSIONS" --preview false

# Create production preview namespace (for wrangler dev)
npx wrangler kv:namespace create "SESSIONS" --preview

# Create development namespace
npx wrangler kv:namespace create "SESSIONS" --env development --preview false

# Create development preview namespace
npx wrangler kv:namespace create "SESSIONS" --env development --preview
```

### Update wrangler.toml

After creating namespaces, Wrangler will output IDs like:

```
{ binding = "SESSIONS", id = "abc123..." }
{ binding = "SESSIONS", preview_id = "def456..." }
```

Update [wrangler.toml](wrangler.toml) with the actual IDs:

```toml
# Default (production) KV namespace
[[kv_namespaces]]
binding = "SESSIONS"
id = "abc123..."           # Replace with your production KV ID
preview_id = "def456..."   # Replace with your production preview ID

[env.development]
name = "issuedesk-auth-dev"
kv_namespaces = [
  { binding = "SESSIONS", id = "ghi789...", preview_id = "jkl012..." }  # Replace with dev KV IDs
]
```

### Verify KV Namespaces

List all namespaces to confirm:

```bash
npx wrangler kv:namespace list
```

---

## GitHub App Configuration

### 1. Create GitHub App

If you haven't created a GitHub App yet:

1. Go to https://github.com/settings/apps/new
2. Fill in the required fields:
   ```
   GitHub App name: IssueDesk (or your preferred name)
   Homepage URL: https://github.com/yourusername/issuedesk
   Callback URL: (leave blank - we use device flow)
   Webhook: (disable - not needed)
   ```
3. **Set Permissions**:
   - **Repository permissions**:
     - Issues: Read and write
     - Metadata: Read-only
     - Contents: Read and write (for issue attachments)
   - **Organization permissions**: None required
4. **Where can this GitHub App be installed?**: Any account
5. Click **Create GitHub App**

### 2. Collect Credentials

After creating the app, collect these credentials:

1. **App ID**: Found at the top of the app settings page
   - Example: `123456`
   - Used for `GITHUB_APP_ID`

2. **Private Key**: Click "Generate a private key"
   - Downloads a `.pem` file
   - Used for `GITHUB_PRIVATE_KEY`
   - **Important**: Convert to PKCS8 format (see [PRIVATE-KEY-CONVERSION.md](PRIVATE-KEY-CONVERSION.md))

3. **Client ID**: Found in "OAuth credentials" section
   - Starts with `Iv1.`
   - Used for `GITHUB_CLIENT_ID`

4. **Client Secret**: Click "Generate a new client secret"
   - One-time display only - save it securely
   - Used for `GITHUB_CLIENT_SECRET`

### 3. Install the GitHub App

1. Go to your GitHub App settings page
2. Click "Install App" in the left sidebar
3. Choose which account/organization to install to
4. Select repositories (all or specific)
5. Click "Install"

---

## Environment Configuration

### Development Environment

For local development, use `.dev.vars` file:

```bash
cd workers/auth

# Create .dev.vars from example (if not already present)
cat > .dev.vars << EOF
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.abc123...
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...
-----END PRIVATE KEY-----"
EOF
```

**Important**: 
- `.dev.vars` is gitignored - never commit it
- See [ENV_SETUP.md](ENV_SETUP.md) for detailed formatting instructions
- Private key must be in PKCS8 format (see [PRIVATE-KEY-CONVERSION.md](PRIVATE-KEY-CONVERSION.md))

### Production Environment

For production, use Wrangler secrets (encrypted and stored by Cloudflare):

```bash
cd workers/auth

# Set production secrets
npx wrangler secret put GITHUB_APP_ID --env production
# Paste: 123456

npx wrangler secret put GITHUB_CLIENT_ID --env production
# Paste: Iv1.abc123...

npx wrangler secret put GITHUB_CLIENT_SECRET --env production
# Paste: your_client_secret

npx wrangler secret put GITHUB_PRIVATE_KEY --env production
# Paste entire private key including BEGIN/END lines:
# -----BEGIN PRIVATE KEY-----
# MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
# ...
# -----END PRIVATE KEY-----
```

### Verify Secrets

```bash
# List secrets (shows names only, not values)
npx wrangler secret list --env production
```

Expected output:
```json
[
  { "name": "GITHUB_APP_ID", "type": "secret_text" },
  { "name": "GITHUB_PRIVATE_KEY", "type": "secret_text" },
  { "name": "GITHUB_CLIENT_ID", "type": "secret_text" },
  { "name": "GITHUB_CLIENT_SECRET", "type": "secret_text" }
]
```

---

## Deployment

### Local Testing

Before deploying, test locally:

```bash
cd workers/auth

# Start local development server
pnpm dev

# In another terminal, test the health endpoint
curl http://localhost:8787/health

# Test device flow initiation
curl -X POST http://localhost:8787/auth/device \
  -H "Content-Type: application/json"
```

Expected responses:
```json
// Health check
{ "status": "ok", "worker": "issuedesk-auth" }

// Device flow
{
  "device_code": "3584d83...",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 900,
  "interval": 5
}
```

### Deploy to Development

```bash
cd workers/auth

# Deploy to development environment
pnpm deploy:dev
# or
npx wrangler deploy --env development
```

### Deploy to Production

```bash
cd workers/auth

# Type check before deploying
pnpm type-check

# Deploy to production
pnpm deploy:prod
# or
npx wrangler deploy --env production
```

### Deployment Output

After successful deployment, you'll see:

```
✨ Successfully published your worker to:
  https://yourname.workers.dev
```

### Test Production Deployment

```bash
# Test health endpoint
curl https://yourname.workers.dev/health

# Test device flow
curl -X POST https://yourname.workers.dev/auth/device \
  -H "Content-Type: application/json"
```

---

## Custom Domain Setup

### 1. Add Domain to Cloudflare

If you have a custom domain:

1. Go to https://dash.cloudflare.com
2. Click "Add site"
3. Enter your domain (e.g., `issuedesk.com`)
4. Follow DNS setup instructions

### 2. Configure Worker Route

1. Go to Workers & Pages → issuedesk-auth → Settings → Triggers
2. Click "Add Custom Domain"
3. Enter subdomain: `auth.issuedesk.com`
4. Click "Add Custom Domain"

Cloudflare will automatically provision SSL certificates.

### 3. Update Desktop App Configuration

Update the desktop app to use your custom domain:

```typescript
// apps/desktop/src/main/services/auth-service.ts
const BACKEND_URL = 'https://auth.issuedesk.com';
```

---

## Monitoring & Logs

### Real-time Logs

View live logs during development:

```bash
npx wrangler tail --env production
```

### Cloudflare Dashboard

View logs and metrics in the Cloudflare dashboard:

1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages → issuedesk-auth
3. Click "Logs" or "Metrics"

Available metrics:
- **Requests**: Total requests per time period
- **Success Rate**: Percentage of successful requests
- **Errors**: Error count and types
- **CPU Time**: Worker execution time
- **KV Operations**: KV read/write operations

### Debugging

Enable debug logs in production:

```bash
# Tail logs with filters
npx wrangler tail --env production --format json | jq 'select(.level == "error")'
```

---

## Troubleshooting

### Common Issues

#### 1. "Missing environment variables" error

**Symptom**: Worker returns `CONFIGURATION_ERROR`

**Solution**:
```bash
# Verify secrets are set
npx wrangler secret list --env production

# Set missing secrets
npx wrangler secret put GITHUB_APP_ID --env production
```

#### 2. "Invalid GITHUB_PRIVATE_KEY format" error

**Symptom**: Worker rejects private key

**Solution**:
- Ensure key is in PKCS8 format (starts with `BEGIN PRIVATE KEY`)
- Convert PKCS1 to PKCS8 (see [PRIVATE-KEY-CONVERSION.md](PRIVATE-KEY-CONVERSION.md))
```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt \
  -in private-key.pem -out private-key-pkcs8.pem
```

#### 3. "KV namespace not found" error

**Symptom**: Session storage fails

**Solution**:
```bash
# Verify KV namespaces exist
npx wrangler kv:namespace list

# Check wrangler.toml has correct IDs
cat wrangler.toml | grep -A 2 "kv_namespaces"
```

#### 4. CORS errors from desktop app

**Symptom**: Browser shows CORS error

**Solution**: The worker includes CORS headers. Verify:
- Desktop app uses correct backend URL
- OPTIONS preflight requests are handled
- See [src/index.ts](src/index.ts) for CORS configuration

#### 5. Rate limiting errors

**Symptom**: GitHub API returns 429 errors

**Solution**:
- GitHub Apps have higher rate limits (5000 req/hour)
- Use installation tokens (separate rate limit per installation)
- Check rate limit status:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/rate_limit
```

### Getting Help

For additional support:

1. Check [SECRETS-SETUP.md](SECRETS-SETUP.md) for secrets configuration
2. Check [ENV_SETUP.md](ENV_SETUP.md) for environment setup
3. Review [PRIVATE-KEY-CONVERSION.md](PRIVATE-KEY-CONVERSION.md) for key format issues
4. Check Cloudflare Workers docs: https://developers.cloudflare.com/workers/
5. Open an issue in the repository

---

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [KV Storage Documentation](https://developers.cloudflare.com/kv/)
- [ENV_SETUP.md](ENV_SETUP.md) - Environment variables guide
- [SECRETS-SETUP.md](SECRETS-SETUP.md) - Secrets configuration
- [PRIVATE-KEY-CONVERSION.md](PRIVATE-KEY-CONVERSION.md) - Private key conversion

---

## Security Checklist

Before deploying to production:

- [ ] All secrets stored via `wrangler secret put` (not in code)
- [ ] `.dev.vars` is gitignored and not committed
- [ ] Private key converted to PKCS8 format
- [ ] GitHub App installed with minimal required permissions
- [ ] Custom domain configured with SSL/TLS
- [ ] Monitoring and logging enabled
- [ ] KV namespaces created for session storage
- [ ] CORS configured for desktop app origin
- [ ] Rate limiting strategy in place

---

## Deployment Checklist

- [ ] Cloudflare account created and authenticated
- [ ] KV namespaces created for both environments
- [ ] GitHub App created with correct permissions
- [ ] All secrets configured via Wrangler
- [ ] Local testing completed successfully
- [ ] Development deployment tested
- [ ] Production deployment completed
- [ ] Custom domain configured (optional)
- [ ] Desktop app updated with backend URL
- [ ] Monitoring dashboard configured

---

**Next Steps**: After successful deployment, update your desktop app configuration to point to the deployed worker URL.
