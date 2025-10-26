import { useState, useEffect, useCallback } from 'react';
import { Issue, CreateIssueInput, UpdateIssueInput } from '@issuedesk/shared';
import ipcClient from '../services/ipc';

interface UseIssueOptions {
  id?: string;
  autoLoad?: boolean;
}

interface UseIssueReturn {
  issue: Issue | null;
  loading: boolean;
  error: Error | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  refetch: () => Promise<void>;
  create: (data: CreateIssueInput) => Promise<Issue>;
  update: (data: UpdateIssueInput) => Promise<Issue>;
  deleteIssue: () => Promise<void>;
}

/**
 * Hook for managing a single issue with CRUD operations
 */
export function useIssue({ id, autoLoad = true }: UseIssueOptions = {}): UseIssueReturn {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!id) {
      setIssue(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ipcClient.issues.get({ id });
      setIssue(result.issue);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch issue');
      setError(error);
      console.error('Failed to fetch issue:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (autoLoad && id) {
      fetchIssue();
    }
  }, [fetchIssue, autoLoad, id]);

  const create = useCallback(async (data: CreateIssueInput): Promise<Issue> => {
    setCreating(true);
    setError(null);

    try {
      const result = await ipcClient.issues.create(data);
      setIssue(result.issue);
      return result.issue;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create issue');
      setError(error);
      console.error('Failed to create issue:', err);
      throw error;
    } finally {
      setCreating(false);
    }
  }, []);

  const update = useCallback(
    async (data: UpdateIssueInput): Promise<Issue> => {
      if (!id) {
        throw new Error('Cannot update issue without id');
      }

      setUpdating(true);
      setError(null);

      try {
        const result = await ipcClient.issues.update({ id, data });
        setIssue(result.issue);
        return result.issue;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update issue');
        setError(error);
        console.error('Failed to update issue:', err);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [id]
  );

  const deleteIssue = useCallback(async (): Promise<void> => {
    if (!id) {
      throw new Error('Cannot delete issue without id');
    }

    setDeleting(true);
    setError(null);

    try {
      await ipcClient.issues.delete({ id });
      setIssue(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete issue');
      setError(error);
      console.error('Failed to delete issue:', err);
      throw error;
    } finally {
      setDeleting(false);
    }
  }, [id]);

  return {
    issue,
    loading,
    error,
    creating,
    updating,
    deleting,
    refetch: fetchIssue,
    create,
    update,
    deleteIssue,
  };
}

export default useIssue;
