import { useState, useEffect, useCallback } from 'react';
import { githubClient } from '../api/client';
import { useRepository } from '../contexts/RepositoryContext';

interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface UseLabelsResult {
  labels: Label[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching repository labels
 * Implements FR-028
 */
export function useLabels(): UseLabelsResult {
  const { repository } = useRepository();
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLabels = useCallback(async () => {
    if (!repository) {
      setLabels([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await githubClient.getLabels();
      setLabels(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load labels');
    }
  }, [repository]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadLabels();
    setIsLoading(false);
  }, [loadLabels]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    labels,
    isLoading,
    error,
    refresh,
  };
}
