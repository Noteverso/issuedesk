import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import { join } from 'path';
import Store from 'electron-store';
import { GitHubClient } from '@gitissueblog/github-api';
import { AppConfig } from '@gitissueblog/shared';

const isDev = process.env.NODE_ENV === 'development';
const store = new Store<AppConfig>();

let mainWindow: BrowserWindow;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'GitIssueBlog',
      submenu: [
        {
          label: 'About GitIssueBlog',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About GitIssueBlog',
              message: 'GitIssueBlog Desktop Client',
              detail: 'A desktop client for managing GitHub Issues as blog posts.',
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
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
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', role: 'close' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle('get-config', () => {
  return store.store;
});

ipcMain.handle('set-config', (_, config: Partial<AppConfig>) => {
  store.set(config);
  return store.store;
});

ipcMain.handle('test-github-connection', async (_, token: string) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.testConnection();
    return result;
  } catch (error) {
    return {
      data: false,
      success: false,
      message: 'Connection failed',
    };
  }
});

ipcMain.handle('get-github-user', async (_, token: string) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.getCurrentUser();
    return result;
  } catch (error) {
    return {
      data: null,
      success: false,
      message: 'Failed to get user information',
    };
  }
});

ipcMain.handle('get-repositories', async (_, token: string) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.getRepositories();
    return result;
  } catch (error) {
    return {
      data: [],
      success: false,
      message: 'Failed to get repositories',
    };
  }
});

ipcMain.handle('get-issues', async (_, token: string, owner: string, repo: string, options: any) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.getIssues(owner, repo, options);
    return result;
  } catch (error) {
    return {
      data: [],
      success: false,
      message: 'Failed to get issues',
    };
  }
});

ipcMain.handle('create-issue', async (_, token: string, owner: string, repo: string, issue: any) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.createIssue(owner, repo, issue);
    return result;
  } catch (error) {
    return {
      data: null,
      success: false,
      message: 'Failed to create issue',
    };
  }
});

ipcMain.handle('update-issue', async (_, token: string, owner: string, repo: string, number: number, issue: any) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.updateIssue(owner, repo, number, issue);
    return result;
  } catch (error) {
    return {
      data: null,
      success: false,
      message: 'Failed to update issue',
    };
  }
});

ipcMain.handle('get-labels', async (_, token: string, owner: string, repo: string) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.getLabels(owner, repo);
    return result;
  } catch (error) {
    return {
      data: [],
      success: false,
      message: 'Failed to get labels',
    };
  }
});

ipcMain.handle('create-label', async (_, token: string, owner: string, repo: string, label: any) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.createLabel(owner, repo, label);
    return result;
  } catch (error) {
    return {
      data: null,
      success: false,
      message: 'Failed to create label',
    };
  }
});

ipcMain.handle('update-label', async (_, token: string, owner: string, repo: string, name: string, label: any) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.updateLabel(owner, repo, name, label);
    return result;
  } catch (error) {
    return {
      data: null,
      success: false,
      message: 'Failed to update label',
    };
  }
});

ipcMain.handle('delete-label', async (_, token: string, owner: string, repo: string, name: string) => {
  try {
    const client = new GitHubClient(token);
    const result = await client.deleteLabel(owner, repo, name);
    return result;
  } catch (error) {
    return {
      data: undefined,
      success: false,
      message: 'Failed to delete label',
    };
  }
});
