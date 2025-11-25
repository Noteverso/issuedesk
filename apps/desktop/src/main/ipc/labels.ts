import { ipcMain } from 'electron';
import {
  CreateLabelInputSchema,
  UpdateLabelInputSchema,
} from '@issuedesk/shared';
import { z } from 'zod';
import { GitHubClient } from '@issuedesk/github-api';
import { getSettingsManager } from '../settings/manager';
import { getKeychainManager } from '../security/keychain';
import { getStoredSession } from '../storage/auth-store';

/**
 * IPC handlers for labels operations
 * All handlers validate input with Zod schemas
 * Implements GitHub REST API integration
 */

/**
 * Get GitHub client using installation token from session.
 * Falls back to PAT from keychain for backwards compatibility.
 */
function getGitHubClient(): GitHubClient | null {
  // Try to get installation token from auth session (GitHub App)
  console.log('[Labels] Attempting to retrieve session...');
  const session = getStoredSession();
  
  console.log('[Labels] Session retrieved:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userLogin: session?.user?.login,
    hasInstallationToken: !!session?.installationToken,
    tokenLength: session?.installationToken?.token?.length,
    currentInstallation: session?.currentInstallation?.id,
  });
  
  if (session?.installationToken?.token) {
    console.log('[Labels] ✅ Using GitHub App installation token');
    console.log('[Labels] Token expires at:', session.installationToken.expires_at);
    return new GitHubClient(session.installationToken.token);
  }
  
  // Fallback to PAT for backwards compatibility
  console.log('[Labels] No installation token found, trying PAT fallback...');
  const keychain = getKeychainManager();
  const token = keychain.getToken();
  
  if (!token) {
    console.error('[Labels] ❌ No GitHub token found. Please login with GitHub App or configure PAT.');
    return null;
  }
  
  console.warn('[Labels] ⚠️  Using legacy PAT authentication (deprecated)');
  return new GitHubClient(token);
}

/**
 * Get active repository configuration from SettingsManager
 */
function getActiveRepository() {
  const settings = getSettingsManager();
  const activeId = settings.getActiveRepositoryId();
  
  console.log('🔍 Debug - Getting active repository:');
  console.log('  - Active ID:', activeId);
  console.log('  - All repositories:', settings.getRepositories());
  
  if (!activeId) {
    throw new Error('No active repository configured. Please configure a repository in Settings.');
  }
  
  const repo = settings.getRepository(activeId);
  if (!repo) {
    throw new Error(`Active repository '${activeId}' not found in settings.`);
  }
  
  console.log('  - Found repository:', repo);
  
  return repo;
}

// Schema for label delete request
const LabelDeleteRequestSchema = z.object({
  id: z.string().min(1),
});

export function registerLabelsHandlers() {
  console.log('🏷️  Registering labels IPC handlers...');

  // labels:list - List all labels from GitHub API
  ipcMain.handle('labels:list', async (_event, _req) => {
    try {
      console.log('🏷️  labels:list called');
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Fetching labels from GitHub...');
      const response = await client.getLabels(repo.owner, repo.name);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch labels from GitHub');
      }
      
      console.log(`✅ Fetched ${response.data.length} labels from GitHub`);
      
      return {
        labels: response.data,
      };
    } catch (error: any) {
      console.error('labels:list error:', error);
      throw {
        code: 'LIST_ERROR',
        message: error.message || 'Failed to list labels',
      };
    }
  });

  // labels:create - Create a new label on GitHub
  ipcMain.handle('labels:create', async (event, req) => {
    try {
      const validated = CreateLabelInputSchema.parse(req);
      console.log('🏷️  labels:create called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Creating label on GitHub...');
      const response = await client.createLabel(repo.owner, repo.name, {
        name: validated.name,
        color: validated.color,
        description: validated.description,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create label on GitHub');
      }
      
      console.log('✅ Label created on GitHub:', response.data.name);
      
      return {
        label: response.data,
      };
    } catch (error: any) {
      console.error('labels:create error:', error);
      throw {
        code: 'CREATE_ERROR',
        message: error.message || 'Failed to create label',
      };
    }
  });

  // labels:update - Update an existing label on GitHub
  ipcMain.handle('labels:update', async (event, req) => {
    try {
      const schema = z.object({
        id: z.string().min(1), // GitHub label name (acts as ID)
        data: UpdateLabelInputSchema,
      });
      
      const validated = schema.parse(req);
      console.log('🏷️  labels:update called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Updating label on GitHub...');
      const response = await client.updateLabel(
        repo.owner,
        repo.name,
        validated.id, // Label name
        {
          name: validated.data.name,
          color: validated.data.color,
          description: validated.data.description,
        }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update label on GitHub');
      }
      
      console.log('✅ Label updated on GitHub:', response.data.name);
      
      return {
        label: response.data,
      };
    } catch (error: any) {
      console.error('labels:update error:', error);
      throw {
        code: 'UPDATE_ERROR',
        message: error.message || 'Failed to update label',
      };
    }
  });

  // labels:delete - Delete a label from GitHub
  ipcMain.handle('labels:delete', async (event, req) => {
    try {
      const validated = LabelDeleteRequestSchema.parse(req);
      console.log('🏷️  labels:delete called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Deleting label from GitHub...');
      const response = await client.deleteLabel(repo.owner, repo.name, validated.id);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete label from GitHub');
      }
      
      console.log('✅ Label deleted from GitHub:', validated.id);
      
      return {
        success: true,
      };
    } catch (error: any) {
      console.error('labels:delete error:', error);
      throw {
        code: 'DELETE_ERROR',
        message: error.message || 'Failed to delete label',
      };
    }
  });

  console.log('✅ Labels IPC handlers registered');
}
