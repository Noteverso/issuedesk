/**
 * AuthGuard Component
 * Feature: 002-github-app-auth
 * Tasks: T076-T077 - Route protection
 * 
 * Protects routes that require authentication. Redirects to login if not authenticated.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../common/Spinner';

export interface AuthGuardProps {
  /** Child components to render if authenticated */
  children: React.ReactNode;
  
  /** Optional: Redirect path if not authenticated (default: /login) */
  redirectTo?: string;
  
  /** Optional: Require installation token (default: false) */
  requireInstallation?: boolean;
}

/**
 * AuthGuard component for protecting routes
 * 
 * Usage:
 * ```tsx
 * <Route path="/dashboard" element={
 *   <AuthGuard requireInstallation>
 *     <Dashboard />
 *   </AuthGuard>
 * } />
 * ```
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/login',
  requireInstallation = false 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, session } = useAuth();
  const location = useLocation();

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen text="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if installation token required
  if (requireInstallation && !session?.credentials) {
    // User is authenticated but hasn't selected an installation
    // Redirect to login to restart the authentication flow
    console.warn('[AuthGuard] No installation token found, redirecting to login');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
}

/**
 * Higher-order component version of AuthGuard
 * 
 * Usage:
 * ```tsx
 * const ProtectedDashboard = withAuthGuard(Dashboard, { requireInstallation: true });
 * ```
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
