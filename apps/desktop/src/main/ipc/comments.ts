import { ipcMain } from 'electron';
import {
  CommentListRequestSchema,
  CommentGetRequestSchema,
  CommentCreateRequestSchema,
  CommentUpdateRequestSchema,
  CommentDeleteRequestSchema,
  parseCommentMetadata,
  embedCommentMetadata,
  type Comment,
} from '@issuedesk/shared';
import { GitHubClient } from '@issuedesk/github-api';
import { getSettingsManager } from '../settings/manager';
import { getStoredSession } from '../storage/auth-store';

/**
 * IPC handlers for comments operations
 * All handlers validate input with Zod schemas
 * Implements GitHub REST API integration with HTML metadata parsing
 */

// GitHub API comment response structure (snake_case)
interface GitHubComment {
  id: number;
  node_id: string;
  body: string;
  user: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    type: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  issue_url: string;
}

/**
 * Get GitHub client using installation token from session.
 * Requires GitHub App authentication - no PAT fallback.
 */
function getGitHubClient(): GitHubClient | null {
  const session = getStoredSession();
  console.log('[Comments] Session retrieved:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    hasInstallationToken: !!session?.credentials,
    tokenLength: session?.credentials?.token?.length,
  });

  if (session?.credentials?.token) {
    console.log('[Comments] ✅ Using GitHub App installation token');
    return new GitHubClient(session.credentials.token);
  }

  console.error('[Comments] ❌ No installation token found. Please login with GitHub App.');
  return null;
}

/**
 * Get active repository configuration from SettingsManager
 */
function getActiveRepository() {
  const settings = getSettingsManager();
  const activeId = settings.getActiveRepositoryId();
  
  if (!activeId) {
    throw new Error('No active repository configured. Please configure a repository in Settings.');
  }
  
  const repo = settings.getRepository(activeId);
  if (!repo) {
    throw new Error(`Active repository '${activeId}' not found in settings.`);
  }
  
  return repo;
}

/**
 * Convert GitHub comment to our Comment type
 */
function mapGitHubCommentToComment(githubComment: GitHubComment, issueId?: string): Comment {
  const metadata = parseCommentMetadata(githubComment.body || '');
  const now = Date.now();
  
  return {
    id: githubComment.id.toString(), // Use GitHub ID as local ID for Phase 4
    issueId,
    commentId: githubComment.id,
    body: githubComment.body || '',
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags,
    author: githubComment.user?.login || 'unknown',
    createdAt: new Date(githubComment.created_at).getTime(),
    updatedAt: new Date(githubComment.updated_at).getTime(),
    syncStatus: 'synced' as const,
    localUpdatedAt: now,
    remoteUpdatedAt: new Date(githubComment.updated_at).getTime(),
    bodyChecksum: null, // Will implement checksum later if needed
  };
}

