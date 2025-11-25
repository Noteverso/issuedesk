import { ipcMain } from 'electron';
import {
  IssueListRequestSchema,
  IssueGetRequestSchema,
  IssueCreateRequestSchema,
  IssueUpdateRequestSchema,
  IssueDeleteRequestSchema,
} from '@issuedesk/shared';
import { GitHubClient } from '@issuedesk/github-api';
// import { getDatabaseManager } from '../database/manager';
// import { IssuesRepository } from '../database/repositories/issues';
import { getSettingsManager } from '../settings/manager';
import { getKeychainManager } from '../security/keychain';
import { getStoredSession } from '../storage/auth-store';

/**
 * IPC handlers for issues operations
 * All handlers validate input with Zod schemas
 * Implements GitHub REST API integration
 */

/**
 * Get GitHub client using installation token from session.
 * Falls back to PAT from keychain for backwards compatibility.
 */
function getGitHubClient(): GitHubClient | null {
  // Try to get installation token from auth session (GitHub App)
  console.log('[Issues] Attempting to retrieve session...');
  const session = getStoredSession();
  
  console.log('[Issues] Session retrieved:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userLogin: session?.user?.login,
    hasInstallationToken: !!session?.installationToken,
    tokenLength: session?.installationToken?.token?.length,
    currentInstallation: session?.currentInstallation?.id,
  });
  
  if (session?.installationToken?.token) {
    console.log('[Issues] ✅ Using GitHub App installation token');
    console.log('[Issues] Token expires at:', session.installationToken.expires_at);
    return new GitHubClient(session.installationToken.token);
  }
  
  // Fallback to PAT for backwards compatibility
  console.log('[Issues] No installation token found, trying PAT fallback...');
  const keychain = getKeychainManager();
  const token = keychain.getToken();
  
  if (!token) {
    console.error('[Issues] ❌ No GitHub token found. Please login with GitHub App or configure PAT.');
    return null;
  }
  
  console.warn('[Issues] ⚠️  Using legacy PAT authentication (deprecated)');
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

