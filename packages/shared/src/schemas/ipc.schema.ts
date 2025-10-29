import { z } from 'zod';
import { IssueFilterSchema, CreateIssueInputSchema, UpdateIssueInputSchema } from './issue.schema';
import { CreateLabelInputSchema, UpdateLabelInputSchema } from './label.schema';
import { ThemeModeSchema, EditorModeSchema, ViewPreferencesSchema } from './settings.schema';

// IPC Request/Response Schemas

// Issues
export const IssueListRequestSchema = z.object({
  filter: IssueFilterSchema.optional(),
  page: z.number().int().positive().optional(),
  perPage: z.number().int().min(1).max(100).optional(),
});

export const IssueGetRequestSchema = z.object({
  id: z.number().min(1),
});

export const IssueCreateRequestSchema = CreateIssueInputSchema;

export const IssueUpdateRequestSchema = z.object({
  id: z.number().min(1),
  data: UpdateIssueInputSchema,
});

export const IssueDeleteRequestSchema = z.object({
  id: z.number().min(1),
});

// Labels
export const LabelCreateRequestSchema = CreateLabelInputSchema;

export const LabelUpdateRequestSchema = z.object({
  id: z.string().uuid(),
  data: UpdateLabelInputSchema,
});

export const LabelDeleteRequestSchema = z.object({
  id: z.string().uuid(),
});

// Sync
export const ConflictResolveRequestSchema = z.object({
  issueId: z.string().uuid(),
  resolution: z.enum(['local', 'remote', 'merged']),
  mergedData: z.object({
    title: z.string(),
    body: z.string(),
    labels: z.array(z.string()),
  }).optional(),
});

// Settings
export const SettingsUpdateRequestSchema = z.object({
  theme: ThemeModeSchema.optional(),
  editorMode: EditorModeSchema.optional(),
  viewPreferences: ViewPreferencesSchema.partial().optional(),
});

export const SetRepositoryRequestSchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
  token: z.string().optional(),
});

export const SwitchRepositoryRequestSchema = z.object({
  repositoryId: z.string(),
});

export const SetTokenRequestSchema = z.object({
  token: z.string().min(1),
});

// System
export const OpenExternalRequestSchema = z.object({
  url: z.string().url(),
});
