import { z } from 'zod';

/**
 * Zod schema for Comment metadata
 */
export const CommentMetadataSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
  tags: z.array(z.string().max(30)).max(20).default([]),
});

/**
 * Zod schema for SyncStatus enum
 */
const SyncStatusSchema = z.enum([
  'synced',
  'pending_create',
  'pending_update',
  'pending_delete',
  'conflict',
]);

/**
 * Zod schema for Comment entity
 */
export const CommentSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid().optional(),
  githubId: z.number().int().positive().nullable(),
  body: z.string().min(1),
  title: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
  tags: z.array(z.string().max(30)).max(20).default([]),
  author: z.string().min(1),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  syncStatus: SyncStatusSchema,
  localUpdatedAt: z.number().int().positive(),
  remoteUpdatedAt: z.number().int().positive().nullable(),
  bodyChecksum: z.string().nullable(),
});

/**
 * Zod schema for CreateCommentInput
 */
export const CreateCommentInputSchema = z.object({
  issueId: z.string().uuid().optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  body: z.string().min(1),
});

/**
 * Zod schema for UpdateCommentInput
 */
export const UpdateCommentInputSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  body: z.string().min(1).optional(),
});

/**
 * Zod schema for CommentFilter
 */
export const CommentFilterSchema = z.object({
  tags: z.array(z.string()).optional(),
  since: z.string().datetime().optional(),
});

/**
 * Zod schema for CommentSince
 */
export const CommentSinceSchema = z.enum(['2hours', '1day', '3days', '1week', '1month', 'custom']);

/**
 * Zod schema for CommentListRequest
 */
export const CommentListRequestSchema = z.object({
  issueId: z.string().optional(), // For Phase 4: GitHub issue number as string; Phase 9: UUID
  issueNumber: z.number().int().positive(), // GitHub issue number for API calls
  filter: CommentFilterSchema.optional(),
});

/**
 * Zod schema for CommentListResponse
 */
export const CommentListResponseSchema = z.object({
  comments: z.array(CommentSchema),
  totalCount: z.number().int().nonnegative(),
});

/**
 * Zod schema for CommentGetRequest
 */
export const CommentGetRequestSchema = z.object({
  id: z.string(), // For Phase 4: GitHub comment ID as string; Phase 9: UUID
  githubId: z.number().int().positive(), // GitHub comment ID for API calls
});

/**
 * Zod schema for CommentGetResponse
 */
export const CommentGetResponseSchema = z.object({
  comment: CommentSchema.nullable(),
});

/**
 * Zod schema for CommentCreateRequest
 */
export const CommentCreateRequestSchema = z.object({
  issueId: z.string().optional(), // For Phase 4: GitHub issue number as string; Phase 9: UUID
  issueNumber: z.number().int().positive(), // GitHub issue number for API calls
  title: z.string().max(100).optional(),
  description: z.string().max(200).optional(),
  tags: z.array(z.string().max(30)).max(20).optional(),
  body: z.string().min(1),
});

/**
 * Zod schema for CommentCreateResponse
 */
export const CommentCreateResponseSchema = z.object({
  comment: CommentSchema,
});

/**
 * Zod schema for CommentUpdateRequest
 */
export const CommentUpdateRequestSchema = z.object({
  id: z.string(), // For Phase 4: GitHub comment ID as string; Phase 9: UUID
  githubId: z.number().int().positive(), // GitHub comment ID for API calls
  data: UpdateCommentInputSchema,
});

/**
 * Zod schema for CommentUpdateResponse
 */
export const CommentUpdateResponseSchema = z.object({
  comment: CommentSchema,
});

/**
 * Zod schema for CommentDeleteRequest
 */
export const CommentDeleteRequestSchema = z.object({
  id: z.string(), // For Phase 4: GitHub comment ID as string; Phase 9: UUID
  githubId: z.number().int().positive(), // GitHub comment ID for API calls
});

/**
 * Zod schema for CommentDeleteResponse
 */
export const CommentDeleteResponseSchema = z.object({
  success: z.boolean(),
});
