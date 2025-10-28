// Issue-related types
import { Label } from './label';

export type IssueState = 'open' | 'closed';

export type IssueSyncStatus =
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
  created_at: string; // ISO 8601 timestamp from GitHub API
  updated_at: string; // ISO 8601 timestamp from GitHub API
  html_url: string; // GitHub URL
  syncStatus: IssueSyncStatus;
  localUpdatedAt: number; // Unix timestamp (ms)
  remoteUpdatedAt: number | null;
  bodyChecksum: string | null; // SHA-256 hash
  labels: Label[]; // Full label objects
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
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
