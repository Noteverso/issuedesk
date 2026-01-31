# Backend URL Configuration - Fixed ✅

## What Was Fixed

### Problem
1. ❌ `process.env.AUTH_WORKER_URL` was undefined during production builds
2. ❌ No centralized configuration for backend URL
3. ❌ Production builds defaulted to `localhost:8787`

### Solution
✅ Created centralized environment configuration module
✅ Auto-detects development vs production
✅ Provides fallback URLs for each environment
✅ Easy to configure before building DMG

## File Changes

### New Files Created
1. **[apps/desktop/src/main/config/environment.ts](apps/desktop/src/main/config/environment.ts)** - Environment configuration module
2. **[apps/desktop/BUILD-DMG.md](apps/desktop/BUILD-DMG.md)** - DMG build guide
3. **[configure-backend.sh](configure-backend.sh)** - Script to configure backend URL

### Files Updated
1. **[apps/desktop/src/main/ipc/auth.ts](apps/desktop/src/main/ipc/auth.ts)** - Uses `getBackendUrl()`
2. **[apps/desktop/src/main/services/connectivity.ts](apps/desktop/src/main/services/connectivity.ts)** - Uses `getBackendUrl()`
3. **[apps/desktop/src/main/services/token-monitor.ts](apps/desktop/src/main/services/token-monitor.ts)** - Uses `getBackendUrl()` and `isDevelopment()`
4. **[apps/desktop/src/main/main.ts](apps/desktop/src/main/main.ts)** - Uses `isDevelopment()`

## How to Build DMG Now

### Option 1: Edit environment.ts (Recommended for repeated builds)

```bash
# 1. Edit the production URL
# Open: apps/desktop/src/main/config/environment.ts
# Line ~24: Change 'https://issuedesk-auth.your-subdomain.workers.dev'
#           to your actual backend URL

# 2. Build DMG
pnpm dist:desktop:make
```

### Option 2: Use configuration script (Quick setup)

```bash
# 1. Run configuration script
./configure-backend.sh https://issuedesk-auth.YOUR-SUBDOMAIN.workers.dev

# 2. Build DMG
pnpm dist:desktop:make
```

### Option 3: Environment variable (For CI/CD or one-time builds)

```bash
# Build with custom backend URL
AUTH_WORKER_URL="https://issuedesk-auth.YOUR-SUBDOMAIN.workers.dev" pnpm dist:desktop:make
```

## Backend URL Configuration

| Environment | Current Default | How to Change |
|-------------|----------------|---------------|
| **Development** | `http://localhost:8787` | Set `AUTH_WORKER_URL` env var |
| **Production** | `https://issuedesk-auth.your-subdomain.workers.dev` | Edit [environment.ts](apps/desktop/src/main/config/environment.ts) line 24 |

## Verify Configuration

### Check Current Backend URL

```bash
# View current production URL
cat apps/desktop/src/main/config/environment.ts | grep -A 2 "Production: use deployed"
```

### Test Before Building

```bash
# Test with production backend URL
NODE_ENV=production pnpm dev:desktop

# Check console for: "[Auth] Backend URL: https://..."
```

## Environment Module API

```typescript
import { getBackendUrl, isDevelopment, isProduction, getEnvironment } from './config/environment';

// Get backend URL (auto-detects environment)
const url = getBackendUrl(); // 'http://localhost:8787' or production URL

// Check environment
const isDev = isDevelopment(); // true in dev, false in prod
const isProd = isProduction(); // opposite of isDevelopment()
const env = getEnvironment(); // 'development' or 'production'
```

## Quick Reference

```bash
# Development (local worker)
pnpm dev:desktop
# Uses: http://localhost:8787

# Production test
NODE_ENV=production pnpm dev:desktop
# Uses: Production URL from environment.ts

# Build DMG
pnpm dist:desktop:make
# Uses: Production URL from environment.ts

# Clean build
rm -rf apps/desktop/out && pnpm dist:desktop:make
```

## Related Documentation

- [DMG Build Guide](apps/desktop/BUILD-DMG.md) - Complete DMG build instructions
- [Worker Deployment](workers/auth/DEPLOYMENT.md) - Deploy backend to Cloudflare
- [Environment Config](apps/desktop/src/main/config/environment.ts) - Source code

## Next Steps

1. ✅ Backend URL configuration fixed
2. 📝 Update production URL in [environment.ts](apps/desktop/src/main/config/environment.ts)
3. ☁️ Deploy backend worker (see [workers/auth/DEPLOYMENT.md](workers/auth/DEPLOYMENT.md))
4. 🧪 Test with: `NODE_ENV=production pnpm dev:desktop`
5. 📦 Build DMG: `pnpm dist:desktop:make`
6. ✨ Distribute!
