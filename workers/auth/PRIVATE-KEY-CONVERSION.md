# Converting GitHub App Private Key to PKCS8

## Problem

GitHub generates private keys in **PKCS1 format** (starts with `-----BEGIN RSA PRIVATE KEY-----`), but the Cloudflare Worker's WebCrypto API requires **PKCS8 format** (starts with `-----BEGIN PRIVATE KEY-----`).

## Solution

### Option 1: Convert Using OpenSSL (Recommended)

```bash
# Navigate to where your GitHub private key file is located
cd ~/Downloads  # or wherever you saved it

# Convert PKCS1 to PKCS8
openssl pkcs8 -topk8 -nocrypt -in your-github-app.pem -out your-github-app-pkcs8.pem

# View the converted key
cat your-github-app-pkcs8.pem
```

The output should start with:
```
-----BEGIN PRIVATE KEY-----
```
(Note: no "RSA" in the header)

### Option 2: Use Online Converter

If you don't have OpenSSL installed:

1. Go to https://8gwifi.org/PemParserFunctions.jsp
2. Paste your PKCS1 key
3. Select "RSA Private Key" format
4. Click "Convert to PKCS8"
5. Copy the result

⚠️ **Security Warning**: Only use trusted tools for production keys!

### Update .dev.vars

After converting, update your `.dev.vars` file:

```bash
cd /Users/byodian/personal/noteverso/issuedesk/workers/auth

# Edit .dev.vars
# Replace GITHUB_PRIVATE_KEY value with the PKCS8 formatted key
# Remember to escape newlines as \n
```

Example format in `.dev.vars`:
```
GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhk...\n-----END PRIVATE KEY-----"
```

### Verify the Format

Your key is in the correct format if:
- ✅ Starts with `-----BEGIN PRIVATE KEY-----` (PKCS8)
- ❌ Starts with `-----BEGIN RSA PRIVATE KEY-----` (PKCS1 - needs conversion)

## Troubleshooting

**Error: "internal error; reference = ..."**
- This indicates the private key is likely in the wrong format
- Convert to PKCS8 and try again

**Error: "Failed to import key as PKCS8"**
- Check that the key is properly formatted
- Ensure newlines are escaped as `\n` in `.dev.vars`
- Verify no extra spaces or characters were added during copy/paste

## Testing

After updating the key:

```bash
# Restart the worker
pnpm --filter @issuedesk/auth-worker dev

# Test the device flow
curl -X POST http://localhost:8787/auth/device -H "Content-Type: application/json"
```

You should get a successful response with `device_code` and `user_code`.
