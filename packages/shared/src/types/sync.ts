// Sync-related types
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncEntityType = 'issue' | 'label';
export type ConflictResolution = 'local' | 'remote' | 'merged';

export interface SyncQueue {
  id: number;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: string | null; // JSON
  createdAt: number; // Unix timestamp (ms)
  retryAfter: number | null; // Unix timestamp (ms)
  error: string | null;
  attempts: number;
}

export interface ConflictData {
  issueId: string;
  issueNumber: number;
  issueTitle: string;
  localVersion: {
    title: string;
    body: string;
    updatedAt: number;
  };
  remoteVersion: {
    title: string;
    body: string;
    updatedAt: number;
  };
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  currentOperation: string;
}

export type SyncState = 'idle' | 'syncing' | 'conflict' | 'error';

export interface SyncStatus {
  status: SyncState;
  progress?: SyncProgress;
  lastSyncAt: number | null;
  conflicts: Array<{
    issueId: string;
    issueNumber: number;
    issueTitle: string;
  }>;
  error?: string;
}
