import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import { join } from 'path';

import { registerIssuesHandlers } from './ipc/issues';
import { registerLabelsHandlers } from './ipc/labels';
import { registerCommentsHandlers } from './ipc/comments';
import { registerSettingsHandlers } from './ipc/settings';
import { registerSystemHandlers } from './ipc/system';
import { registerAuthHandlers } from './ipc/auth';

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';

let mainWindow: BrowserWindow;

function createWindow(): void {
  // Debug: Log preload script path
  const preloadPath = join(__dirname, 'preload.js');
  console.log('🔧 Preload script path:', preloadPath);
  console.log('🔧 isDev:', isDev);
  console.log('🔧 __dirname:', __dirname);
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
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
  
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
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
        { label: 'Toggle Developer Tools', accelerator: process.platform === 'darwin' ? 'Cmd+Alt+I' : 'F12', role: 'toggleDevTools' },
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

