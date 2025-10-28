import { ipcMain, app, shell } from 'electron';

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

  console.log('✅ System IPC handlers registered');
}
