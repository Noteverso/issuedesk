# Cloudflare Worker Secrets Setup

**Feature**: 002-github-app-auth  
**Task**: T033 - Configure Worker secrets

## Overview

Sensitive credentials for GitHub App authentication must be stored as Cloudflare Worker secrets, never in code or version control. This ensures:
- Private keys and client secrets remain backend-only
- Production credentials are isolated from development
- Secrets are encrypted at rest by Cloudflare

## Required Secrets

The following secrets must be configured via `wrangler secret put`:

1. **GITHUB_APP_ID** - Your GitHub App's numeric ID
2. **GITHUB_PRIVATE_KEY** - RSA private key in PKCS8 format (see PRIVATE-KEY-CONVERSION.md)
3. **GITHUB_CLIENT_ID** - OAuth client ID (starts with "Iv1.")
4. **GITHUB_CLIENT_SECRET** - OAuth client secret

## Setup Commands

### Development Environment

```bash
cd workers/auth

# Set each secret for development environment
wrangler secret put GITHUB_APP_ID --env development
# Paste your GitHub App ID when prompted (e.g., 123456)

wrangler secret put GITHUB_CLIENT_ID --env development
# Paste your client ID when prompted (e.g., Iv1.abc123...)

wrangler secret put GITHUB_CLIENT_SECRET --env development
# Paste your client secret when prompted

wrangler secret put GITHUB_PRIVATE_KEY --env development
# Paste your ENTIRE private key including BEGIN/END lines:
# -----BEGIN PRIVATE KEY-----
# MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
# ...
# -----END PRIVATE KEY-----
```

### Production Environment

```bash
cd workers/auth

# Set each secret for production environment
wrangler secret put GITHUB_APP_ID --env production
wrangler secret put GITHUB_CLIENT_ID --env production
wrangler secret put GITHUB_CLIENT_SECRET --env production
wrangler secret put GITHUB_PRIVATE_KEY --env production
```

## Verification

After setting secrets, verify they're configured:

```bash
# List secrets (shows names only, not values)
wrangler secret list --env development
wrangler secret list --env production
```

Expected output:
```
[
  {
    "name": "GITHUB_APP_ID",
    "type": "secret_text"
  },
  {
    "name": "GITHUB_PRIVATE_KEY",
    "type": "secret_text"
  },
  {
    "name": "GITHUB_CLIENT_ID",
    "type": "secret_text"
  },
  {
    "name": "GITHUB_CLIENT_SECRET",
    "type": "secret_text"
  }
]
```

## Local Development

For local development, secrets are read from `.dev.vars` file (not committed to git):

```bash
# Create .dev.vars file
cd workers/auth
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your development credentials
```

See `ENV_SETUP.md` for detailed local development setup.

## Security Notes

1. **Never commit secrets** to version control (.dev.vars is gitignored)
2. **Use different credentials** for development vs production
3. **Rotate secrets regularly** (update via `wrangler secret put`)
4. **Private key format** must be PKCS8 (see PRIVATE-KEY-CONVERSION.md)
5. **Verify secrets are set** before deploying to production

## Updating Secrets

To update an existing secret:

```bash
wrangler secret put SECRET_NAME --env <environment>
# Enter new value when prompted
```

## Deleting Secrets

To remove a secret (use with caution):

```bash
wrangler secret delete SECRET_NAME --env <environment>
```

## Troubleshooting

**Error: "Missing required environment variables"**
- Run `wrangler secret list` to verify all 4 secrets are configured
- Check that you're deploying to the correct environment (--env flag)

**Error: "Invalid private key format"**
- Ensure private key is in PKCS8 format (starts with "BEGIN PRIVATE KEY")
- See PRIVATE-KEY-CONVERSION.md for conversion instructions

**Error: "GitHub API authentication failed"**
- Verify GitHub App ID matches your app
- Verify client ID/secret are correct (regenerate in GitHub if needed)
- Check private key matches the one uploaded to GitHub App settings

## References

- [Cloudflare Workers Secrets Documentation](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler Secret Commands](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- GitHub App Settings: https://github.com/settings/apps/YOUR_APP_NAME
