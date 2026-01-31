/**
 * IPC handlers for GitHub App authentication
 * Feature: 002-github-app-auth
 * 
 * Implements the auth IPC contract defined in packages/shared/src/types/ipc.ts
 */

import { ipcMain, BrowserWindow, clipboard } from 'electron';
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
  UserSession,
  Installation
} from '@issuedesk/shared';
import { getStoredSession, setStoredSession, clearStoredSession } from '../storage/auth-store';
import { SettingsManager } from '../settings/manager';
import { getBackendUrl } from '../config/environment';

// Backend Worker URL (configured via environment.ts)
const BACKEND_URL = getBackendUrl();
console.log(`[Auth] Using backend URL: ${BACKEND_URL}`);

// Device flow polling configuration
const POLL_INTERVAL_MS = 5000; // 5 seconds
const POLL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Register all auth IPC handlers.
 * Call this during app initialization.
 */
export function registerAuthHandlers(): void {
  // auth:github-login - Initiate GitHub device flow authentication
  ipcMain.handle('auth:github-login', async (event) => {
    try {
      // Step 1: Call backend to initiate device flow
      const deviceResponse = await fetch(`${BACKEND_URL}/auth/device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!deviceResponse.ok) {
        const error = await deviceResponse.json();
        emitLoginError(event, 'UNKNOWN', error.message || 'Failed to initiate device flow');
        return;
      }

      const deviceAuth = await deviceResponse.json();

      // Step 2: Copy device code to clipboard
      clipboard.writeText(deviceAuth.user_code);
      console.log(`[Auth] Device code copied to clipboard: ${deviceAuth.user_code}`);

      // Step 3: Emit user code event for UI to display
      const userCodeEvent: AuthUserCodeEvent = {
        userCode: deviceAuth.user_code,
        verificationUri: deviceAuth.verification_uri,
        expiresIn: deviceAuth.expires_in,
      };
      BrowserWindow.fromWebContents(event.sender)?.webContents.send('auth:user-code', userCodeEvent);

      // Step 4: Start polling for authorization (browser opens when user clicks "Open GitHub")
      await pollForAuthorization(
        event,
        deviceAuth.device_code,
        deviceAuth.interval * 1000 // Convert to milliseconds
      );
    } catch (error) {
      console.error('[Auth] Login error:', error);
      emitLoginError(
        event,
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network error during login'
      );
    }
  });

  // auth:get-session - Retrieve current session from encrypted storage
  // T053 & T054: Get session with validation
  ipcMain.handle('auth:get-session', async (): Promise<AuthGetSessionResponse> => {
    const session = getStoredSession();
    
    // T054: Validate session if it exists
    if (session) {
      // Check if installation token exists and is expired
      if (session.credentials) {
        const expiresAt = new Date(session.credentials.expires_at).getTime();
        const now = Date.now();
        
        // Token expired - clear it but keep session for re-authentication
        if (now >= expiresAt) {
          console.log('[Auth] Installation token expired, clearing from session');
          session.credentials = null;
          setStoredSession(session);
        }
      }
      
      // Validate session structure
      if (!session.user || !session.sessionToken || !session.installations) {
        console.error('[Auth] Invalid session structure, clearing session');
        clearStoredSession();
        return { session: null };
      }
    }
    
    return { session };
  });

  // auth:select-installation - Select a GitHub App installation
  ipcMain.handle('auth:select-installation', async (_event, req: AuthSelectInstallationRequest): Promise<AuthSelectInstallationResponse> => {
    try {
      const session = getStoredSession();
      if (!session) {
        throw new Error('No active session. Please login first.');
      }

      // Call backend to exchange installation ID for access token
      const tokenResponse = await fetch(`${BACKEND_URL}/auth/installation-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session.sessionToken,
        },
        body: JSON.stringify({ installation_id: req.installationId }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.message || 'Failed to get installation token');
      }

      const tokenData = await tokenResponse.json();
      console.log('[Auth] Received installation token:', tokenData);

      // Find the installation from the stored installations list
      const installation = session.installations.find(i => i.id === req.installationId);
      if (!installation) {
        throw new Error(`Installation ${req.installationId} not found in session`);
      }

      // Update session with installation token
      session.credentials = {
        token: tokenData.token,
        expires_at: tokenData.expires_at,
        permissions: tokenData.permissions || installation.permissions || {},
        repository_selection: tokenData.repository_selection || installation.repository_selection || 'all',
      };
      
      // Store the selected installation
      session.currentInstallation = installation;

      // Save updated session
      setStoredSession(session);

      console.log(`[Auth] Selected installation ${req.installationId}`);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Select installation error:', error);
      throw error;
    }
  });

  // auth:check-installations - Check for new installations after user installs the app
  ipcMain.handle('auth:check-installations', async (): Promise<{ installations: Installation[] }> => {
    try {
      console.log('[Auth] Checking for installations...');
      const session = getStoredSession();

      if (!session) {
        throw new Error('No active session. Please login first.');
      }

      // Call backend to refresh installations from GitHub API
      const response = await fetch(`${BACKEND_URL}/auth/installations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session.sessionToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to fetch installations');
      }

      const data = await response.json();
      const installations = data.installations || [];

      // Update session with new installations
      session.installations = installations;
      
      // If installations found and none currently selected, auto-select the first one
      if (installations.length > 0 && !session.currentInstallation) {
        const firstInstallation = installations[0];
        console.log(`[Auth] Auto-selecting first installation: ${firstInstallation.id}`);
        
        try {
          // Exchange for installation token
          const tokenResponse = await fetch(`${BACKEND_URL}/auth/installation-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': session.sessionToken,
            },
            body: JSON.stringify({ installation_id: firstInstallation.id }),
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            session.credentials = {
              token: tokenData.token,
              expires_at: tokenData.expires_at,
              permissions: tokenData.permissions || firstInstallation.permissions || {},
              repository_selection: tokenData.repository_selection || firstInstallation.repository_selection || 'all',
            };
            session.currentInstallation = firstInstallation;
            console.log(`[Auth] ✅ Auto-selected installation ${firstInstallation.id} with token`);
          }
        } catch (error) {
          console.error('[Auth] Failed to auto-select installation:', error);
        }
      }
      
      setStoredSession(session);

      console.log(`[Auth] Found ${installations.length} installations`);
      return { installations };
    } catch (error) {
      console.error('[Auth] Check installations error:', error);
      throw error;
    }
  });

  // auth:refresh-installation-token - Refresh the installation access token
  // T063: Automatic token refresh implementation
  ipcMain.handle('auth:refresh-installation-token', async (event, req: AuthRefreshInstallationTokenRequest): Promise<AuthRefreshInstallationTokenResponse> => {
    try {
      const session = getStoredSession();
      if (!session) {
        throw new Error('No active session. Please login first.');
      }

      if (!session.credentials) {
        throw new Error('No installation token to refresh. Please select an installation first.');
      }

      // Call backend refresh endpoint
      const refreshResponse = await fetch(`${BACKEND_URL}/auth/refresh-installation-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session.sessionToken,
        },
        body: JSON.stringify({ installation_id: req.installationId }),
      });

      if (!refreshResponse.ok) {
        const error = await refreshResponse.json();
        console.error('[Auth] Token refresh failed:', error);
        
        // T068: Emit session expired event on refresh failure
        if (refreshResponse.status === 401) {
          const expiredEvent = { reason: 'Token refresh failed - session expired' };
          BrowserWindow.fromWebContents(event.sender)?.webContents.send('auth:session-expired', expiredEvent);
        }
        
        throw new Error(error.message || 'Failed to refresh installation token');
      }

      const tokenData = await refreshResponse.json();
      console.log('[Auth] Installation token refreshed successfully');

      // Update session with new token
      session.credentials = {
        token: tokenData.token,
        expires_at: tokenData.expires_at,
        permissions: session.credentials.permissions,
        repository_selection: session.credentials.repository_selection,
      };

      setStoredSession(session);

      // T067: Emit token refreshed event
      BrowserWindow.fromWebContents(event.sender)?.webContents.send('auth:token-refreshed');

      return {
        success: true,
      };
    } catch (error) {
      console.error('[Auth] Token refresh error:', error);
      throw error;
    }
  });

  // auth:logout - Clear session and logout
  // T074: Call backend to delete session, then clear local storage
  ipcMain.handle('auth:logout', async (): Promise<AuthLogoutResponse> => {
    const session = getStoredSession();
    
    // If no session exists, nothing to logout
    if (!session?.sessionToken) {
      clearStoredSession();
      return { success: true };
    }

    try {
      // Call backend to delete session from KV storage
      const response = await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session.sessionToken,
        },
      });

      if (!response.ok) {
        console.error('[Auth] Backend logout failed:', await response.text());
        // Continue with local cleanup even if backend fails
      }
    } catch (error) {
      console.error('[Auth] Logout network error:', error);
      // Continue with local cleanup even if network fails
    }

    // Always clear local storage
    clearStoredSession();
    
    // Also clear active repository since it's tied to the authenticated session
    const settingsManager = new SettingsManager();
    settingsManager.setActiveRepository(null);
    
    return { success: true };
  });
}

/**
 * Poll backend for device authorization completion.
 * Implements exponential backoff on rate limits and proper error handling.
 */
async function pollForAuthorization(
  event: Electron.IpcMainInvokeEvent,
  deviceCode: string,
  intervalMs: number
): Promise<void> {
  const startTime = Date.now();
  let currentInterval = intervalMs;
  let consecutiveSlowDowns = 0;

  while (true) {
    // Check timeout (15 minutes)
    if (Date.now() - startTime > POLL_TIMEOUT_MS) {
      emitLoginError(event, 'TIMEOUT', 'Login timed out. Please try again.');
      return;
    }

    // Wait before polling
    await sleep(currentInterval);

    try {
      const pollResponse = await fetch(`${BACKEND_URL}/auth/poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_code: deviceCode }),
      });

      // Handle different response codes
      if (pollResponse.status === 202) {
        // Authorization pending - continue polling
        continue;
      }

      if (pollResponse.status === 429) {
        // Slow down - exponential backoff
        consecutiveSlowDowns++;
        currentInterval = intervalMs * Math.pow(2, consecutiveSlowDowns);
        console.log(`[Auth] Rate limited, increasing interval to ${currentInterval}ms`);
        continue;
      }

      if (pollResponse.status === 410) {
        // Device code expired
        emitLoginError(event, 'TIMEOUT', 'Device code expired. Please try again.');
        return;
      }

      if (pollResponse.status === 403) {
        // Access denied
        emitLoginError(event, 'ACCESS_DENIED', 'Access denied by user.');
        return;
      }

      if (!pollResponse.ok) {
        const error = await pollResponse.json();
        emitLoginError(event, 'UNKNOWN', error.message || 'Authentication failed');
        return;
      }

      // Success! Parse response and save session
      const authData = await pollResponse.json();

      // Create user session with proper typing
      const session: UserSession = {
        sessionToken: authData.sessionToken,
        user: authData.user,
        installations: authData.installations || [],
        currentInstallation: null,
        credentials: null,
      };

      // Automatically select first installation if available
      if (authData.installations && authData.installations.length > 0) {
        const firstInstallation = authData.installations[0];
        console.log(`[Auth] Auto-selecting first installation: ${firstInstallation.id}`);
        console.log(`[Auth] Backend URL: ${BACKEND_URL}/auth/installation-token`);
        
        try {
          // Exchange for installation token
          console.log(`[Auth] Sending POST request to ${BACKEND_URL}/auth/installation-token`);
          const tokenResponse = await fetch(`${BACKEND_URL}/auth/installation-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Session-Token': authData.sessionToken,
            },
            body: JSON.stringify({ installation_id: firstInstallation.id }),
          });

          console.log(`[Auth] Token response status: ${tokenResponse.status}`);
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            console.log('[Auth] Successfully received installation token', tokenData);
            console.log('[Auth] Token data:', {
              hasToken: !!tokenData.token,
              tokenLength: tokenData.token?.length,
              expiresAt: tokenData.expires_at,
              hasPermissions: !!tokenData.permissions,
              repositorySelection: tokenData.repository_selection,
            });
            
            // Update session with installation token
            // Use data from backend if available, otherwise use installation data
            session.credentials = {
              token: tokenData.token,
              expires_at: tokenData.expires_at,
              permissions: tokenData.permissions || firstInstallation.permissions || {},
              repository_selection: tokenData.repository_selection || firstInstallation.repository_selection || 'all',
            };
            session.currentInstallation = firstInstallation;
            
            // Save updated session
            setStoredSession(session);
            console.log(`[Auth] ✅ Auto-selected installation ${firstInstallation.id} with token`);
            console.log('[Auth] Session now contains:', {
              hasUser: !!session.user,
              hasInstallationToken: !!session.credentials,
              hasCurrentInstallation: !!session.currentInstallation,
            });
          } else {
            const errorData = await tokenResponse.json().catch(() => ({ message: 'Unknown error' }));
            console.error(`[Auth] ❌ Failed to get installation token: ${tokenResponse.status} - ${JSON.stringify(errorData)}`);
          }
        } catch (error) {
          console.error('[Auth] ❌ Failed to auto-select installation:', error);
          console.error('[Auth] Error details:', error instanceof Error ? error.message : String(error));
          // Non-fatal - user can select manually later
        }
      } else {
        console.warn('[Auth] ⚠️  No installations available to auto-select');
      }

      // Save session to encrypted storage (after installation token is fetched)
      setStoredSession(session);

      // Emit success event (after installation token is ready)
      const successEvent: AuthLoginSuccessEvent = {
        user: authData.user,
        installations: authData.installations,
      };
      console.log('[Auth] Emitting login success event with session:', {
        hasUser: !!session.user,
        hasInstallationToken: !!session.credentials,
        installationId: session.currentInstallation?.id,
      });
      BrowserWindow.fromWebContents(event.sender)?.webContents.send('auth:login-success', successEvent);

      return;
    } catch (error) {
      console.error('[Auth] Polling error:', error);
      emitLoginError(
        event,
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Network error during polling'
      );
      return;
    }
  }
}

/**
 * Emit login error event to renderer
 */
function emitLoginError(
  event: Electron.IpcMainInvokeEvent,
  code: AuthLoginErrorEvent['code'],
  message: string
): void {
  const errorEvent: AuthLoginErrorEvent = {
    code,
    message,
    retryable: code === 'NETWORK_ERROR' || code === 'RATE_LIMIT',
  };
  BrowserWindow.fromWebContents(event.sender)?.webContents.send('auth:login-error', errorEvent);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
