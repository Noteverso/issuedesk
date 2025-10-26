import {
  Issue,
  CreateIssueInput,
  UpdateIssueInput,
  IssueFilter,
  IssueListResult,
} from './issue';
import { Label, CreateLabelInput, UpdateLabelInput } from './label';
import { AppSettings, ViewPreferences, ThemeMode, EditorMode } from './settings';
import { SyncStatus, ConflictResolution } from './sync';

// IPC API types - defines the contract between main and renderer processes

// Issues API
export interface IssueListRequest {
  filter?: IssueFilter;
  page?: number;
  perPage?: number;
}

export interface IssueGetRequest {
  id: string;
}

export interface IssueCreateRequest extends CreateIssueInput {}

export interface IssueUpdateRequest {
  id: string;
  data: UpdateIssueInput;
}

export interface IssueDeleteRequest {
  id: string;
}

// Labels API
export interface LabelCreateRequest extends CreateLabelInput {}

export interface LabelUpdateRequest {
  id: string;
  data: UpdateLabelInput;
}

export interface LabelDeleteRequest {
  id: string;
}

// Sync API
export interface ConflictResolveRequest {
  issueId: string;
  resolution: ConflictResolution;
  mergedData?: {
    title: string;
    body: string;
    labels: string[];
  };
}

// Settings API
export interface SettingsUpdateRequest {
  theme?: ThemeMode;
  editorMode?: EditorMode;
  viewPreferences?: Partial<ViewPreferences>;
}

export interface SetRepositoryRequest {
  owner: string;
  name: string;
  token?: string;
}

export interface SetRepositoryResponse {
  repositoryId: string;
  isNew: boolean;
}

export interface SwitchRepositoryRequest {
  repositoryId: string;
}

export interface SetTokenRequest {
  token: string;
}

export interface GetTokenResponse {
  hasToken: boolean;
  tokenPreview?: string;
}

// Analytics API
export interface DashboardAnalytics {
  summary: {
    total: number;
    open: number;
    closed: number;
  };
  labelDistribution: Array<{
    labelName: string;
    labelColor: string;
    count: number;
  }>;
  trend7Days: Array<{
    date: string;
    created: number;
    closed: number;
  }>;
  trend30Days: Array<{
    date: string;
    created: number;
    closed: number;
  }>;
}

// System API
export interface OpenExternalRequest {
  url: string;
}

export interface VersionInfo {
  version: string;
  electronVersion: string;
  nodeVersion: string;
}

// Events from main to renderer
export interface SyncProgressEvent {
  total: number;
  completed: number;
  currentOperation: string;
}

export interface SyncConflictEvent {
  issueId: string;
  issueNumber: number;
  issueTitle: string;
}

export interface RateLimitWarningEvent {
  remaining: number;
  limit: number;
  resetAt: number;
}

export interface TokenInvalidEvent {
  reason: string;
}

// Complete IPC API surface
export interface IpcApi {
  // Issues
  issues: {
    list: (req: IssueListRequest) => Promise<IssueListResult>;
    get: (req: IssueGetRequest) => Promise<{ issue: Issue | null }>;
    create: (req: IssueCreateRequest) => Promise<{ issue: Issue }>;
    update: (req: IssueUpdateRequest) => Promise<{ issue: Issue }>;
    delete: (req: IssueDeleteRequest) => Promise<{ success: boolean }>;
  };

  // Labels
  labels: {
    list: () => Promise<{ labels: Label[] }>;
    create: (req: LabelCreateRequest) => Promise<{ label: Label }>;
    update: (req: LabelUpdateRequest) => Promise<{ label: Label }>;
    delete: (req: LabelDeleteRequest) => Promise<{ success: boolean }>;
  };

  // Sync
  sync: {
    start: () => Promise<{ syncId: string }>;
    getStatus: () => Promise<SyncStatus>;
    resolveConflict: (req: ConflictResolveRequest) => Promise<{ success: boolean }>;
  };

  // Settings
  settings: {
    get: () => Promise<{ settings: AppSettings }>;
    update: (req: SettingsUpdateRequest) => Promise<{ settings: AppSettings }>;
    setRepository: (req: SetRepositoryRequest) => Promise<SetRepositoryResponse>;
    switchRepository: (req: SwitchRepositoryRequest) => Promise<{ success: boolean }>;
    getToken: () => Promise<GetTokenResponse>;
    setToken: (req: SetTokenRequest) => Promise<{ success: boolean }>;
  };

  // Analytics
  analytics: {
    getDashboard: () => Promise<DashboardAnalytics>;
  };

  // System
  system: {
    openExternal: (req: OpenExternalRequest) => Promise<{ success: boolean }>;
    getVersion: () => Promise<VersionInfo>;
  };

  // Event listeners
  on: (
    channel: 'sync:progress' | 'sync:conflict' | 'rate-limit:warning' | 'token:invalid',
    callback: (data: any) => void
  ) => void;
}

// Error response
export interface IpcError {
  code: string;
  message: string;
  details?: any;
}
