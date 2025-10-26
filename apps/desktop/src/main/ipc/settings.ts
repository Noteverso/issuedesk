import { ipcMain } from 'electron';
import Store from 'electron-store';
import { GitHubClient } from '@issuedesk/github-api';
import type { AppConfig, AppSettings } from '@issuedesk/shared';

// Initialize electron-store for simple key-value settings
const defaultConfig: AppConfig = {
  github: {
    token: '',
    username: '',
    defaultRepository: '',
  },
  editor: {
    theme: 'light',
    fontSize: 14,
    autoSave: true,
    autoSaveInterval: 5000,
  },
  ui: {
    sidebarWidth: 300,
    showLineNumbers: true,
    wordWrap: true,
  },
};

const store = new Store<AppConfig>({ defaults: defaultConfig });

/**
 * Convert legacy AppConfig to new AppSettings format
 */
function configToSettings(config: AppConfig): AppSettings {
  return {
    activeRepositoryId: config.github.defaultRepository || null,
    repositories: config.github.defaultRepository ? [{
      id: config.github.defaultRepository,
      owner: config.github.defaultRepository.split('/')[0] || '',
      name: config.github.defaultRepository.split('/')[1] || '',
      token: config.github.token,
      isDefault: true,
    }] : [],
    theme: config.editor.theme,
    editorMode: 'preview', // Default value
    viewPreferences: {
      issues: 'list',
      labels: 'list',
    },
    rateLimit: null,
  };
}

/**
 * Register all settings-related IPC handlers
 */
