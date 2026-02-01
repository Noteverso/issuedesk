/**
 * Theme context for managing light/dark mode
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { preferenceStorage } from '../services/storage';
import { createTheme, lightTheme, darkTheme, type Theme, type ThemeMode } from '../styles/theme';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    async function loadPreference() {
      const prefs = await preferenceStorage.getPreferences();
      setThemePreferenceState(prefs.themeMode);
      setIsInitialized(true);
    }
    loadPreference();
  }, []);

  // Determine the actual theme mode
  const resolvedMode: ThemeMode = 
    themePreference === 'system'
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : themePreference;

  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;
  const isDark = resolvedMode === 'dark';

  const setThemePreference = useCallback(async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    await preferenceStorage.savePreferences({ themeMode: preference });
  }, []);

  const value: ThemeContextValue = {
    theme,
    themePreference,
    setThemePreference,
    isDark,
  };

  // Don't render children until we've loaded the preference
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
