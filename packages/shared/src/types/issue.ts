// Issue-related types
export type IssueState = 'open' | 'closed';

export type SyncStatus =
  | 'synced'
  | 'pending_create'
  | 'pending_update'
  | 'pending_delete'
  | 'conflict';

export interface Issue {
  id: string; // UUID v4
  number: number; // GitHub issue number
  title: string;
  body: string | null;
  state: IssueState;
  createdAt: number; // Unix timestamp (ms)
  updatedAt: number; // Unix timestamp (ms)
  githubUrl: string;
  syncStatus: SyncStatus;
  localUpdatedAt: number; // Unix timestamp (ms)
  remoteUpdatedAt: number | null;
  bodyChecksum: string | null; // SHA-256 hash
  labels: string[]; // Label IDs
}

export interface CreateIssueInput {
  title: string;
  body?: string;
  labels?: string[];
}

export interface UpdateIssueInput {
  title?: string;
  body?: string;
  state?: IssueState;
  labels?: string[];
}

export interface IssueFilter {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  search?: string;
}

export interface IssueListResult {
  issues: Issue[];
  totalCount: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
