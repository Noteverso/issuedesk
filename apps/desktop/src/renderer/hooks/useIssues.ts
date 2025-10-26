import { useState, useEffect, useCallback } from 'react';
import { Issue, IssueFilter, IssueListResult } from '@issuedesk/shared';
import ipcClient from '../services/ipc';

interface UseIssuesOptions {
  filter?: IssueFilter;
  page?: number;
  perPage?: number;
  autoLoad?: boolean;
}

interface UseIssuesReturn {
  issues: Issue[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setFilter: (filter: IssueFilter) => void;
}

/**
 * Hook for managing a list of issues with pagination and filtering
 */
export function useIssues({
  filter = {},
  page: initialPage = 1,
  perPage = 50,
  autoLoad = true,
}: UseIssuesOptions = {}): UseIssuesReturn {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [currentFilter, setFilter] = useState<IssueFilter>(filter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result: IssueListResult = await ipcClient.issues.list({
        filter: currentFilter,
        page,
        perPage,
      });

      setIssues(result.issues);
      setTotal(result.total);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch issues');
      setError(error);
      console.error('Failed to fetch issues:', err);
    } finally {
      setLoading(false);
    }
  }, [currentFilter, page, perPage]);

  useEffect(() => {
    if (autoLoad) {
      fetchIssues();
    }
  }, [fetchIssues, autoLoad]);

  const totalPages = Math.ceil(total / perPage);

  return {
    issues,
    total,
    page,
    totalPages,
    loading,
    error,
    refetch: fetchIssues,
    setPage,
    setFilter,
  };
}

export default useIssues;
