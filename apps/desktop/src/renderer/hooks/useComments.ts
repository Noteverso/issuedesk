import { useState, useEffect, useCallback } from 'react';
import { Comment, CommentFilter } from '@issuedesk/shared';
import { ipcClient } from '../services/ipc';

interface UseCommentsOptions {
  issueNumber: number;
  filter?: CommentFilter;
  autoLoad?: boolean;
}

interface UseCommentsReturn {
  comments: Comment[];
  total: number;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setFilter: (filter: CommentFilter) => void;
}

/**
 * Hook for managing a list of comments for an issue with filtering
 * Tag filtering uses AND logic (all tags must match)
 * Since filtering shows only comments updated after the given time
 */
export function useComments({
  issueNumber,
  filter = {},
  autoLoad = true,
}: UseCommentsOptions): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<CommentFilter>(filter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Sync external filter props with internal state
  useEffect(() => {
    setCurrentFilter(filter);
  }, [filter]);

  const fetchComments = useCallback(async () => {
    if (!issueNumber) {
      setComments([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ipcClient.comments.list({
        issueNumber,
        filter: currentFilter,
      });

      setComments(result.comments);
      setTotal(result.totalCount);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch comments');
      setError(error);
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [issueNumber, currentFilter]);

  useEffect(() => {
    if (autoLoad) {
      fetchComments();
    }
  }, [fetchComments, autoLoad]);

  return {
    comments,
    total,
    loading,
    error,
    refetch: fetchComments,
    setFilter: setCurrentFilter,
  };
}

export default useComments;
