# macOS Status Bar & Zoom Features

This document describes the macOS-optimized status bar and zoom functionality implemented for IssueDesk.

## Features

### 1. VS Code-like Status Bar
- **Bottom-positioned status bar** with blue theme matching VS Code
- **Connection indicator** showing online/offline status
- **Application name** display
- **Zoom controls** with visual feedback

### 2. Zoom Functionality
- **Zoom In/Out buttons** with +/- icons
- **Zoom percentage display** showing current zoom level
- **Reset zoom button** with rotate icon
- **Double-click zoom percentage** to reset to 100%

### 3. Keyboard Shortcuts
- **Cmd/Ctrl + +**: Zoom in
- **Cmd/Ctrl + -**: Zoom out  
- **Cmd/Ctrl + 0**: Reset zoom to 100%

### 4. macOS-Specific Menu
- **Native macOS menu structure** with proper roles
- **Enhanced View menu** with Appearance submenu
- **macOS-specific accelerators** (Cmd instead of Ctrl)
- **Native window controls** (minimize, zoom, close)

### 5. Enhanced Window Behavior
- **Hidden inset title bar** for macOS
- **Proper traffic light positioning** 
- **Native window roles and behaviors**

## Technical Implementation

### Components
- `StatusBar.tsx` - Main status bar component with zoom controls
- `useZoom.ts` - React hook for zoom functionality management

### IPC Handlers
- `system:zoomIn` - Increase zoom level
- `system:zoomOut` - Decrease zoom level
- `system:resetZoom` - Reset to 100%
- `system:getZoomLevel` - Get current zoom level

### Zoom Levels
- **Range**: -5 to +5 (Electron zoom levels)
- **Calculation**: `Math.pow(1.2, zoomLevel) * 100`
- **Step size**: 0.5 per zoom operation

## Usage

The status bar appears at the bottom of the application window and provides:

1. **Visual feedback** for connection status
2. **Interactive zoom controls** with hover effects
3. **Keyboard shortcut support** for power users
4. **Double-click convenience** for quick zoom reset
5. **Disabled states** during zoom operations to prevent conflicts

## Cross-Platform Compatibility

While optimized for macOS, the features work on all platforms:
- **Keyboard shortcuts** adapt to platform (Cmd on macOS, Ctrl elsewhere)
- **Menu structure** adapts to platform conventions
- **Visual styling** remains consistent across platforms