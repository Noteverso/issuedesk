import { z } from 'zod';

// Issue validation schemas
export const IssueStateSchema = z.enum(['open', 'closed']);

export const IssueSyncStatusSchema = z.enum([
  'synced',
  'pending_create',
  'pending_update',
  'pending_delete',
  'conflict',
]);

export const IssueSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().positive(),
  title: z.string().min(1).max(256),
  body: z.string().nullable(),
  state: IssueStateSchema,
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  githubUrl: z.string().url(),
  syncStatus: IssueSyncStatusSchema,
  localUpdatedAt: z.number().int().positive(),
  remoteUpdatedAt: z.number().int().positive().nullable(),
  bodyChecksum: z.string().nullable(),
  labels: z.array(z.string()),
});

export const CreateIssueInputSchema = z.object({
  title: z.string().min(1).max(256),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

export const UpdateIssueInputSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  body: z.string().optional(),
  state: IssueStateSchema.optional(),
  labels: z.array(z.string()).optional(),
});

export const IssueFilterSchema = z.object({
  state: z.enum(['open', 'closed', 'all']).optional(),
  labels: z.array(z.string()).optional(),
  search: z.string().optional(),
});
