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

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string; // Custom domain or R2.dev public URL
  enabled: boolean;
}

export interface AppSettings {
  activeRepositoryId: string | null;
  repositories: RepositoryConfig[];
  theme: ThemeMode;
  editorMode: EditorMode;
  viewPreferences: ViewPreferences;
  rateLimit: RateLimitState | null;
  r2Config: R2Config | null;
}

// Legacy AppConfig for backward compatibility with electron-store
// This is used by the main process for simple key-value settings
export interface AppConfig {
  github: {
    token: string;
    username: string;
    defaultRepository: string;
  };
  editor: {
    theme: ThemeMode;
    fontSize: number;
    autoSave: boolean;
    autoSaveInterval: number;
  };
  ui: {
    sidebarWidth: number;
    showLineNumbers: boolean;
    wordWrap: boolean;
  };
}
