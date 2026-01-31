# IssueDesk Application Icons

This folder contains all the necessary icon files for the IssueDesk desktop application across different platforms.

## Icon Files

| File | Platform | Size | Format | Usage |
|------|----------|------|--------|-------|
| `issue-desk-icon.icns` | macOS | Multiple sizes | ICNS | App bundle icon, DMG installer |
| `issue-desk-icon.ico` | Windows | Multiple sizes | ICO | Executable icon, installer |
| `issue-desk-icon.png` | Linux/Dev | 512x512 | PNG | Linux packages, window icon |
| `issue-desk-icon-256.png` | Linux | 256x256 | PNG | Alternative Linux icon |

## Platform-Specific Requirements

### macOS (.icns)
- Contains multiple sizes: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512, 1024x1024
- Used by Electron Forge for `.app` bundle
- Automatically applied to DMG installer

### Windows (.ico)
- Contains multiple sizes: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256
- Used for executable and installer
- Required for Windows taskbar and system tray

### Linux (.png)
- 512x512 recommended for high-DPI displays
- Used for window icon and desktop entries
- Debian/RPM packages use this for system integration

## Configuration

Icons are configured in [forge.config.ts](../../forge.config.ts):

```typescript
packagerConfig: {
  icon: './assets/icons/issue-desk-icon', // Auto-selects .icns or .ico
  // ...
}
```

## Regenerating Icons

If you need to regenerate icons from a source file:

### From PNG to ICNS (macOS)
```bash
# Create iconset directory
mkdir issue-desk-icon.iconset

# Generate all required sizes
sips -z 16 16     source.png --out issue-desk-icon.iconset/icon_16x16.png
sips -z 32 32     source.png --out issue-desk-icon.iconset/icon_16x16@2x.png
sips -z 32 32     source.png --out issue-desk-icon.iconset/icon_32x32.png
sips -z 64 64     source.png --out issue-desk-icon.iconset/icon_32x32@2x.png
sips -z 128 128   source.png --out issue-desk-icon.iconset/icon_128x128.png
sips -z 256 256   source.png --out issue-desk-icon.iconset/icon_128x128@2x.png
sips -z 256 256   source.png --out issue-desk-icon.iconset/icon_256x256.png
sips -z 512 512   source.png --out issue-desk-icon.iconset/icon_256x256@2x.png
sips -z 512 512   source.png --out issue-desk-icon.iconset/icon_512x512.png
sips -z 1024 1024 source.png --out issue-desk-icon.iconset/icon_512x512@2x.png

# Convert to ICNS
iconutil -c icns issue-desk-icon.iconset
```

### From PNG to ICO (Windows)
Use an online converter or ImageMagick:
```bash
convert source.png -define icon:auto-resize=256,128,64,48,32,16 issue-desk-icon.ico
```

### From ICNS to PNG (Extract)
```bash
sips -s format png issue-desk-icon.icns --out issue-desk-icon.png
```

## Design Guidelines

For best results when creating app icons:

1. **Source file**: Start with at least 1024x1024 PNG
2. **Format**: Square, no transparency for background
3. **Style**: 
   - Simple, recognizable at small sizes
   - High contrast
   - Avoid fine details that don't scale well
4. **Testing**: Test at 16x16 to ensure legibility

## Current Icon

The current IssueDesk icon represents:
- **Theme**: Issue/ticket management
- **Design**: Minimalist, professional
- **Colors**: Brand colors

## Updating Icons

When updating icons:

1. Replace source files in this folder
2. Regenerate platform-specific formats
3. Test on all target platforms:
   - macOS: Check Dock, Finder, Launchpad
   - Windows: Check taskbar, Start menu, desktop
   - Linux: Check app launcher, title bar
4. Commit all formats to version control
