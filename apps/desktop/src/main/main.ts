import { app, BrowserWindow, Menu, shell, dialog, nativeImage } from 'electron';
import { join } from 'path';

import { registerIssuesHandlers } from './ipc/issues';
import { registerLabelsHandlers } from './ipc/labels';
import { registerCommentsHandlers } from './ipc/comments';
import { registerSettingsHandlers } from './ipc/settings';
import { registerSystemHandlers } from './ipc/system';
import { registerAuthHandlers } from './ipc/auth';
import { startTokenMonitor, stopTokenMonitor, checkTokenNow } from './services/token-monitor'; // T064/T065
import { startConnectivityMonitor, stopConnectivityMonitor } from './services/connectivity'; // T070c
import { ipcMain } from 'electron';
import { isDevelopment } from './config/environment';

const isDev = isDevelopment();

let mainWindow: BrowserWindow;

// Get app icon path
function getAppIconPath(): string {
  if (isDev) {
    // In development, use assets folder relative to project root
    return join(__dirname, '../../assets/icons/issue-desk-icon.png');
  } else {
    // In production, use packaged resources
    if (process.platform === 'darwin') {
      return join(process.resourcesPath, 'icon.icns');
    } else if (process.platform === 'win32') {
      return join(process.resourcesPath, 'icon.ico');
    } else {
      return join(process.resourcesPath, 'icon.png');
    }
  }
}

function createWindow(): void {
  // Debug: Log preload script path
  const preloadPath = join(__dirname, 'preload.js');
  console.log('🔧 Preload script path:', preloadPath);
  console.log('🔧 isDev:', isDev);
  console.log('🔧 __dirname:', __dirname);
  
  // Load app icon
  let appIcon;
  try {
    const iconPath = getAppIconPath();
    console.log('🔧 Loading icon from:', iconPath);
    appIcon = nativeImage.createFromPath(iconPath);
    if (appIcon.isEmpty()) {
      console.warn('⚠️ App icon is empty, using default');
    }
  } catch (error) {
    console.warn('⚠️ Failed to load app icon:', error);
  }
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      devTools: isDev,
    },
    // Use native system title bar on all platforms
    titleBarStyle: 'default',
    title: 'IssueDesk',
    show: false,
  });

  // Load the app
  if (isDev && MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('🔧 Window ready to show');
    mainWindow.show();
  });

  // Debug: Listen for preload script events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🔧 Web contents finished loading');
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('🔧 DOM ready');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null as any;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  // Register IPC handlers
  registerIssuesHandlers();
  registerLabelsHandlers();
  registerCommentsHandlers();
  registerSettingsHandlers(); // Now includes GitHub handlers (non-issue related)
  registerSystemHandlers();
  registerAuthHandlers(); // Feature: 002-github-app-auth
  
  // T064/T065: Start automatic token refresh monitoring
  startTokenMonitor();
  
  // T070c: Start connectivity monitoring for offline mode detection
  startConnectivityMonitor();
  
  // Development helper: Manual token check trigger
  if (isDev) {
    ipcMain.handle('dev:check-token-now', () => {
      console.log('[Dev] Manual token check triggered');
      checkTokenNow();
      return { success: true };
    });
  }
  
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop monitors when all windows closed
  stopTokenMonitor();
  stopConnectivityMonitor();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Create application menu
function createMenu(): void {
  const isMac = process.platform === 'darwin';
  
  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS specific app menu
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    
    // File menu for non-macOS
    ...(!isMac ? [{
      label: 'File',
      submenu: [
        {
          label: 'About IssueDesk',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About IssueDesk',
              message: 'IssueDesk Desktop Client',
              detail: 'A desktop client for managing GitHub Issues as blog posts.',
            });
          },
        },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        ...(isDev ? [{
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Cmd+Alt+I' : 'F12',
          role: 'toggleDevTools' as const
        }] : []),
        { type: 'separator' },
        {
          label: 'Appearance',
          submenu: [
            { 
              label: 'Zoom In', 
              accelerator: process.platform === 'darwin' ? 'Cmd+=' : 'Ctrl+=', 
              click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5)
            },
            { 
              label: 'Zoom Out', 
              accelerator: process.platform === 'darwin' ? 'Cmd+-' : 'Ctrl+-', 
              click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5)
            },
            { 
              label: 'Reset Zoom', 
              accelerator: process.platform === 'darwin' ? 'Cmd+0' : 'Ctrl+0', 
              click: () => mainWindow?.webContents.setZoomLevel(0)
            },
          ]
        },
        { type: 'separator' },
        { 
          label: 'Toggle Fullscreen', 
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11', 
          role: 'togglefullscreen' 
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ],
    },
    
    // Help menu
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/noteverso/issuedesk');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

