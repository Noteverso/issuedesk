/**
 * Auth Context for managing authentication state
 * Feature: 002-github-app-auth
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserSession, User, Installation } from '@issuedesk/shared';
import { authService } from '../services/auth.service';

interface AuthContextType {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session on mount
    loadSession();

    // Listen for login success
    authService.onLoginSuccess((event) => {
      // Session will be saved by IPC handler, reload it
      loadSession();
    });

    // Listen for session expired
    authService.onSessionExpired(() => {
      setSession(null);
    });
  }, []);

  const loadSession = async () => {
    try {
      const { session: storedSession } = await authService.getSession();
      setSession(storedSession);
    } catch (error) {
      console.error('Failed to load session:', error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    await authService.githubLogin();
  };

  const logout = async () => {
    await authService.logout();
    setSession(null);
  };

  const refreshSession = async () => {
    await loadSession();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
