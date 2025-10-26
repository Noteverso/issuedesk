// Repository-related types
export interface Repository {
  owner: string;
  name: string;
  fullName: string; // "owner/name"
  lastSyncAt: number | null; // Unix timestamp (ms)
  databaseVersion: number;
}

export interface RepositoryConfig {
  id: string; // e.g., "github-octocat-hello-world"
  owner: string;
  name: string;
  dbPath: string; // Absolute path to SQLite file
  lastSyncAt: number | null;
}
