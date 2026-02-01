# Quickstart: IssueDesk Mobile App

**Feature**: 004-mobile-app  
**Date**: 2026-02-01

## Prerequisites

- Node.js ≥18.0.0
- npm ≥9.0.0 or pnpm
- Expo CLI (`npm install -g expo-cli` or use npx)
- iOS Simulator (macOS) or Android Emulator
- Expo Go app on physical device (optional)

## Setup

### 1. Install Dependencies

From the repository root:

```bash
# Install all workspace dependencies
pnpm install

# Build shared packages (required for mobile to use)
pnpm build:packages
```

### 2. Navigate to Mobile App

```bash
cd apps/mobile
```

### 3. Start Development Server

```bash
# Start Expo development server
pnpm start

# Or with specific platform
pnpm ios      # iOS Simulator
pnpm android  # Android Emulator
```

### 4. Environment Configuration

Create `.env` file in `apps/mobile/`:

```env
# Auth Backend URL
EXPO_PUBLIC_AUTH_API_URL=https://issuedesk-auth.workers.dev

# Optional: Local development backend
# EXPO_PUBLIC_AUTH_API_URL=http://localhost:8787
```

## Project Structure

```
apps/mobile/
├── App.tsx              # Root component
├── app.json             # Expo configuration
├── src/
│   ├── api/             # API clients
│   ├── components/      # UI components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── navigation/      # React Navigation setup
│   ├── screens/         # Screen components
│   ├── services/        # Business logic
│   └── styles/          # Theme and shared styles
└── tests/               # Test files
```

## Key Files to Start With

1. **Navigation Setup**: `src/navigation/AppNavigator.tsx`
2. **Auth Flow**: `src/contexts/AuthContext.tsx`
3. **API Client**: `src/api/client.ts`
4. **Theme**: `src/styles/theme.ts`

## Development Workflow

### Adding a New Screen

1. Create screen component in `src/screens/<feature>/`
2. Add to navigator in `src/navigation/`
3. Define any new types in `src/types/`

### Using Shared Types

```typescript
import { Issue, Label, Comment } from '@issuedesk/shared';
```

### Secure Storage

```typescript
import { storage } from '../services/storage';

// Save token
await storage.setToken(accessToken);

// Get token
const token = await storage.getToken();
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test --coverage
```

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Build both
eas build --platform all
```

## Troubleshooting

### Metro bundler issues

```bash
# Clear cache and restart
pnpm start --clear
```

### Shared package changes not reflecting

```bash
# Rebuild shared packages
cd ../..
pnpm build:packages
cd apps/mobile
pnpm start --clear
```

### iOS Simulator not starting

```bash
# Open iOS Simulator manually first
open -a Simulator
pnpm ios
```

## Related Documentation

- [Feature Spec](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/api.md)
- [Research](./research.md)
