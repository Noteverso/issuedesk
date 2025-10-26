import { RepositoryConfig } from './repository';

// Settings-related types
export type ThemeMode = 'light' | 'dark';
export type EditorMode = 'code' | 'preview';
export type ViewMode = 'list' | 'card';

export interface ViewPreferences {
  issues: ViewMode;
  labels: ViewMode;
}

export interface RateLimitState {
  remaining: number;
  limit: number;
  reset: number; // Unix timestamp (seconds)
}

export interface AppSettings {
  activeRepositoryId: string | null;
  repositories: RepositoryConfig[];
  theme: ThemeMode;
  editorMode: EditorMode;
  viewPreferences: ViewPreferences;
  rateLimit: RateLimitState | null;
}
