import { ipcMain, app, shell, BrowserWindow } from 'electron';

/**
 * Register all system-related IPC handlers
 */
export function registerSystemHandlers() {
  console.log('🖥️  Registering system IPC handlers...');

  // Open external URL
  ipcMain.handle('system:openExternal', async (_event, { url }: { url: string }) => {
    try {
      console.log('🔗 Opening external URL:', url);
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('❌ Error opening external URL:', error);
      return { success: false };
    }
  });

  // Get version information
  ipcMain.handle('system:getVersion', async () => {
    try {
      const info = {
        version: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node,
      };
      
      console.log('✅ Version info retrieved:', info);
      return info;
    } catch (error) {
      console.error('❌ Error getting version info:', error);
      return {
        version: '0.0.1',
        electronVersion: 'unknown',
        nodeVersion: 'unknown',
      };
    }
  });

  // Get system information
  ipcMain.handle('system:getInfo', async () => {
    try {
      const info = {
        version: app.getVersion(),
        platform: process.platform,
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
      };
      
      console.log('✅ System info retrieved:', info);
      return info;
    } catch (error) {
      console.error('❌ Error getting system info:', error);
      return {
        version: '0.0.1',
        platform: 'unknown',
        electron: 'unknown',
        chrome: 'unknown',
        node: 'unknown',
      };
    }
  });

  // Check for updates (placeholder)
  ipcMain.handle('system:checkForUpdates', async () => {
    try {
      // TODO: Implement actual update checking logic
      console.log('⏳ Checking for updates...');
      
      return {
        available: false,
        currentVersion: app.getVersion(),
        latestVersion: app.getVersion(),
      };
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      return {
        available: false,
        currentVersion: app.getVersion(),
      };
    }
  });

  // Zoom functionality
  ipcMain.handle('system:zoomIn', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        const currentZoom = focusedWindow.webContents.getZoomLevel();
        const newZoom = Math.min(currentZoom + 0.5, 5); // Max zoom level 5
        focusedWindow.webContents.setZoomLevel(newZoom);
        console.log('🔍 Zoom in:', newZoom);
        return { success: true, zoomLevel: newZoom };
      }
      return { success: false };
    } catch (error) {
      console.error('❌ Error zooming in:', error);
      return { success: false };
    }
  });

  ipcMain.handle('system:zoomOut', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        const currentZoom = focusedWindow.webContents.getZoomLevel();
        const newZoom = Math.max(currentZoom - 0.5, -5); // Min zoom level -5
        focusedWindow.webContents.setZoomLevel(newZoom);
        console.log('🔍 Zoom out:', newZoom);
        return { success: true, zoomLevel: newZoom };
      }
      return { success: false };
    } catch (error) {
      console.error('❌ Error zooming out:', error);
      return { success: false };
    }
  });

  ipcMain.handle('system:resetZoom', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.webContents.setZoomLevel(0);
        console.log('🔍 Reset zoom to 100%');
        return { success: true, zoomLevel: 0 };
      }
      return { success: false };
    } catch (error) {
      console.error('❌ Error resetting zoom:', error);
      return { success: false };
    }
  });

  ipcMain.handle('system:getZoomLevel', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        const zoomLevel = focusedWindow.webContents.getZoomLevel();
        return { success: true, zoomLevel };
      }
      return { success: false, zoomLevel: 0 };
    } catch (error) {
      console.error('❌ Error getting zoom level:', error);
      return { success: false, zoomLevel: 0 };
    }
  });

  // Set window title
  ipcMain.handle('system:setWindowTitle', async (_event, title: string) => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (focusedWindow) {
        focusedWindow.setTitle(title);
        console.log('🪟 Window title set:', title);
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('❌ Error setting window title:', error);
      return { success: false };
    }
  });

  console.log('✅ System IPC handlers registered');
}
