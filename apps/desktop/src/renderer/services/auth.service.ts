/**
 * Desktop auth service - IPC wrapper for renderer process
 * Feature: 002-github-app-auth
 * 
 * Provides a clean API for renderer components to interact with auth system.
 */

import type {
  AuthGetSessionResponse,
  AuthSelectInstallationRequest,
  AuthSelectInstallationResponse,
  AuthRefreshInstallationTokenRequest,
  AuthRefreshInstallationTokenResponse,
  AuthLogoutResponse,
  AuthUserCodeEvent,
  AuthLoginSuccessEvent,
  AuthLoginErrorEvent,
  Installation,
} from '@issuedesk/shared';

/**
 * Auth service for renderer process.
 * Wraps IPC calls with type-safe interface.
 */
export class AuthService {
  /**
   * Initiate GitHub App device flow authentication.
   * Triggers login process and emits events during flow.
   * 
   * Events emitted:
   * - auth:user-code (device code to display)
   * - auth:login-success (successful login)
   * - auth:login-error (login failed)
   */
  async githubLogin(): Promise<void> {
    return window.electronAPI.auth.githubLogin();
  }

  /**
   * Get current session from encrypted storage.
   * Returns null if no session exists or session is expired.
   */
  async getSession(): Promise<AuthGetSessionResponse> {
    return window.electronAPI.auth.getSession();
  }

  /**
   * Select a GitHub App installation.
   * Exchanges installation ID for access token and stores it.
   * 
   * @param installationId - The installation ID to select
   */
  async selectInstallation(installationId: number): Promise<AuthSelectInstallationResponse> {
    return window.electronAPI.auth.selectInstallation({ installationId });
  }

  /**
   * Check for new installations after user installs the app.
   * Returns updated list of installations.
   */
  async checkInstallations(): Promise<{ installations: Installation[] }> {
    return window.electronAPI.auth.checkInstallations();
  }

  /**
   * Refresh the installation access token.
   * Used when token is about to expire (< 5 minutes remaining).
   * 
   * @param installationId - The installation ID to refresh token for
   */
  async refreshInstallationToken(installationId: number): Promise<AuthRefreshInstallationTokenResponse> {
    return window.electronAPI.auth.refreshInstallationToken({ installationId });
  }

  /**
   * Logout and clear session.
   * Removes session from encrypted storage and backend.
   */
  async logout(): Promise<AuthLogoutResponse> {
    return window.electronAPI.auth.logout();
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  /**
   * Listen for user code event (device flow step 1).
   * Display this code to user for GitHub authorization.
   * 
   * @param callback - Called when device code is available
   */
  onUserCode(callback: (event: AuthUserCodeEvent) => void): void {
    window.electronAPI.on('auth:user-code', callback);
  }

  /**
   * Listen for login success event.
   * Called after user completes GitHub authorization.
   * 
   * @param callback - Called with user data and installations
   */
  onLoginSuccess(callback: (event: AuthLoginSuccessEvent) => void): void {
    window.electronAPI.on('auth:login-success', callback);
  }

  /**
   * Listen for login error event.
   * Called if login fails at any step.
   * 
   * @param callback - Called with error details
   */
  onLoginError(callback: (event: AuthLoginErrorEvent) => void): void {
    window.electronAPI.on('auth:login-error', callback);
  }

  /**
   * Listen for token refreshed event.
   * Called after successful automatic token refresh.
   * 
   * @param callback - Called when token is refreshed
   */
  onTokenRefreshed(callback: () => void): void {
    window.electronAPI.on('auth:token-refreshed', callback);
  }

  /**
   * Listen for session expired event.
   * Called when session expires and user needs to re-authenticate.
   * 
   * @param callback - Called when session expires
   */
  onSessionExpired(callback: () => void): void {
    window.electronAPI.on('auth:session-expired', callback);
  }
}

/**
 * Singleton instance of AuthService.
 * Use this throughout the renderer process.
 */
export const authService = new AuthService();
