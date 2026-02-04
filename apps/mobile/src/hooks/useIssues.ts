import { useState, useEffect, useCallback } from 'react';
import { githubClient } from '../api/client';
import { useRepository } from '../contexts/RepositoryContext';

interface Issue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: Array<{ id: number; name: string; color: string; description: string | null }>;
  user: { login: string; avatar_url: string };
  created_at: string;
  comments: number;
  body?: string | null;
}

interface UseIssuesOptions {
  state?: 'open' | 'closed' | 'all';
  labels?: string;
  per_page?: number;
}

interface UseIssuesResult {
  issues: Issue[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing issues
 * Implements FR-015, FR-016
 */
export function useIssues(options: UseIssuesOptions = {}): UseIssuesResult {
  const { repository } = useRepository();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    state = 'all',
    labels,
    per_page = 100,
  } = options;

  const loadIssues = useCallback(async () => {
    if (!repository) {
      setIssues([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await githubClient.getIssues({
        state,
        labels,
        per_page,
      });
      setIssues(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues');
    }
  }, [repository, state, labels, per_page]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadIssues();
    setIsLoading(false);
  }, [loadIssues]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    issues,
    isLoading,
    error,
    refresh,
  };
}
