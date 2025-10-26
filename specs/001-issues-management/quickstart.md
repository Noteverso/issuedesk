# Quickstart: GitHub Issues Management Development

**Feature**: 001-issues-management  
**Date**: 2025-10-26

## Prerequisites

- **Node.js**: ≥18.0.0 (check: `node --version`)
- **npm**: ≥9.0.0 (check: `npm --version`)
- **Git**: Installed for repository cloning
- **GitHub Account**: With personal access token (classic)
- **OS**: macOS, Windows 10+, or Linux (Ubuntu 20.04+)

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/issuedesk.git
cd issuedesk
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for the entire monorepo workspace (root + all packages).

### 3. Build Shared Packages

Before running the desktop app, build shared packages:

```bash
npm run build --workspace=@issuedesk/shared
npm run build --workspace=@issuedesk/github-api
```

Or use the helper script:

```bash
npm run build:packages
```

---

## Development Workflow

### Start Desktop App (Development Mode)

```bash
npm run dev --workspace=@issuedesk/desktop
```

Or from repository root:

```bash
npm run dev:desktop
```

This starts:
- **Vite dev server** for renderer process (React) at `http://localhost:5173`
- **Electron** with hot-reload enabled
- **TypeScript watch mode** for main process

**What to expect**:
1. Electron window opens
2. On first launch, you'll see "No repository configured"
3. Navigate to Settings → Add GitHub token and repository

---

## Testing

### Run All Tests

```bash
npm test
```

### Unit Tests (Vitest)

```bash
npm run test:unit --workspace=@issuedesk/shared
npm run test:unit --workspace=@issuedesk/github-api
```

### Contract Tests (IPC)

```bash
npm run test:contract
```

This uses Playwright to test IPC communication between main/renderer.

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

Runs full application flow tests (create issue → sync → verify on GitHub).

---

## Database Management

### View Local Database

SQLite databases are stored at:

- **macOS**: `~/Library/Application Support/IssueDesk/repositories/`
- **Windows**: `%APPDATA%\IssueDesk\repositories\`
- **Linux**: `~/.config/IssueDesk/repositories/`

**Inspect with SQLite CLI**:

```bash
# macOS/Linux
sqlite3 ~/Library/Application\ Support/IssueDesk/repositories/github-octocat-hello-world.db

# Inside SQLite shell:
.tables
SELECT * FROM issues LIMIT 5;
.quit
```

**Inspect with GUI** (recommended):

- [DB Browser for SQLite](https://sqlitebrowser.org/) (cross-platform)
- [TablePlus](https://tableplus.com/) (macOS/Windows)

---

### Reset Database

Delete a repository's database to start fresh:

```bash
# macOS
rm ~/Library/Application\ Support/IssueDesk/repositories/github-OWNER-REPO.db

# Restart app - new database will be created on next repository connect
```

---

## GitHub Token Setup

### Create Personal Access Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Set scopes:
   - ✅ `repo` (full repository access)
   - ✅ `read:user` (read user profile)
4. Copy token (starts with `ghp_`)

⚠️ **Never commit tokens to git!** Tokens are stored in OS keychain by the app.

### Add Token in App

1. Launch app
2. Navigate to **Settings** page
3. Paste token in "GitHub Token" field
4. Click "Save"
5. Enter repository owner and name (e.g., `octocat` / `hello-world`)
6. Click "Connect Repository"

---

## Development Tips

### Hot Reload

- **Renderer changes** (React components): Hot reload automatically
- **Main process changes** (IPC handlers, database): Requires app restart (automatic with `npm run dev`)
- **Shared package changes**: Run `npm run build --workspace=@issuedesk/shared` then restart app

### Debug Main Process

Add breakpoints in VS Code:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/apps/desktop",
      "runtimeExecutable": "${workspaceFolder}/apps/desktop/node_modules/.bin/electron",
      "args": [".", "--remote-debugging-port=9223"],
      "outputCapture": "std"
    }
  ]
}
```

Then: **Run → Start Debugging** (F5)

### Debug Renderer Process

1. In running Electron app: **View → Toggle Developer Tools** (Cmd+Opt+I / F12)
2. Use React DevTools (installed automatically)
3. Inspect IPC calls in **Console** tab

---

## Project Structure Quick Reference

```
apps/desktop/
├── src/
│   ├── main/              # Main process (Node.js)
│   │   ├── database/      # SQLite layer
│   │   ├── ipc/           # IPC handlers
│   │   └── sync/          # GitHub sync engine
│   ├── preload/           # Context bridge
│   └── renderer/          # React app
│       ├── pages/         # Dashboard, Issues, Labels, Settings
│       └── components/    # Reusable UI components

packages/
├── shared/                # Types, schemas, utilities
└── github-api/            # GitHub API client
```

---

## Common Issues

### "Module not found" errors

**Solution**: Rebuild shared packages

```bash
npm run build:packages
```

### Database locked error

**Solution**: Close all SQLite connections

```bash
# macOS/Linux
lsof ~/Library/Application\ Support/IssueDesk/repositories/*.db | grep IssueDesk | awk '{print $2}' | xargs kill
```

### Rate limit errors in dev

**Solution**: Use a dedicated test repository with few issues, or mock GitHub API in tests.

### Token not saving

**Solution**: Check OS keychain permissions. On macOS, grant "Keychain Access" permission to IssueDesk app.

---

## Building for Production

### Package Desktop App

```bash
npm run build --workspace=@issuedesk/desktop
npm run package --workspace=@issuedesk/desktop
```

Output:
- **macOS**: `apps/desktop/dist/IssueDesk-1.0.0.dmg`
- **Windows**: `apps/desktop/dist/IssueDesk-Setup-1.0.0.exe`
- **Linux**: `apps/desktop/dist/IssueDesk-1.0.0.AppImage`

### Code Signing (macOS)

Requires Apple Developer account:

```bash
# Set environment variables
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"

npm run package --workspace=@issuedesk/desktop
```

---

## Next Steps

1. **Read architecture docs**: See [data-model.md](./data-model.md) and [contracts/ipc.md](./contracts/ipc.md)
2. **Run tests**: `npm test` to validate setup
3. **Start development**: Follow task list in [tasks.md](./tasks.md) (generated by `/tasks` command)
4. **Join discussions**: Check GitHub Issues for feature requests and bugs

---

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Tiptap Editor](https://tiptap.dev/docs/editor/introduction)
- [Octokit (GitHub API)](https://github.com/octokit/octokit.js)
- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/wiki/API)

---

**Questions?** Open an issue or contact the maintainers.
