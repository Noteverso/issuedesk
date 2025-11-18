# Environment Variables Setup

This guide explains how to configure environment variables for the IssueDesk Auth Worker.

## Required Variables

The worker requires the following GitHub App credentials:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `GITHUB_APP_ID` | Your GitHub App ID | GitHub App Settings → About section |
| `GITHUB_PRIVATE_KEY` | RSA private key (PEM format) | GitHub App Settings → Generate a private key |
| `GITHUB_CLIENT_ID` | OAuth Client ID | GitHub App Settings → OAuth credentials |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret | GitHub App Settings → Generate a client secret |

## Local Development Setup

1. **Edit `.dev.vars` file:**
   ```bash
   cd workers/auth
   # Edit .dev.vars with your actual credentials
   ```

2. **Format the Private Key:**
   The private key must be on a single line with `\n` for newlines:
   ```
   GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"
   ```

   You can convert a multi-line PEM file to single line:
   ```bash
   # macOS/Linux
   awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' private-key.pem
   ```

3. **Start development server:**
   ```bash
   pnpm --filter @issuedesk/auth-worker dev
   ```

## Production Deployment

For production, use Wrangler secrets instead of `.dev.vars`:

```bash
cd workers/auth

# Set each secret
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_PRIVATE_KEY
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
```

## Creating a GitHub App

If you haven't created a GitHub App yet:

1. Go to https://github.com/settings/apps/new
2. Fill in:
   - **App name**: IssueDesk (or your preferred name)
   - **Homepage URL**: Your app URL
   - **Callback URL**: Not required for device flow
   - **Webhook**: Not required initially
3. Set **Permissions**:
   - Repository permissions:
     - Issues: Read and write
     - Metadata: Read-only
   - Organization permissions: None required initially
4. **Where can this GitHub App be installed?**: Choose based on your needs
5. Click **Create GitHub App**
6. After creation:
   - Note the **App ID** → Use for `GITHUB_APP_ID`
   - Click **Generate a private key** → Download and use for `GITHUB_PRIVATE_KEY`
   - Go to OAuth credentials section
   - Note the **Client ID** → Use for `GITHUB_CLIENT_ID`
   - Click **Generate a new client secret** → Use for `GITHUB_CLIENT_SECRET`

## Verifying Setup

Test your configuration:

```bash
# Start the worker
pnpm --filter @issuedesk/auth-worker dev

# In another terminal, test the device flow endpoint
curl -X POST http://localhost:8787/auth/device -H "Content-Type: application/json"
```

Expected response (if configured correctly):
```json
{
  "device_code": "...",
  "user_code": "XXXX-XXXX",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 900,
  "interval": 5
}
```

If you see an error about missing environment variables, double-check your `.dev.vars` file.

## Security Notes

- ⚠️ **Never commit `.dev.vars`** to version control (already in `.gitignore`)
- 🔒 Private keys should be kept secure and rotated periodically
- 🔐 Use different credentials for development and production
- 📝 Consider using a separate GitHub App for local development

## Troubleshooting

**Error: "Missing required environment variables"**
- Ensure `.dev.vars` file exists in `workers/auth/` directory
- Check that all four variables are set
- Restart `wrangler dev` after editing `.dev.vars`

**Error: "Invalid private key"**
- Ensure private key is in PEM format
- Check that newlines are escaped as `\n`
- Verify the key starts with `-----BEGIN` and ends with `-----END`

**GitHub API errors**
- Verify App ID matches your GitHub App
- Check that the private key corresponds to the App ID
- Ensure Client ID and Secret are from the same GitHub App
