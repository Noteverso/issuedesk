import { z } from 'zod';

// Settings validation schemas
export const ThemeModeSchema = z.enum(['light', 'dark']);
export const EditorModeSchema = z.enum(['code', 'preview']);
export const ViewModeSchema = z.enum(['list', 'card']);

export const ViewPreferencesSchema = z.object({
  issues: ViewModeSchema,
  labels: ViewModeSchema,
});

export const RateLimitStateSchema = z.object({
  remaining: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  reset: z.number().int().positive(),
});

export const RepositoryConfigSchema = z.object({
  id: z.string(),
  owner: z.string(),
  name: z.string(),
  dbPath: z.string(),
  lastSyncAt: z.number().nullable(),
});

export const R2ConfigSchema = z.object({
  accountId: z.string(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  bucketName: z.string(),
  publicUrl: z.string().url(),
  enabled: z.boolean(),
});

export const AppSettingsSchema = z.object({
  activeRepositoryId: z.string().nullable(),
  repositories: z.array(RepositoryConfigSchema),
  theme: ThemeModeSchema,
  editorMode: EditorModeSchema,
  viewPreferences: ViewPreferencesSchema,
  rateLimit: RateLimitStateSchema.nullable(),
  r2Config: R2ConfigSchema.nullable(),
});
