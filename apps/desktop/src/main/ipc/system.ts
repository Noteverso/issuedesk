import { ipcMain, app, shell, BrowserWindow, dialog } from 'electron';
import { readFile } from 'fs/promises';
import path from 'path';

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

  // Image upload functionality
  ipcMain.handle('system:selectImage', async () => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (!focusedWindow) {
        return { success: false, message: 'No focused window' };
      }

      const result = await dialog.showOpenDialog(focusedWindow, {
        title: 'Select Image',
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']
          }
        ],
        properties: ['openFile']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'No file selected' };
      }

      const filePath = result.filePaths[0];
      const fileName = path.basename(filePath);
      const fileBuffer = await readFile(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      // Determine content type
      const contentTypeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
      };
      const contentType = contentTypeMap[fileExtension] || 'image/png';

      console.log('📁 Selected image:', fileName, `(${fileBuffer.length} bytes)`);

      return {
        success: true,
        filePath, // Add filePath for compatibility with MarkdownEditor
        data: {
          fileName,
          contentType,
          buffer: Array.from(fileBuffer), // Convert Buffer to array for IPC
          size: fileBuffer.length
        }
      };
    } catch (error) {
      console.error('❌ Error selecting image:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  // Convert image file to data URL for immediate preview
  ipcMain.handle('system:imageToDataUrl', async (_event, { buffer, contentType }: { buffer: number[]; contentType: string }) => {
    try {
      const bufferData = Buffer.from(buffer);
      const base64Data = bufferData.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Data}`;
      
      console.log('🖼️ Created data URL for image:', contentType, `(${bufferData.length} bytes)`);
      
      return {
        success: true,
        data: {
          url: dataUrl,
          size: bufferData.length
        }
      };
    } catch (error) {
      console.error('❌ Error creating data URL:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });

  console.log('✅ System IPC handlers registered');
}
