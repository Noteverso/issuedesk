import { useState, useEffect, useCallback } from 'react';
import { githubClient } from '../api/client';
import { useRepository } from '../contexts/RepositoryContext';

interface Comment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body: string;
  created_at: string;
  updated_at: string;
}

interface UseCommentsResult {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addComment: (body: string) => Promise<void>;
}

/**
 * Hook for fetching and managing issue comments
 * Implements FR-025, FR-026
 */
export function useComments(issueNumber: number): UseCommentsResult {
  const { repository } = useRepository();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!repository || !issueNumber) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await githubClient.getComments(issueNumber);
      setComments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    }
  }, [repository, issueNumber]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadComments();
    setIsLoading(false);
  }, [loadComments]);

  const addComment = useCallback(async (body: string) => {
    if (!repository || !issueNumber) {
      throw new Error('Repository and issue number required');
    }

    try {
      const newComment = await githubClient.createComment(issueNumber, body);
      setComments((prev) => [...prev, newComment]);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [repository, issueNumber]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    comments,
    isLoading,
    error,
    refresh,
    addComment,
  };
}
