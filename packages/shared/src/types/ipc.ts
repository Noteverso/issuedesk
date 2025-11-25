import {
  Issue,
  CreateIssueInput,
  UpdateIssueInput,
  IssueFilter,
  IssueListResult,
} from './issue';
import { Label, CreateLabelInput, UpdateLabelInput } from './label';
import {
  Comment,
  CommentListRequest,
  CommentListResponse,
  CommentGetRequest,
  CommentGetResponse,
  CommentCreateRequest,
  CommentCreateResponse,
  CommentUpdateRequest,
  CommentUpdateResponse,
  CommentDeleteRequest,
  CommentDeleteResponse,
} from './comment';
import { AppSettings, ViewPreferences, ThemeMode, EditorMode } from './settings';
import { SyncEngineStatus, ConflictResolution } from './sync';
import { UserSession, User, Installation } from './auth';

// IPC API types - defines the contract between main and renderer processes

// Issues API
export interface IssueListRequest {
  filter?: IssueFilter;
  page?: number;
  perPage?: number;
}

export interface IssueGetRequest {
  id: number;
}

export interface IssueCreateRequest extends CreateIssueInput {}

export interface IssueUpdateRequest {
  id: number;
  data: UpdateIssueInput;
}

export interface IssueDeleteRequest {
  id: number;
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
  username?: string;
}

export interface GetTokenResponse {
  token: string | null;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  email?: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  private: boolean;
  description: string;
}

export interface GitHubApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
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

// Auth API (Feature: 002-github-app-auth)
export interface AuthGetSessionResponse {
  session: UserSession | null;
}

export interface AuthLoginSuccessEvent {
  user: User;
  installations: Installation[];
}

export interface AuthUserCodeEvent {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
}

export interface AuthLoginErrorEvent {
  code: 'NETWORK_ERROR' | 'TIMEOUT' | 'ACCESS_DENIED' | 'RATE_LIMIT' | 'UNKNOWN';
  message: string;
  retryable: boolean;
}

export interface AuthSelectInstallationRequest {
  installationId: number;
}

export interface AuthSelectInstallationResponse {
  success: boolean;
}

export interface AuthRefreshInstallationTokenRequest {
  installationId: number;
}

export interface AuthRefreshInstallationTokenResponse {
  success: boolean;
}

export interface AuthLogoutResponse {
  success: boolean;
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

export interface ZoomResponse {
  success: boolean;
  zoomLevel?: number;
}

// Image upload API
export interface ImageSelectResponse {
  success: boolean;
  message?: string;
  filePath?: string;
  data?: {
    fileName: string;
    contentType: string;
    buffer: number[];
    size: number;
  };
}

export interface ImageDataUrlRequest {
  buffer: number[]; // Image buffer as number array for IPC transfer
  contentType: string; // MIME type (e.g., 'image/png', 'image/jpeg')
}

export interface ImageDataUrlResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    size: number;
  };
}

export interface R2UploadRequest {
  buffer: number[];
  fileName: string;
  contentType: string;
}

export interface R2UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    key: string;
    size: number;
  };
}

export interface R2ConfigRequest {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
  enabled: boolean;
}

export interface R2ConfigResponse {
  success: boolean;
  message?: string;
}

export interface R2TestConnectionResponse {
  success: boolean;
  message?: string;
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

  // Comments
  comments: {
    list: (req: CommentListRequest) => Promise<CommentListResponse>;
    get: (req: CommentGetRequest) => Promise<CommentGetResponse>;
    create: (req: CommentCreateRequest) => Promise<CommentCreateResponse>;
    update: (req: CommentUpdateRequest) => Promise<CommentUpdateResponse>;
    delete: (req: CommentDeleteRequest) => Promise<CommentDeleteResponse>;
  };

  // Sync
  sync: {
    start: () => Promise<{ syncId: string }>;
    getStatus: () => Promise<SyncEngineStatus>;
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
    testConnection: (token: string) => Promise<GitHubApiResponse<boolean>>;
    getUser: (token: string) => Promise<GitHubApiResponse<GitHubUser>>;
    getRepositories: (token: string) => Promise<GitHubApiResponse<GitHubRepository[]>>;
    setR2Config: (req: R2ConfigRequest) => Promise<R2ConfigResponse>;
    getR2Config: () => Promise<{ config: R2ConfigRequest | null }>;
    testR2Connection: () => Promise<R2TestConnectionResponse>;
    uploadToR2: (req: R2UploadRequest) => Promise<R2UploadResponse>;
  };

  // Analytics
  analytics: {
    getDashboard: () => Promise<DashboardAnalytics>;
  };

  // Auth (Feature: 002-github-app-auth)
  auth: {
    githubLogin: () => Promise<void>;
    getSession: () => Promise<AuthGetSessionResponse>;
    selectInstallation: (req: AuthSelectInstallationRequest) => Promise<AuthSelectInstallationResponse>;
    checkInstallations: () => Promise<{ installations: Installation[] }>;
    refreshInstallationToken: (req: AuthRefreshInstallationTokenRequest) => Promise<AuthRefreshInstallationTokenResponse>;
    logout: () => Promise<AuthLogoutResponse>;
  };

  // System
  system: {
    openExternal: (req: OpenExternalRequest) => Promise<{ success: boolean }>;
    getVersion: () => Promise<VersionInfo>;
    getInfo: () => Promise<any>;
    checkForUpdates: () => Promise<any>;
    zoomIn: () => Promise<ZoomResponse>;
    zoomOut: () => Promise<ZoomResponse>;
    resetZoom: () => Promise<ZoomResponse>;
    getZoomLevel: () => Promise<ZoomResponse>;
    setWindowTitle: (title: string) => Promise<{ success: boolean }>;
    selectImage: () => Promise<ImageSelectResponse>;
    imageToDataUrl: (req: ImageDataUrlRequest) => Promise<ImageDataUrlResponse>;
  };

  // Event listeners
  on: (
    channel: 'sync:progress' | 'sync:conflict' | 'rate-limit:warning' | 'token:invalid' 
      | 'auth:user-code' | 'auth:login-success' | 'auth:login-error' | 'auth:token-refreshed' | 'auth:session-expired',
    callback: (data: any) => void
  ) => void;
}

// Error response
export interface IpcError {
  code: string;
  message: string;
  details?: any;
}
