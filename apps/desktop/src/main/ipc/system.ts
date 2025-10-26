import { ipcMain, app } from 'electron';

/**
 * Register all system-related IPC handlers
 */
export function registerSystemHandlers() {
  console.log('🖥️  Registering system IPC handlers...');

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
