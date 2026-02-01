/**
 * Authentication context for managing user session state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { secureStorage } from '../services/storage';
import { githubClient } from '../api/client';
import { refreshTokenIfNeeded, logout as authLogout, getInstallationToken } from '../api/auth';
import type { UserSession, Installation, AccessToken } from '../types';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: UserSession | null;
  installations: Installation[];
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (session: UserSession, installations: Installation[]) => Promise<void>;
  logout: () => Promise<void>;
  selectInstallation: (installationId: number) => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    installations: [],
    error: null,
  });

  // Initialize auth state from storage
  useEffect(() => {
    async function initialize() {
      try {
        const session = await secureStorage.getSession();
        const token = await secureStorage.getAccessToken();

        if (session && token) {
          // Try to refresh token if needed
          const refreshedToken = await refreshTokenIfNeeded();
          if (refreshedToken) {
            githubClient.setAccessToken(refreshedToken.token);
            setState({
              isLoading: false,
              isAuthenticated: true,
              user: session,
              installations: [], // Will be fetched on demand
              error: null,
            });
            return;
          }
        }

        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          installations: [],
          error: null,
        });
      } catch {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          installations: [],
          error: null,
        });
      }
    }

    initialize();
  }, []);

  const login = useCallback(async (session: UserSession, installations: Installation[]) => {
    // Save session to secure storage
    await secureStorage.saveSession(session);

    // Get installation token for the selected installation
    const token = await getInstallationToken(
      session.sessionToken,
      session.selectedInstallationId
    );
    await secureStorage.saveAccessToken(token);
    githubClient.setAccessToken(token.token);

    setState({
      isLoading: false,
      isAuthenticated: true,
      user: session,
      installations,
      error: null,
    });
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      installations: [],
      error: null,
    });
  }, []);

  const selectInstallation = useCallback(async (installationId: number) => {
    if (!state.user) return;

    const updatedSession: UserSession = {
      ...state.user,
      selectedInstallationId: installationId,
    };

    await secureStorage.saveSession(updatedSession);

    // Get new token for selected installation
    const token = await getInstallationToken(
      updatedSession.sessionToken,
      installationId
    );
    await secureStorage.saveAccessToken(token);
    githubClient.setAccessToken(token.token);

    setState((prev) => ({
      ...prev,
      user: updatedSession,
    }));
  }, [state.user]);

  const refreshToken = useCallback(async () => {
    try {
      const token = await refreshTokenIfNeeded();
      if (token) {
        githubClient.setAccessToken(token.token);
      } else {
        // Token couldn't be refreshed, need to re-authenticate
        await logout();
      }
    } catch {
      await logout();
    }
  }, [logout]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    selectInstallation,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
