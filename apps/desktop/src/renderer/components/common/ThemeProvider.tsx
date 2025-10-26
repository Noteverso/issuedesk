import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '@issuedesk/shared';
import ipcClient from '../../services/ipc';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { settings } = await ipcClient.settings.get();
        setThemeState(settings.theme);
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Set data attribute for Tailwind dark mode
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = async (newTheme: ThemeMode) => {
    try {
      await ipcClient.settings.update({ theme: newTheme });
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to update theme:', error);
      throw error;
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
