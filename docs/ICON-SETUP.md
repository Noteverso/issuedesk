# Electron Icon Setup - Quick Reference

## ✅ Current Setup

Your Electron app icons are fully configured for all platforms.

## 📁 Icon Files Location

```
apps/desktop/assets/icons/
├── issue-desk-icon.icns     # macOS (73 KB)
├── issue-desk-icon.ico      # Windows (432 KB)
├── issue-desk-icon.png      # Linux/Dev (82 KB, 512x512)
└── issue-desk-icon-256.png  # Linux alt (27 KB, 256x256)
```

## 🔧 Configuration

### Electron Forge ([forge.config.ts](apps/desktop/forge.config.ts))

```typescript
packagerConfig: {
  icon: './assets/icons/issue-desk-icon', // Auto-detects .icns/.ico
  appBundleId: 'com.issuedesk.app',
  // ...
}

makers: [
  new MakerDMG({
    icon: './assets/icons/issue-desk-icon.icns',
  }),
  new MakerSquirrel({
    setupIcon: './assets/icons/issue-desk-icon.ico',
  }),
  new MakerRpm({
    options: { icon: './assets/icons/issue-desk-icon.png' }
  }),
  new MakerDeb({
    options: { icon: './assets/icons/issue-desk-icon.png' }
  }),
]
```

### Main Process ([src/main/main.ts](apps/desktop/src/main/main.ts))

```typescript
import { nativeImage } from 'electron';

// Icon loaded dynamically in createWindow()
const appIcon = nativeImage.createFromPath(iconPath);
new BrowserWindow({
  icon: appIcon,
  // ...
})
```

## 🧪 Testing

### Development
```bash
pnpm run dev:desktop
# Check window icon in taskbar/dock
```

### Build & Package
```bash
# macOS
pnpm --filter @issuedesk/desktop package
# Check: out/IssueDesk-darwin-arm64/IssueDesk.app

# Windows
pnpm --filter @issuedesk/desktop make --platform=win32
# Check: out/make/squirrel.windows/

# Linux
pnpm --filter @issuedesk/desktop make --platform=linux
# Check: out/make/deb/ or out/make/rpm/
```

## ✨ Where Icons Appear

| Platform | Locations |
|----------|-----------|
| **macOS** | • Dock<br>• Finder<br>• Launchpad<br>• App switcher (⌘+Tab)<br>• DMG installer |
| **Windows** | • Taskbar<br>• Start menu<br>• Desktop shortcut<br>• Exe file<br>• Installer |
| **Linux** | • Application launcher<br>• Window title bar<br>• Task switcher<br>• .deb/.rpm package |

## 🐛 Troubleshooting

### Icon not showing in development

**Problem**: Window shows default Electron icon

**Solution**: 
1. Check console for icon loading errors
2. Verify PNG exists: `ls apps/desktop/assets/icons/issue-desk-icon.png`
3. macOS: May need to restart after first build

### Icon not showing after build

**Problem**: Packaged app shows default icon

**Solution**:
1. Clean build folder: `rm -rf apps/desktop/out`
2. Rebuild: `pnpm --filter @issuedesk/desktop package`
3. macOS: Run `touch out/IssueDesk-darwin-arm64/IssueDesk.app` to refresh icon cache

### macOS icon cache issues

**Solution**:
```bash
# Force icon refresh
killall Finder
killall Dock
```

## 📝 Notes

- **macOS**: `.icns` must contain multiple sizes (16px - 1024px)
- **Windows**: `.ico` should contain sizes: 16, 32, 48, 64, 128, 256
- **Linux**: `.png` at 512x512 recommended for HiDPI support
- **Development**: PNG fallback used in dev mode for faster loading

## 🔗 References

- [Electron Icons Documentation](https://www.electronjs.org/docs/latest/tutorial/application-distribution#platform-specific-icons)
- [Electron Forge Icons](https://www.electronforge.io/guides/create-and-add-icons)
- [Icon Guidelines](assets/icons/README.md)
