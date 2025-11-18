/**
 * IPC handlers for GitHub App authentication
 * Feature: 002-github-app-auth
 * 
 * Implements the auth IPC contract defined in packages/shared/src/types/ipc.ts
 */

import { ipcMain, shell, BrowserWindow } from 'electron';
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
} from '@issuedesk/shared';
import { getStoredSession, setStoredSession, clearStoredSession } from '../storage/auth-store';

// Backend Worker URL (development: localhost, production: deployed worker)
const BACKEND_URL = process.env.AUTH_WORKER_URL || 'http://localhost:8787';

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

      // Step 2: Emit user code event for UI to display
      const userCodeEvent: AuthUserCodeEvent = {
        userCode: deviceAuth.user_code,
        verificationUri: deviceAuth.verification_uri,
        expiresIn: deviceAuth.expires_in,
      };
      BrowserWindow.fromWebContents(event.sender)?.webContents.send('auth:user-code', userCodeEvent);

      // Step 3: Open browser to GitHub authorization page
      await shell.openExternal(deviceAuth.verification_uri);

      // Step 4: Start polling for authorization
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
  ipcMain.handle('auth:get-session', async (): Promise<AuthGetSessionResponse> => {
    const session = getStoredSession();
    return { session };
  });

  // auth:select-installation - Select a GitHub App installation
  ipcMain.handle('auth:select-installation', async (_event, _req: AuthSelectInstallationRequest): Promise<AuthSelectInstallationResponse> => {
    // TODO: Implement in Phase 5 (T046)
    throw new Error('auth:select-installation not implemented yet');
  });

  // auth:refresh-installation-token - Refresh the installation access token
  ipcMain.handle('auth:refresh-installation-token', async (_event, _req: AuthRefreshInstallationTokenRequest): Promise<AuthRefreshInstallationTokenResponse> => {
    // TODO: Implement in Phase 7 (T063)
    throw new Error('auth:refresh-installation-token not implemented yet');
  });

  // auth:logout - Clear session and logout
  ipcMain.handle('auth:logout', async (): Promise<AuthLogoutResponse> => {
    // TODO: Implement in Phase 5
    clearStoredSession();
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

      // Create user session
      const session = {
        userToken: authData.session_token,
        user: authData.user,
        currentInstallation: null,
        installationToken: null,
      };

      // Save to encrypted storage
      setStoredSession(session);

      // Emit success event
      const successEvent: AuthLoginSuccessEvent = {
        user: authData.user,
        installations: authData.installations,
      };
      console.log('Auth Success Event:', successEvent, session);
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
