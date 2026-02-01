/**
 * IssueDesk Mobile App
 * Root component with context providers and navigation
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { RepositoryProvider } from './src/contexts/RepositoryContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RepositoryProvider>
          <AppContent />
        </RepositoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
