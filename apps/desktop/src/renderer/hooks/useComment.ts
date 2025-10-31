import { useState, useEffect, useCallback } from 'react';
import { Comment, UpdateCommentInput } from '@issuedesk/shared';
import { ipcClient } from '../services/ipc';

interface UseCommentOptions {
  id?: string;
  githubId?: number;
  autoLoad?: boolean;
}

interface CreateCommentData {
  issueNumber: number;
  title?: string;
  description?: string;
  tags?: string[];
  body: string;
}

interface UseCommentReturn {
  comment: Comment | null;
  loading: boolean;
  error: Error | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  refetch: () => Promise<void>;
  create: (data: CreateCommentData) => Promise<Comment>;
  update: (data: UpdateCommentInput) => Promise<Comment>;
  deleteComment: () => Promise<void>;
}

/**
 * Hook for managing a single comment with CRUD operations
 * Handles metadata embedding/parsing automatically
 */
export function useComment({ id, githubId, autoLoad = true }: UseCommentOptions = {}): UseCommentReturn {
  const [comment, setComment] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchComment = useCallback(async () => {
    if (!id || !githubId) {
      setComment(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ipcClient.comments.get({ id, githubId });
      setComment(result.comment);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch comment');
      setError(error);
      console.error('Failed to fetch comment:', err);
    } finally {
      setLoading(false);
    }
  }, [id, githubId]);

  useEffect(() => {
    if (autoLoad && id && githubId) {
      fetchComment();
    }
  }, [fetchComment, autoLoad, id, githubId]);

  const create = useCallback(async (data: CreateCommentData): Promise<Comment> => {
    setCreating(true);
    setError(null);

    try {
      const result = await ipcClient.comments.create({
        issueNumber: data.issueNumber,
        title: data.title,
        description: data.description,
        tags: data.tags,
        body: data.body,
      });
      setComment(result.comment);
      return result.comment;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create comment');
      setError(error);
      console.error('Failed to create comment:', err);
      throw error;
    } finally {
      setCreating(false);
    }
  }, []);

  const update = useCallback(
    async (data: UpdateCommentInput): Promise<Comment> => {
      if (!id || !githubId) {
        throw new Error('Cannot update comment without id and githubId');
      }

      setUpdating(true);
      setError(null);

      try {
        const result = await ipcClient.comments.update({ 
          id, 
          githubId, 
          data 
        });
        setComment(result.comment);
        return result.comment;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update comment');
        setError(error);
        console.error('Failed to update comment:', err);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [id, githubId]
  );

  const deleteComment = useCallback(async (): Promise<void> => {
    if (!id || !githubId) {
      throw new Error('Cannot delete comment without id and githubId');
    }

    setDeleting(true);
    setError(null);

    try {
      await ipcClient.comments.delete({ id, githubId });
      setComment(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete comment');
      setError(error);
      console.error('Failed to delete comment:', err);
      throw error;
    } finally {
      setDeleting(false);
    }
  }, [id, githubId]);

  return {
    comment,
    loading,
    error,
    creating,
    updating,
    deleting,
    refetch: fetchComment,
    create,
    update,
    deleteComment,
  };
}

export default useComment;
