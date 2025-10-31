/**
 * Comment types for GitHub issue comments with enhanced metadata
 * Metadata is stored as HTML comments in the markdown body
 */

export type SyncStatus = 'synced' | 'pending_create' | 'pending_update' | 'pending_delete' | 'conflict';

/**
 * Metadata parsed from HTML comments in comment body
 * Format:
 * <!-- title: Comment Title -->
 * <!-- description: Comment description -->
 * <!-- tags: tag1, tag2, tag3 -->
 */
export interface CommentMetadata {
  /** Comment title (max 100 chars) */
  title?: string;
  /** Comment description (max 200 chars) */
  description?: string;
  /** Tags for categorization (max 20 tags, each max 30 chars) */
  tags: string[];
}

/**
 * GitHub issue comment with enhanced metadata
 */
export interface Comment {
  /** Local UUID v4 */
  id: string;
  /** Parent issue ID (local UUID) - optional in Phase 4 online-only mode */
  issueId?: string;
  /** GitHub comment ID (null for not-yet-synced) */
  githubId: number | null;
  /** Raw markdown content with embedded HTML metadata */
  body: string;
  /** Parsed title from HTML comment (max 100 chars) */
  title?: string;
  /** Parsed description from HTML comment (max 200 chars) */
  description?: string;
  /** Parsed tags from HTML comment (max 20 tags) */
  tags: string[];
  /** GitHub username of comment author */
  author: string;
  /** Unix timestamp (ms) when comment created on GitHub */
  createdAt: number;
  /** Unix timestamp (ms) when comment last updated on GitHub */
  updatedAt: number;
  /** Sync state */
  syncStatus: SyncStatus;
  /** Unix timestamp (ms) of last local modification */
  localUpdatedAt: number;
  /** Unix timestamp (ms) from GitHub API (for conflict detection) */
  remoteUpdatedAt: number | null;
  /** SHA-256 hash of body content (for conflict detection) */
  bodyChecksum: string | null;
}

/**
 * Input for creating a new comment
 */
export interface CreateCommentInput {
  /** Parent issue ID (optional in Phase 4) */
  issueId?: string;
  /** Comment title (optional, max 100 chars) */
  title?: string;
  /** Comment description (optional, max 200 chars) */
  description?: string;
  /** Tags (optional, max 20 tags) */
  tags?: string[];
  /** Markdown content (required) */
  body: string;
}

/**
 * Input for updating an existing comment
 */
export interface UpdateCommentInput {
  /** Comment title (optional, max 100 chars) */
  title?: string;
  /** Comment description (optional, max 200 chars) */
  description?: string;
  /** Tags (optional, max 20 tags) */
  tags?: string[];
  /** Markdown content (optional) */
  body?: string;
}

/**
 * Filter options for listing comments
 */
export interface CommentFilter {
  /** Filter by tags (AND logic - all tags must match) */
  tags?: string[];
  /** Only show comments updated after this timestamp (ISO 8601 format) */
  since?: string;
}

/**
 * Since filter options for comments (convenience presets)
 */
export type CommentSince = '2hours' | '1day' | '3days' | '1week' | '1month' | 'custom';

/**
 * Request to list comments for an issue
 */
export interface CommentListRequest {
  /** Parent issue ID (Phase 4: GitHub issue number as string; Phase 9: UUID) - optional in Phase 4 */
  issueId?: string;
  /** GitHub issue number for API calls */
  issueNumber: number;
  /** Optional filter criteria */
  filter?: CommentFilter;
}

/**
 * Response from listing comments
 */
export interface CommentListResponse {
  comments: Comment[];
  totalCount: number;
}

/**
 * Request to get a single comment
 */
export interface CommentGetRequest {
  /** Comment ID (Phase 4: GitHub comment ID as string; Phase 9: UUID) */
  id: string;
  /** GitHub comment ID for API calls */
  githubId: number;
}

/**
 * Response from getting a comment
 */
export interface CommentGetResponse {
  comment: Comment | null;
}

/**
 * Request to create a comment
 */
export interface CommentCreateRequest {
  /** Parent issue ID (Phase 4: GitHub issue number as string; Phase 9: UUID) - optional in Phase 4 */
  issueId?: string;
  /** GitHub issue number for API calls */
  issueNumber: number;
  /** Comment title (optional, max 100 chars) */
  title?: string;
  /** Comment description (optional, max 200 chars) */
  description?: string;
  /** Tags (optional, max 20 tags) */
  tags?: string[];
  /** Markdown content (required) */
  body: string;
}

/**
 * Response from creating a comment
 */
export interface CommentCreateResponse {
  comment: Comment;
}

/**
 * Request to update a comment
 */
export interface CommentUpdateRequest {
  /** Comment ID (Phase 4: GitHub comment ID as string; Phase 9: UUID) */
  id: string;
  /** GitHub comment ID for API calls */
  githubId: number;
  data: UpdateCommentInput;
}

/**
 * Response from updating a comment
 */
export interface CommentUpdateResponse {
  comment: Comment;
}

/**
 * Request to delete a comment
 */
export interface CommentDeleteRequest {
  /** Comment ID (Phase 4: GitHub comment ID as string; Phase 9: UUID) */
  id: string;
  /** GitHub comment ID for API calls */
  githubId: number;
}

/**
 * Response from deleting a comment
 */
export interface CommentDeleteResponse {
  success: boolean;
}
