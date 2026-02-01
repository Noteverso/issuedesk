/**
 * Authentication service for GitHub App device flow
 */

import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { getAuthBackendUrl } from './client';
import { secureStorage } from '../services/storage';
import type { DeviceAuthorization, UserSession, Installation, AccessToken } from '../types';

const DEVICE_CODE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_POLL_INTERVAL_MS = 5000; // 5 seconds
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry

/**
 * Start the device flow authentication
 */
export async function startDeviceFlow(): Promise<DeviceAuthorization> {
  const backendUrl = getAuthBackendUrl();
  const response = await fetch(`${backendUrl}/auth/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Failed to start device flow');
  }

  const data = await response.json() as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
  };

  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri,
    expiresAt: Date.now() + data.expires_in * 1000,
    interval: data.interval * 1000 || DEFAULT_POLL_INTERVAL_MS,
  };
}

/**
 * Copy user code to clipboard
 */
export async function copyUserCode(userCode: string): Promise<void> {
  await Clipboard.setStringAsync(userCode);
}

/**
 * Open GitHub authorization page in browser
 */
export async function openAuthorizationPage(verificationUri: string): Promise<void> {
  await WebBrowser.openBrowserAsync(verificationUri);
}

/**
 * Poll for device flow completion
 */
export async function pollDeviceFlow(
  deviceCode: string,
  expiresAt: number,
  interval: number,
  onPoll?: () => void
): Promise<{ sessionToken: string; user: UserSession; installations: Installation[] }> {
  const backendUrl = getAuthBackendUrl();

  while (Date.now() < expiresAt) {
    onPoll?.();

    const response = await fetch(`${backendUrl}/auth/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
    });

    if (response.ok) {
      const data = await response.json() as {
        session_token: string;
        user: {
          id: string;
          login: string;
          avatar_url: string;
        };
        installations: Array<{
          id: number;
          account: {
            login: string;
            type: 'User' | 'Organization';
            avatar_url: string;
          };
        }>;
      };

      const installations: Installation[] = data.installations.map((inst) => ({
        id: inst.id,
        accountLogin: inst.account.login,
        accountType: inst.account.type,
        avatarUrl: inst.account.avatar_url,
      }));

      const user: UserSession = {
        userId: data.user.id,
        username: data.user.login,
        avatarUrl: data.user.avatar_url,
        sessionToken: data.session_token,
        selectedInstallationId: installations[0]?.id ?? 0,
      };

      return { sessionToken: data.session_token, user, installations };
    }

    const errorData = await response.json() as { error?: string };

    if (errorData.error === 'authorization_pending') {
      // User hasn't completed authorization yet, keep polling
      await sleep(interval);
      continue;
    }

    if (errorData.error === 'slow_down') {
      // Increase poll interval
      await sleep(interval + 5000);
      continue;
    }

    if (errorData.error === 'expired_token') {
      throw new Error('DEVICE_CODE_EXPIRED');
    }

    if (errorData.error === 'access_denied') {
      throw new Error('ACCESS_DENIED');
    }

    throw new Error(`Unexpected error: ${errorData.error}`);
  }

  throw new Error('DEVICE_CODE_TIMEOUT');
}

/**
 * Get installation access token
 */
export async function getInstallationToken(
  sessionToken: string,
  installationId: number
): Promise<AccessToken> {
  const backendUrl = getAuthBackendUrl();
  const response = await fetch(`${backendUrl}/auth/installation/${installationId}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error('Failed to get installation token');
  }

  const data = await response.json() as {
    token: string;
    expires_at: string;
  };

  return {
    token: data.token,
    expiresAt: new Date(data.expires_at).getTime(),
    installationId,
  };
}

/**
 * Refresh access token if needed
 */
export async function refreshTokenIfNeeded(): Promise<AccessToken | null> {
  const token = await secureStorage.getAccessToken();
  const session = await secureStorage.getSession();

  if (!token || !session) {
    return null;
  }

  // Check if token needs refresh (5-minute buffer)
  if (Date.now() < token.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return token;
  }

  // Refresh the token
  try {
    const newToken = await getInstallationToken(
      session.sessionToken,
      session.selectedInstallationId
    );
    await secureStorage.saveAccessToken(newToken);
    return newToken;
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      // Clear stored credentials
      await secureStorage.clearAll();
    }
    throw error;
  }
}

/**
 * Logout - clear all stored credentials
 */
export async function logout(): Promise<void> {
  await secureStorage.clearAll();
}

/**
 * Helper: sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
