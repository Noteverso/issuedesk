/**
 * Repository context for managing active repository state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { preferenceStorage } from '../services/storage';
import { githubClient } from '../api/client';
import type { SelectedRepository } from '../types';

interface RepositoryState {
  isLoading: boolean;
  repository: SelectedRepository | null;
  error: string | null;
}

interface RepositoryContextValue extends RepositoryState {
  selectRepository: (repo: SelectedRepository) => Promise<void>;
  clearRepository: () => Promise<void>;
  refreshRepository: () => Promise<void>;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

interface RepositoryProviderProps {
  children: ReactNode;
}

export function RepositoryProvider({ children }: RepositoryProviderProps) {
  const [state, setState] = useState<RepositoryState>({
    isLoading: true,
    repository: null,
    error: null,
  });

  // Initialize repository state from storage
  useEffect(() => {
    async function initialize() {
      try {
        const repo = await preferenceStorage.getSelectedRepository();
        if (repo) {
          githubClient.setRepository(repo);
        }
        setState({
          isLoading: false,
          repository: repo,
          error: null,
        });
      } catch {
        setState({
          isLoading: false,
          repository: null,
          error: null,
        });
      }
    }

    initialize();
  }, []);

  const selectRepository = useCallback(async (repo: SelectedRepository) => {
    await preferenceStorage.saveSelectedRepository(repo);
    githubClient.setRepository(repo);
    setState({
      isLoading: false,
      repository: repo,
      error: null,
    });
  }, []);

  const clearRepository = useCallback(async () => {
    await preferenceStorage.clearSelectedRepository();
    setState({
      isLoading: false,
      repository: null,
      error: null,
    });
  }, []);

  const refreshRepository = useCallback(async () => {
    const repo = await preferenceStorage.getSelectedRepository();
    if (repo) {
      githubClient.setRepository(repo);
    }
    setState((prev) => ({
      ...prev,
      repository: repo,
    }));
  }, []);

  const value: RepositoryContextValue = {
    ...state,
    selectRepository,
    clearRepository,
    refreshRepository,
  };

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository(): RepositoryContextValue {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}
