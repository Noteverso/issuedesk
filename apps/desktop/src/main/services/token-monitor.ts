/**
 * Token Monitor Service
 * Feature: 002-github-app-auth
 * Tasks: T064, T065 - Automatic token expiration checking and refresh
 * 
 * Monitors installation token expiration and triggers automatic refresh
 * when token expires within 5 minutes.
 */

import { BrowserWindow } from 'electron';
import { getStoredSession, setStoredSession } from '../storage/auth-store';

const CHECK_INTERVAL_MS = process.env.NODE_ENV === 'development' ? 30 * 1000 : 5 * 60 * 1000; // 30 seconds in dev, 5 minutes in prod
const REFRESH_THRESHOLD_MS = process.env.NODE_ENV === 'development' ? 50 * 60 * 1000 : 5 * 60 * 1000; // 50 minutes in dev (most tokens), 5 minutes in prod
const BACKEND_URL = process.env.AUTH_WORKER_URL || 'http://localhost:8787';

let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Check if installation token is expired or expires soon.
 * 
 * @param expiresAt - Token expiration timestamp (ISO 8601)
 * @returns True if token expires within REFRESH_THRESHOLD_MS
 */
export function isTokenExpiringSoon(expiresAt: string): boolean {
  const expiresAtTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const timeUntilExpiry = expiresAtTime - now;
  
  return timeUntilExpiry <= REFRESH_THRESHOLD_MS;
}

/**
 * Refresh installation token before it expires.
 * T065: Automatic refresh trigger
 * 
 * @param installationId - Installation ID to refresh token for
 * @param userToken - Session token for authentication
 * @returns New token data or null if refresh failed
 */
async function refreshToken(installationId: number, userToken: string): Promise<{ token: string; expires_at: string } | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/refresh-installation-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': userToken,
      },
      body: JSON.stringify({ installation_id: installationId }),
    });

    if (!response.ok) {
      console.error('[TokenMonitor] Token refresh failed:', response.status);
      return null;
    }

    const tokenData = await response.json();
    console.log('[TokenMonitor] Token refreshed successfully');
    return tokenData;
  } catch (error) {
    console.error('[TokenMonitor] Token refresh error:', error);
    return null;
  }
}

/**
 * Check token expiration and refresh if needed.
 * T064: Token expiration checker
 * T065: Automatic refresh trigger
 */
async function checkAndRefreshToken(): Promise<void> {
  const session = getStoredSession();
  
  if (!session || !session.credentials) {
    // No session or no installation token - nothing to monitor
    return;
  }

  const { credentials } = session;
  
  // Check if token is expiring soon
  if (isTokenExpiringSoon(credentials.expires_at)) {
    console.log('[TokenMonitor] Token expires soon, refreshing...', {
      expiresAt: credentials.expires_at,
      currentInstallation: session.currentInstallation?.id,
    });

    // T065: Trigger automatic refresh
    const newToken = await refreshToken(
      session.currentInstallation!.id,
      session.sessionToken
    );

    if (newToken) {
      // Update session with new token
      session.credentials = {
        ...credentials,
        token: newToken.token,
        expires_at: newToken.expires_at,
      };
      
      setStoredSession(session);
      console.log('[TokenMonitor] Token updated in session storage');

      // Notify renderer process
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(win => {
        win.webContents.send('auth:token-refreshed');
      });
    } else {
      // T068: Refresh failed - emit session expired event
      console.error('[TokenMonitor] Token refresh failed, session may be expired');
      
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(win => {
        win.webContents.send('auth:session-expired', {
          reason: 'Token refresh failed during automatic monitoring'
        });
      });
    }
  }
}

/**
 * Start monitoring token expiration.
 * Checks every 5 minutes if token needs refresh.
 */
export function startTokenMonitor(): void {
  if (monitorInterval) {
    console.log('[TokenMonitor] Monitor already running');
    return;
  }

  console.log('[TokenMonitor] Starting token expiration monitor');
  
  // Check immediately on start
  checkAndRefreshToken();
  
  // Then check every 5 minutes
  monitorInterval = setInterval(checkAndRefreshToken, CHECK_INTERVAL_MS);
}

/**
 * Stop monitoring token expiration.
 */
export function stopTokenMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('[TokenMonitor] Token expiration monitor stopped');
  }
}

/**
 * Manually trigger token check (useful for testing or immediate check).
 */
export function checkTokenNow(): void {
  console.log('[TokenMonitor] Manual token check triggered');
  checkAndRefreshToken();
}
