# Test Setup Guide

This directory contains tests for the IssueDesk application.

## Test Structure

```
tests/
├── contract/       # IPC contract tests (Vitest)
│   └── issues.spec.ts
├── e2e/           # End-to-end tests (Playwright + Electron)
│   ├── issue-management.spec.ts
│   └── markdown-editor.spec.ts
├── integration/   # Cross-package integration tests
└── unit/          # Unit tests for shared packages
```

## Prerequisites

### 1. Install Test Dependencies

```bash
# Install Vitest for contract/unit tests
npm install -D vitest @vitest/ui

# Install Playwright for E2E tests with Electron support
npm install -D @playwright/test
```

### 2. Create Vitest Configuration

Create `vitest.config.ts` in the repository root:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
    exclude: ['tests/e2e/**/*'], // E2E tests use Playwright
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        '**/*.config.ts',
        '**/dist/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@issuedesk/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@issuedesk/github-api': path.resolve(__dirname, 'packages/github-api/src'),
    },
  },
});
```

### 3. Create Playwright Configuration

Create `playwright.config.ts` in the repository root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Electron tests should run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run one test at a time for Electron
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  // Electron-specific configuration
  projects: [
    {
      name: 'electron',
      use: {
        // Custom Electron launcher configuration
        launchOptions: {
          executablePath: require('electron'), // Points to Electron binary
          args: ['.'],
        },
      },
    },
  ],
});
```

### 4. Create Test Setup File

Create `tests/setup.ts`:

```typescript
import { beforeAll, afterAll, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite complete');
});

afterEach(() => {
  // Clean up after each test
});
```

### 5. Add Test Scripts to package.json

Add to root `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Running Tests

### Contract/Unit Tests (Vitest)

```bash
# Run all contract tests
npm test

# Run specific test file
npm test tests/contract/issues.spec.ts

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/issue-management.spec.ts

# Run with UI (interactive mode)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

## Test Data Setup

### For E2E Tests

Create test fixtures in `tests/fixtures/`:

```typescript
// tests/fixtures/test-data.ts
export const testIssues = [
  {
    title: 'Test Issue 1',
    body: 'This is a test issue',
    state: 'open' as const,
  },
  {
    title: 'Test Issue 2',
    body: '**Markdown** content',
    state: 'closed' as const,
  },
];
```

### Mock GitHub API

Create mock API responses in `tests/mocks/`:

```typescript
// tests/mocks/github-api.ts
export const mockGitHubAPI = {
  issues: {
    list: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn((data) => Promise.resolve({ data: { ...data, number: 1 } })),
    update: vi.fn((data) => Promise.resolve({ data })),
  },
};
```

## Current Test Status

### ✅ Test Files Created (Blueprint Stage)

All test files have been created with comprehensive test cases but are marked as `test.skip()` because:

1. **Vitest** is not yet installed
2. **Playwright** is not yet configured for Electron
3. **Test database** setup is needed
4. **IPC test utilities** need to be implemented

### 📋 Next Steps to Enable Tests

1. **Install dependencies** (see above)
2. **Create configuration files** (vitest.config.ts, playwright.config.ts)
3. **Implement test utilities**:
   - Database fixtures for seeding test data
   - IPC client wrapper for contract tests
   - GitHub API mocking
4. **Remove `test.skip()`** from test files
5. **Update selectors** with actual data-testid attributes
6. **Run tests** to validate implementation

## Test Coverage Goals

- **Unit Tests**: 80% coverage for shared packages
- **Contract Tests**: 100% of IPC API surface
- **E2E Tests**: Critical user flows (create, edit, delete issues)
- **Integration Tests**: Cross-package interactions

## CI/CD Integration

Add to `.github/workflows/ci.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      
  e2e:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

## Debugging Tests

### Vitest

```bash
# Run in watch mode
npm test -- --watch

# Debug specific test
npm test -- --inspect-brk tests/contract/issues.spec.ts
```

### Playwright

```bash
# Visual debugging
npm run test:e2e:debug

# Generate trace
npm run test:e2e -- --trace on

# View trace
npx playwright show-trace trace.zip
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Playwright Electron](https://playwright.dev/docs/api/class-electron)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
