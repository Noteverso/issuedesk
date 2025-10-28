import { useState, useEffect, useCallback } from 'react';
import { AppSettings, ThemeMode, EditorMode, ViewPreferences } from '@issuedesk/shared';
import { ipcClient } from '../services/ipc';

interface UseSettingsReturn {
  settings: AppSettings | null;
  loading: boolean;
  error: Error | null;
  updateTheme: (theme: ThemeMode) => Promise<void>;
  updateEditorMode: (mode: EditorMode) => Promise<void>;
  updateViewPreferences: (prefs: Partial<ViewPreferences>) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing application settings
 * Handles theme, editor mode, view preferences, and repository configuration
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ipcClient.settings.get();
      setSettings(result.settings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch settings');
      setError(error);
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateTheme = useCallback(async (theme: ThemeMode) => {
    try {
      const result = await ipcClient.settings.update({ theme });
      setSettings(result.settings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update theme');
      setError(error);
      throw error;
    }
  }, []);

  const updateEditorMode = useCallback(async (mode: EditorMode) => {
    try {
      const result = await ipcClient.settings.update({ editorMode: mode });
      setSettings(result.settings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update editor mode');
      setError(error);
      throw error;
    }
  }, []);

  const updateViewPreferences = useCallback(async (prefs: Partial<ViewPreferences>) => {
    try {
      const result = await ipcClient.settings.update({ viewPreferences: prefs });
      setSettings(result.settings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update view preferences');
      setError(error);
      throw error;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    updateTheme,
    updateEditorMode,
    updateViewPreferences,
    refetch: fetchSettings,
  };
}

export default useSettings;
