import { ipcMain } from 'electron';
import { GitHubClient } from '@issuedesk/github-api';
import { SettingsManager } from '../settings/manager';
import { KeychainManager } from '../security/keychain';
import { r2Service } from '../services/r2';

// Initialize managers
const settingsManager = new SettingsManager();
const keychainManager = new KeychainManager();

/**
 * Register all settings-related IPC handlers
 */
export function registerSettingsHandlers() {
  console.log('📋 Registering settings IPC handlers...');

  // Get settings
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = settingsManager.getAll();
      
      // console.log('✅ Settings retrieved:', settings);
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
      // Update theme if provided
      if (req.theme) {
        settingsManager.setTheme(req.theme);
      }
      
      // Update editor mode if provided
      if (req.editorMode) {
        settingsManager.setEditorMode(req.editorMode);
      }
      
      // Update view preferences if provided
      if (req.viewPreferences) {
        settingsManager.setViewPreferences(req.viewPreferences);
      }
      
      const settings = settingsManager.getAll();
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
      const repositoryId = `${req.owner}/${req.name}`;
      settingsManager.setRepository({
        id: repositoryId,
        owner: req.owner,
        name: req.name,
        dbPath: '', // Will be set by database manager
        lastSyncAt: null,
      });
      
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
      settingsManager.setActiveRepository(req.repositoryId);
      
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
      const token = keychainManager.getToken();
      
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
      keychainManager.setToken(req.token);
      
      console.log('✅ Token set for user:', req.username);
      return { success: true };
    } catch (error) {
      console.error('❌ Error setting token:', error);
      return { success: false };
    }
  });

  // Test GitHub connection
  ipcMain.handle('settings:testConnection', async (event, token: string) => {
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
  ipcMain.handle('settings:getUser', async (event, token: string) => {
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
  ipcMain.handle('settings:getRepositories', async (event, token: string) => {
    try {
      if (!token) {
        return {
          success: false,
          data: [],
          message: 'Token is required',
        };
      }

      const client = new GitHubClient(token);
      // Use getInstallationRepositories for GitHub App tokens
      // This endpoint returns repositories accessible by the installation
      const result = await client.getInstallationRepositories({
        per_page: 100,
      });
      
      if (result.success && result.data) {
        console.log('✅ Repositories retrieved:', result.data.length);
        return {
          success: true,
          data: result.data,
        };
      }
      
      return {
        success: false,
        data: [],
        message: result.message || 'Failed to retrieve repositories',
      };
    } catch (error) {
      console.error('❌ Error getting repositories:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to get repositories',
      };
    }
  });

  // Set R2 configuration
  ipcMain.handle('settings:setR2Config', async (event, req) => {
    try {
      // Save R2 config to settings
      settingsManager.setR2Config(req);
      
      // Configure the R2 service
      r2Service.setConfig(req);
      
      console.log('✅ R2 configuration saved');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving R2 configuration:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save R2 configuration',
      };
    }
  });

  // Get R2 configuration
  ipcMain.handle('settings:getR2Config', async () => {
    try {
      const settings = settingsManager.getAll();
      return { config: settings.r2Config || null };
    } catch (error) {
      console.error('❌ Error getting R2 configuration:', error);
      return { config: null };
    }
  });

  // Test R2 connection
  ipcMain.handle('settings:testR2Connection', async () => {
    try {
      return await r2Service.testConnection();
    } catch (error) {
      console.error('❌ Error testing R2 connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test R2 connection',
      };
    }
  });

  // Upload to R2
  ipcMain.handle('settings:uploadToR2', async (event, req) => {
    try {
      const buffer = Buffer.from(req.buffer);
      return await r2Service.uploadImage(buffer, req.fileName, req.contentType);
    } catch (error) {
      console.error('❌ Error uploading to R2:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload to R2',
      };
    }
  });

  console.log('✅ Settings IPC handlers registered successfully');
  console.log('   - settings:get ✓');
  console.log('   - settings:update ✓');
  console.log('   - settings:setRepository ✓');
  console.log('   - settings:switchRepository ✓');
  console.log('   - settings:getToken ✓');
  console.log('   - settings:setToken ✓');
  console.log('   - settings:testConnection ✓');
  console.log('   - settings:getUser ✓');
  console.log('   - settings:getRepositories ✓');
  console.log('   - settings:setR2Config ✓');
  console.log('   - settings:getR2Config ✓');
  console.log('   - settings:testR2Connection ✓');
  console.log('   - settings:uploadToR2 ✓');
}
