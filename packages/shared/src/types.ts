import { z } from 'zod';

// GitHub Repository Schema
export const RepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  private: z.boolean(),
  html_url: z.string(),
  clone_url: z.string(),
  default_branch: z.string(),
  owner: z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    html_url: z.string(),
  }),
});

// GitHub Label Schema
export const LabelSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  description: z.string().nullable(),
  default: z.boolean(),
});

// GitHub Issue Schema
export const IssueSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable(),
  state: z.enum(['open', 'closed']),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable(),
  user: z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    html_url: z.string(),
  }),
  labels: z.array(LabelSchema),
  assignees: z.array(z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string(),
    html_url: z.string(),
  })),
  milestone: z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().nullable(),
    state: z.enum(['open', 'closed']),
    created_at: z.string(),
    updated_at: z.string(),
    due_on: z.string().nullable(),
  }).nullable(),
});

// Create Issue Schema
export const CreateIssueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.number().optional(),
});

// Update Issue Schema
export const UpdateIssueSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  body: z.string().optional(),
  state: z.enum(['open', 'closed']).optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.number().optional(),
});

// Create Label Schema
export const CreateLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required'),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/, 'Color must be a valid hex color'),
  description: z.string().optional(),
});

// Update Label Schema
export const UpdateLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').optional(),
  color: z.string().regex(/^[0-9a-fA-F]{6}$/, 'Color must be a valid hex color').optional(),
  description: z.string().optional(),
});

// App Configuration Schema
export const AppConfigSchema = z.object({
  github: z.object({
    token: z.string().optional(),
    username: z.string().optional(),
    defaultRepository: z.string().optional(),
  }),
  editor: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    fontSize: z.number().min(12).max(24).default(14),
    autoSave: z.boolean().default(true),
    autoSaveInterval: z.number().min(1000).max(60000).default(5000),
  }),
  ui: z.object({
    sidebarWidth: z.number().min(200).max(500).default(300),
    showLineNumbers: z.boolean().default(true),
    wordWrap: z.boolean().default(true),
  }),
});

// Type exports
export type Repository = z.infer<typeof RepositorySchema>;
export type Label = z.infer<typeof LabelSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type CreateIssue = z.infer<typeof CreateIssueSchema>;
export type UpdateIssue = z.infer<typeof UpdateIssueSchema>;
export type CreateLabel = z.infer<typeof CreateLabelSchema>;
export type UpdateLabel = z.infer<typeof UpdateLabelSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Blog post specific types
export interface BlogPost extends Issue {
  excerpt?: string;
  readingTime?: number;
  tags?: string[];
  published?: boolean;
}

export interface BlogPostDraft {
  title: string;
  content: string;
  labels: string[];
  isDraft: boolean;
  lastModified: Date;
}
