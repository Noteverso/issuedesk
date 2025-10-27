import { useState, useEffect, useCallback } from 'react';
import { Label, CreateLabelInput, UpdateLabelInput } from '@issuedesk/shared';
import { ipcClient } from '../services/ipc';

interface UseLabelsResult {
  labels: Label[];
  loading: boolean;
  error: string | null;
  createLabel: (input: CreateLabelInput) => Promise<Label | null>;
  updateLabel: (id: string, data: UpdateLabelInput) => Promise<Label | null>;
  deleteLabel: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing labels
 * Provides CRUD operations and state management for GitHub labels
 */
export function useLabels(): UseLabelsResult {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ipcClient.labels.list();
      setLabels(response.labels || []);
    } catch (err: any) {
      console.error('Failed to fetch labels:', err);
      setError(err?.message || 'Failed to fetch labels');
      setLabels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = useCallback(async (input: CreateLabelInput): Promise<Label | null> => {
    try {
      setError(null);
      
      const response = await ipcClient.labels.create(input);
      
      if (response.label) {
        // Refresh the list to include the new label
        await fetchLabels();
        return response.label;
      }
      
      return null;
    } catch (err: any) {
      console.error('Failed to create label:', err);
      setError(err?.message || 'Failed to create label');
      return null;
    }
  }, [fetchLabels]);

  const updateLabel = useCallback(async (id: string, data: UpdateLabelInput): Promise<Label | null> => {
    try {
      setError(null);
      
      const response = await ipcClient.labels.update({ id, data });
      
      if (response.label) {
        // Update the label in the local state
        setLabels(prev => prev.map(label => 
          label.name === id ? response.label : label
        ));
        return response.label;
      }
      
      return null;
    } catch (err: any) {
      console.error('Failed to update label:', err);
      setError(err?.message || 'Failed to update label');
      return null;
    }
  }, []);

  const deleteLabel = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await ipcClient.labels.delete({ id });
      
      if (response.success) {
        // Remove the label from local state
        setLabels(prev => prev.filter(label => label.name !== id));
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error('Failed to delete label:', err);
      setError(err?.message || 'Failed to delete label');
      return false;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchLabels();
  }, [fetchLabels]);

  return {
    labels,
    loading,
    error,
    createLabel,
    updateLabel,
    deleteLabel,
    refetch,
  };
}

export default useLabels;