export function registerIssuesHandlers() {
  console.log('📝 Registering issues IPC handlers...');

  // issues:list - List issues from GitHub API only
  ipcMain.handle('issues:list', async (event, req) => {
    try {
      const validated = IssueListRequestSchema.parse(req);
      console.log('📝 issues:list called with:', validated);
      
      const repo = getActiveRepository();
      // const dbManager = getDatabaseManager();
      // const db = dbManager.getDatabase(repo.id);
      // const issuesRepo = new IssuesRepository(db);
      
      // Fetch from GitHub API
      const client = getGitHubClient();
      console.log('Current GitHub client:', client ? 'Available' : 'Not available');
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Fetching issues from GitHub...');
      
      // Build GitHub API options with label filtering support
      const githubOptions: {
        state?: 'open' | 'closed' | 'all';
        labels?: string;
        page?: number;
        per_page?: number;
      } = {
        state: validated.filter?.state === 'all' ? undefined : validated.filter?.state,
        page: validated.page,
        per_page: validated.perPage,
      };
      
      // Add label filtering if labels are specified
      // GitHub API expects comma-separated label names
      if (validated.filter?.labels && validated.filter.labels.length > 0) {
        githubOptions.labels = validated.filter.labels.join(',');
        console.log('  - Filtering by labels:', githubOptions.labels);
      }
      
      const response = await client.getIssues(repo.owner, repo.name, githubOptions);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch issues from GitHub');
      }
      
      let issues = response.data;
      
      // Apply client-side search filtering if search term is provided
      // GitHub API doesn't support full-text search in the issues endpoint, 
      // so we filter locally
      if (validated.filter?.search) {
        const searchTerm = validated.filter.search.toLowerCase();
        console.log('  - Applying client-side search filter:', searchTerm);
        
        issues = issues.filter(issue => 
          issue.title.toLowerCase().includes(searchTerm) ||
          (issue.body && issue.body.toLowerCase().includes(searchTerm))
        );
      }
      
      console.log(`✅ Fetched ${issues.length} issues from GitHub (filtered from ${response.data.length})`);
      
      return {
        issues,
        total: issues.length,
        page: validated.page || 1,
        perPage: validated.perPage || 50,
      };
      
      // Fall back to local database (commented out - using GitHub API only)
      // const result = issuesRepo.list(
      //   validated.filter || {},
      //   validated.page || 1,
      //   validated.perPage || 50
      // );
      // 
      // return {
      //   issues: result.issues,
      //   total: result.totalCount,
      //   page: result.page,
      //   perPage: result.perPage,
      // };
    } catch (error: any) {
      console.error('issues:list error:', error);
      throw {
        code: 'LIST_ERROR',
        message: error.message || 'Failed to list issues',
      };
    }
  });

  // issues:get - Get a single issue by number from GitHub API
  ipcMain.handle('issues:get', async (event, req) => {
    try {
      const validated = IssueGetRequestSchema.parse(req);
      console.log('📝 issues:get called with:', validated);
      
      const repo = getActiveRepository();
      // const dbManager = getDatabaseManager();
      // const db = dbManager.getDatabase(repo.id);
      // const issuesRepo = new IssuesRepository(db);
      
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      // Fetch from GitHub using issue number (validated.id should be the issue number)
      console.log('🔄 Fetching issue from GitHub...');
      const response = await client.getIssue(repo.owner, repo.name, validated.id);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Issue not found');
      }
      
      console.log('✅ Fetched issue from GitHub:', response.data.number);
      return response.data;
      
      // const issue = issuesRepo.get(validated.id);
      // 
      // if (!issue) {
      //   throw new Error('Issue not found');
      // }
      // 
      // return issue;
    } catch (error: any) {
      console.error('issues:get error:', error);
      throw {
        code: 'NOT_FOUND',
        message: error.message || 'Issue not found',
      };
    }
  });

  // issues:create - Create issue on GitHub API only
  ipcMain.handle('issues:create', async (event, req) => {
    try {
      const validated = IssueCreateRequestSchema.parse(req);
      console.log('📝 issues:create called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      // Create issue on GitHub
      console.log('🔄 Creating issue on GitHub...');
      const response = await client.createIssue(repo.owner, repo.name, {
        title: validated.title,
        body: validated.body,
        labels: validated.labels,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create issue on GitHub');
      }
      
      console.log('✅ Issue created on GitHub:', response.data.number);
      
      // Store in local database for offline access (commented out - using GitHub API only)
      // const dbManager = getDatabaseManager();
      // const db = dbManager.getDatabase(repo.id);
      // const issuesRepo = new IssuesRepository(db);
      // 
      // Store GitHub issue in local database
      // Note: This would ideally use a createFromGitHub method
      // For now, we'll return the GitHub response directly
      
      return response.data;
    } catch (error: any) {
      console.error('issues:create error:', error);
      throw {
        code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'CREATE_ERROR',
        message: error.message || 'Failed to create issue',
      };
    }
  });

  // issues:update - Update issue on GitHub API only
  ipcMain.handle('issues:update', async (event, req) => {
    try {
      const validated = IssueUpdateRequestSchema.parse(req);
      console.log('📝 issues:update called with:', validated);
      
      const repo = getActiveRepository();
      // const dbManager = getDatabaseManager();
      // const db = dbManager.getDatabase(repo.id);
      // const issuesRepo = new IssuesRepository(db);
      
      // Get the issue to find its number (commented out - using validated.id as issue number)
      // const issue = issuesRepo.get(validated.id);
      // if (!issue) {
      //   throw new Error('Issue not found');
      // }
      // 
      // if (!issue.number) {
      //   throw new Error('Issue has no GitHub number');
      // }
      
      const client = getGitHubClient();
      if (!client) {
        throw new Error('No GitHub token configured');
      }
      
      // Update on GitHub (using validated.id as the issue number)
      console.log('🔄 Updating issue on GitHub...');
      const response = await client.updateIssue(repo.owner, repo.name, validated.id, {
        title: validated.data.title,
        body: validated.data.body,
        state: validated.data.state,
        labels: validated.data.labels,
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update issue on GitHub');
      }
      
      console.log('✅ Issue updated on GitHub');
      
      // Update local database (commented out - using GitHub API only)
      // issuesRepo.update(validated.id, validated.data);
      
      return response.data;
    } catch (error: any) {
      console.error('issues:update error:', error);
      throw {
        code: error.name === 'ZodError' ? 'VALIDATION_ERROR' : 'UPDATE_ERROR',
        message: error.message || 'Failed to update issue',
      };
    }
  });

  // issues:delete - Close issue on GitHub API only
  ipcMain.handle('issues:delete', async (event, req) => {
    try {
      const validated = IssueDeleteRequestSchema.parse(req);
      console.log('📝 issues:delete called with:', validated);
      
      const repo = getActiveRepository();
      // const dbManager = getDatabaseManager();
      // const db = dbManager.getDatabase(repo.id);
      // const issuesRepo = new IssuesRepository(db);
      
      // const issue = issuesRepo.get(validated.id);
      // if (!issue) {
      //   throw new Error('Issue not found');
      // }
      
      // Close on GitHub (GitHub API doesn't support delete, using validated.id as issue number)
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Closing issue on GitHub...');
      const response = await client.updateIssue(repo.owner, repo.name, validated.id, {
        state: 'closed',
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to close issue on GitHub');
      }
      
      console.log('✅ Issue closed on GitHub');
      
      // Delete locally (commented out - using GitHub API only)
      // issuesRepo.delete(validated.id);
      // console.log('✅ Issue deleted locally:', validated.id);
      
      return { success: true };
    } catch (error: any) {
      console.error('issues:delete error:', error);
      throw {
        code: 'DELETE_ERROR',
        message: error.message || 'Failed to delete issue',
      };
    }
  });

  console.log('✅ Issues IPC handlers registered with GitHub API only (database disabled)');
}