export function registerCommentsHandlers() {
  console.log('💬 Registering comments IPC handlers...');

  // comments:list - List comments for an issue from GitHub API
  ipcMain.handle('comments:list', async (event, req) => {
    try {
      const validated = CommentListRequestSchema.parse(req);
      console.log('💬 comments:list called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Fetching comments from GitHub...');
      
      // Build GitHub API options
      const githubOptions: {
        sort?: 'created' | 'updated';
        direction?: 'asc' | 'desc';
        since?: string;
      } = {
        sort: 'created',
        direction: 'desc', // Always newest first since we removed sort option
      };
      
      // Add since filter if specified
      if (validated.filter?.since) {
        githubOptions.since = validated.filter.since;
        console.log(`🕒 Filtering comments since: ${validated.filter.since}`);
      }
      
      const response = await client.getComments(
        repo.owner,
        repo.name,
        validated.issueNumber,
        githubOptions
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch comments from GitHub');
      }
      
      console.log(`✅ Fetched ${response.data.length} comments from GitHub`);
      
      // Map GitHub comments to our Comment type with metadata parsing
      let comments = (response.data as any[]).map((githubComment) =>
        mapGitHubCommentToComment(githubComment, validated.issueId)
      );
      
      // Apply tag filtering with AND logic if specified
      if (validated.filter?.tags && validated.filter.tags.length > 0) {
        const filterTags = validated.filter.tags;
        comments = comments.filter((comment) => {
          // AND logic: comment must have ALL filter tags
          return filterTags.every((filterTag) =>
            comment.tags.some((commentTag) =>
              commentTag.toLowerCase() === filterTag.toLowerCase()
            )
          );
        });
        
        console.log(`🏷️  Filtered to ${comments.length} comments matching tags: ${filterTags.join(', ')}`);
      }
      
      return {
        comments,
        totalCount: comments.length,
      };
    } catch (error) {
      console.error('❌ Error in comments:list:', error);
      return {
        comments: [],
        totalCount: 0,
      };
    }
  });

  // comments:get - Get a single comment by GitHub ID
  ipcMain.handle('comments:get', async (event, req) => {
    try {
      const validated = CommentGetRequestSchema.parse(req);
      console.log('💬 comments:get called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Fetching comment from GitHub...');
      
      const response = await client.getComment(
        repo.owner,
        repo.name,
        validated.commentId
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch comment from GitHub');
      }
      
      // Map GitHub comment to our Comment type
      // Note: issueId will need to be set by the caller since it's not in the request
      const githubComment = response.data as any;
      const comment = mapGitHubCommentToComment(githubComment, validated.id); // Use id as issueId temporarily
      
      console.log('✅ Fetched comment from GitHub');
      
      return {
        comment,
      };
    } catch (error) {
      console.error('❌ Error in comments:get:', error);
      return {
        comment: null,
      };
    }
  });

  // comments:create - Create a new comment with embedded metadata
  ipcMain.handle('comments:create', async (event, req) => {
    try {
      const validated = CommentCreateRequestSchema.parse(req);
      console.log('💬 comments:create called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      // Embed metadata as HTML comments in body
      const metadata = {
        title: validated.title,
        description: validated.description,
        tags: validated.tags || [],
      };
      
      const bodyWithMetadata = embedCommentMetadata(validated.body, metadata);
      
      console.log('🔄 Creating comment on GitHub with embedded metadata...');
      
      const response = await client.createComment(
        repo.owner,
        repo.name,
        validated.issueNumber,
        { 
          issueId: validated.issueId, // Required by our type, though GitHub API doesn't use it
          body: bodyWithMetadata 
        }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create comment on GitHub');
      }
      
      // Map GitHub comment to our Comment type
      const githubComment = response.data as any;
      const comment = mapGitHubCommentToComment(githubComment, validated.issueId);
      
      console.log('✅ Created comment on GitHub');
      
      return {
        comment,
      };
    } catch (error) {
      console.error('❌ Error in comments:create:', error);
      throw error;
    }
  });

  // comments:update - Update a comment with embedded metadata
  ipcMain.handle('comments:update', async (event, req) => {
    try {
      const validated = CommentUpdateRequestSchema.parse(req);
      console.log('💬 comments:update called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      // Embed metadata as HTML comments in body (if body is provided)
      let bodyToUpdate = validated.data.body;
      if (bodyToUpdate) {
        const metadata = {
          title: validated.data.title,
          description: validated.data.description,
          tags: validated.data.tags || [],
        };
        bodyToUpdate = embedCommentMetadata(bodyToUpdate, metadata);
      }
      
      console.log('🔄 Updating comment on GitHub with embedded metadata...');
      
      const response = await client.updateComment(
        repo.owner,
        repo.name,
        validated.commentId,
        { body: bodyToUpdate }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update comment on GitHub');
      }
      
      // Map GitHub comment to our Comment type
      const githubComment = response.data as any;
      const comment = mapGitHubCommentToComment(githubComment, validated.id);
      
      console.log('✅ Updated comment on GitHub');
      
      return {
        comment,
      };
    } catch (error) {
      console.error('❌ Error in comments:update:', error);
      throw error;
    }
  });

  // comments:delete - Delete a comment from GitHub
  ipcMain.handle('comments:delete', async (event, req) => {
    try {
      const validated = CommentDeleteRequestSchema.parse(req);
      console.log('💬 comments:delete called with:', validated);
      
      const repo = getActiveRepository();
      const client = getGitHubClient();
      
      if (!client) {
        throw new Error('No GitHub token configured. Please configure your GitHub token in Settings.');
      }
      
      console.log('🔄 Deleting comment from GitHub...');
      
      const response = await client.deleteComment(
        repo.owner,
        repo.name,
        validated.commentId
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete comment from GitHub');
      }
      
      console.log('✅ Deleted comment from GitHub');
      
      return {
        success: true,
      };
    } catch (error) {
      console.error('❌ Error in comments:delete:', error);
      throw error;
    }
  });

  console.log('✅ Comments IPC handlers registered');
}