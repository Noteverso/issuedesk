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
  const response = await fetch(`${backendUrl}/auth/device`, {
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

    const response = await fetch(`${backendUrl}/auth/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
    });

    // Handle different HTTP status codes like desktop
    if (response.status === 202) {
      // Authorization pending - continue polling
      await sleep(interval);
      continue;
    }

    if (response.status === 429) {
      // Slow down - increase interval
      await sleep(interval + 5000);
      continue;
    }

    if (response.status === 410) {
      // Device code expired
      throw new Error('DEVICE_CODE_EXPIRED');
    }

    if (response.status === 403) {
      // Access denied
      throw new Error('ACCESS_DENIED');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Authentication failed');
    }

    // Success! Parse response
    const data = await response.json() as {
      sessionToken: string;
      user: {
        id: number;
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
      userId: data.user.id.toString(),
      username: data.user.login,
      avatarUrl: data.user.avatar_url,
      sessionToken: data.sessionToken,
      selectedInstallationId: installations[0]?.id ?? 0,
    };

    return { sessionToken: data.sessionToken, user, installations };
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
  const response = await fetch(`${backendUrl}/auth/installation-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Token': sessionToken,
    },
    body: JSON.stringify({ installation_id: installationId }),
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
  const backendUrl = getAuthBackendUrl();
  const session = await secureStorage.getSession();

  if (session?.sessionToken) {
    await fetch(`${backendUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': session.sessionToken,
      },
    }).catch(() => {
      // Ignore network errors on logout
    });
  }

  await secureStorage.clearAll();
}

/**
 * Helper: sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