export function registerSettingsHandlers() {
  console.log('📋 Registering settings IPC handlers...');

  // Legacy get-config handler (for backward compatibility)
  ipcMain.handle('get-config', async () => {
    try {
      const config = store.store;
      console.log('✅ Config retrieved (legacy):', config);
      return config;
    } catch (error) {
      console.error('❌ Error getting config:', error);
      return store.store;
    }
  });

  // Legacy set-config handler (for backward compatibility)
  ipcMain.handle('set-config', async (event, partialConfig: Partial<AppConfig>) => {
    try {
      store.set(partialConfig);
      const config = store.store;
      console.log('✅ Config updated (legacy):', config);
      return config;
    } catch (error) {
      console.error('❌ Error setting config:', error);
      return store.store;
    }
  });

  // Get settings
  ipcMain.handle('settings:get', async () => {
    try {
      const config = store.store;
      const settings = configToSettings(config);
      
      console.log('✅ Settings retrieved:', settings);
      return { settings };
    } catch (error) {
      console.error('❌ Error getting settings:', error);
      // Return default settings on error
      return {
        settings: {
          activeRepositoryId: null,
          repositories: [],
          theme: 'light' as const,
          editorMode: 'preview' as const,
          viewPreferences: {
            issues: 'list' as const,
            labels: 'list' as const,
          },
          rateLimit: null,
        },
      };
    }
  });

  // Update settings
  ipcMain.handle('settings:update', async (event, req) => {
    try {
      const config = store.store;
      
      // Update theme if provided
      if (req.theme) {
        config.editor.theme = req.theme;
      }
      
      // Save updated config
      store.store = config;
      
      const settings = configToSettings(config);
      console.log('✅ Settings updated:', settings);
      
      return { settings };
    } catch (error) {
      console.error('❌ Error updating settings:', error);
      throw error;
    }
  });

  // Set repository
  ipcMain.handle('settings:setRepository', async (event, req) => {
    try {
      const config = store.store;
      config.github.defaultRepository = `${req.owner}/${req.name}`;
      store.store = config;
      
      console.log('✅ Repository set:', req);
      return { success: true };
    } catch (error) {
      console.error('❌ Error setting repository:', error);
      return { success: false };
    }
  });

  // Switch repository
  ipcMain.handle('settings:switchRepository', async (event, req) => {
    try {
      const config = store.store;
      config.github.defaultRepository = req.repositoryId;
      store.store = config;
      
      console.log('✅ Repository switched to:', req.repositoryId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error switching repository:', error);
      return { success: false };
    }
  });

  // Get token
  ipcMain.handle('settings:getToken', async () => {
    try {
      const config = store.store;
      const token = config.github.token || null;
      
      console.log('✅ Token retrieved:', token ? '***' : 'none');
      return { token };
    } catch (error) {
      console.error('❌ Error getting token:', error);
      return { token: null };
    }
  });

  // Set token
  ipcMain.handle('settings:setToken', async (event, req) => {
    try {
      const config = store.store;
      config.github.token = req.token;
      config.github.username = req.username || '';
      store.store = config;
      
      console.log('✅ Token set for user:', req.username);
      return { success: true };
    } catch (error) {
      console.error('❌ Error setting token:', error);
      return { success: false };
    }
  });

  console.log('✅ Settings IPC handlers registered successfully');
  console.log('   - get-config ✓');
  console.log('   - set-config ✓');
  console.log('   - settings:get ✓');
  console.log('   - settings:update ✓');
  console.log('   - settings:setRepository ✓');
  console.log('   - settings:switchRepository ✓');
  console.log('   - settings:getToken ✓');
  console.log('   - settings:setToken ✓');
}

/**
 * Register GitHub-related IPC handlers
 */
export function registerGitHubHandlers() {
  console.log('🐙 Registering GitHub IPC handlers...');

  // Test GitHub connection
  ipcMain.handle('test-github-connection', async (event, token: string) => {
    try {
      if (!token) {
        return {
          success: false,
          data: false,
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      
      // Try to get authenticated user to verify token
      const result = await client.request<any>('/user');
      
      if (result.success && result.data) {
        console.log('✅ GitHub connection successful for user:', result.data.login);
        return {
          success: true,
          data: true,
          message: `Connected as ${result.data.login}`,
        };
      } else {
        console.log('❌ GitHub connection failed');
        return {
          success: false,
          data: false,
          message: 'Failed to authenticate',
        };
      }
    } catch (error) {
      console.error('❌ Error testing GitHub connection:', error);
      return {
        success: false,
        data: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  });

  // Get GitHub user
  ipcMain.handle('get-github-user', async (event, token: string) => {
    try {
      if (!token) {
        return {
          success: false,
          data: null,
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.request<any>('/user');
      
      if (result.success) {
        console.log('✅ GitHub user retrieved:', result.data?.login);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error getting GitHub user:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  });

  // Get repositories
  ipcMain.handle('get-repositories', async (event, token: string) => {
    try {
      if (!token) {
        return {
          success: false,
          data: [],
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.request<any[]>('/user/repos', {
        params: {
          sort: 'updated',
          per_page: 100,
        },
      });
      
      if (result.success) {
        console.log('✅ Repositories retrieved:', result.data?.length || 0);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error getting repositories:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to get repositories',
      };
    }
  });

  // Get issues
  ipcMain.handle('get-issues', async (event, token: string, owner: string, repo: string, options?: any) => {
    try {
      if (!token) {
        return {
          success: false,
          data: [],
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.getIssues(owner, repo, options);
      
      if (result.success) {
        console.log('✅ Issues retrieved:', result.data?.length || 0);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error getting issues:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to get issues',
      };
    }
  });

  // Create issue
  ipcMain.handle('create-issue', async (event, token: string, owner: string, repo: string, issue: any) => {
    try {
      if (!token) {
        return {
          success: false,
          data: null,
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.createIssue(owner, repo, issue);
      
      if (result.success) {
        console.log('✅ Issue created:', result.data?.number);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error creating issue:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to create issue',
      };
    }
  });

  // Update issue
  ipcMain.handle('update-issue', async (event, token: string, owner: string, repo: string, number: number, issue: any) => {
    try {
      if (!token) {
        return {
          success: false,
          data: null,
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.updateIssue(owner, repo, number, issue);
      
      if (result.success) {
        console.log('✅ Issue updated:', number);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error updating issue:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update issue',
      };
    }
  });

  // Get labels
  ipcMain.handle('get-labels', async (event, token: string, owner: string, repo: string) => {
    try {
      if (!token) {
        return {
          success: false,
          data: [],
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.getLabels(owner, repo);
      
      if (result.success) {
        console.log('✅ Labels retrieved:', result.data?.length || 0);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error getting labels:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to get labels',
      };
    }
  });

  // Create label
  ipcMain.handle('create-label', async (event, token: string, owner: string, repo: string, label: any) => {
    try {
      if (!token) {
        return {
          success: false,
          data: null,
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.createLabel(owner, repo, label);
      
      if (result.success) {
        console.log('✅ Label created:', result.data?.name);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error creating label:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to create label',
      };
    }
  });

  // Update label
  ipcMain.handle('update-label', async (event, token: string, owner: string, repo: string, name: string, label: any) => {
    try {
      if (!token) {
        return {
          success: false,
          data: null,
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.updateLabel(owner, repo, name, label);
      
      if (result.success) {
        console.log('✅ Label updated:', name);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error updating label:', error);
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to update label',
      };
    }
  });

  // Delete label
  ipcMain.handle('delete-label', async (event, token: string, owner: string, repo: string, name: string) => {
    try {
      if (!token) {
        return {
          success: false,
          data: undefined,
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      const result = await client.deleteLabel(owner, repo, name);
      
      if (result.success) {
        console.log('✅ Label deleted:', name);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error deleting label:', error);
      return {
        success: false,
        data: undefined,
        message: error instanceof Error ? error.message : 'Failed to delete label',
      };
    }
  });

  console.log('✅ GitHub IPC handlers registered');
}
