/**
 * Connectivity Service
 * Feature: 002-github-app-auth
 * Task: T070c - Offline mode detection
 * 
 * Detects when backend is unreachable and enables read-only mode.
 */

import { BrowserWindow } from 'electron';
import { getBackendUrl } from '../config/environment';

const BACKEND_URL = getBackendUrl();
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds
const HEALTH_CHECK_TIMEOUT_MS = 5000; // 5 second timeout for health checks

let isOnline = true;
let checkInterval: NodeJS.Timeout | null = null;

/**
 * Check if backend is reachable.
 * 
 * @returns True if backend responds within timeout
 */
async function checkBackendConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    console.log(`[Connectivity] Performing backend health check to ${BACKEND_URL}/health...`);
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Network error, timeout, or backend unreachable
    return false;
  }
}

/**
 * Perform connectivity check and emit events if status changes.
 */
async function performConnectivityCheck(forceEmit = false): Promise<void> {
  const backendReachable = await checkBackendConnectivity();
  
  // Status changed - notify renderer
  if (backendReachable !== isOnline || forceEmit) {
    const statusChanged = backendReachable !== isOnline;
    isOnline = backendReachable;
    
    if (statusChanged || forceEmit) {
      const status = isOnline ? 'online' : 'offline';
      console.log(`[Connectivity] Backend status ${statusChanged ? 'changed' : 'initial'}: ${status}`);
      
      // Emit connectivity event to all windows
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(win => {
        win.webContents.send('connectivity:status-changed', {
          isOnline,
          timestamp: new Date().toISOString(),
        });
      });
    }
  }
}

/**
 * Start monitoring backend connectivity.
 */
export function startConnectivityMonitor(): void {
  if (checkInterval) {
    console.log('[Connectivity] Monitor already running');
    return;
  }

  console.log('[Connectivity] Starting connectivity monitor');
  
  // Check immediately on start and emit initial status
  performConnectivityCheck(true);
  
  // Then check periodically
  checkInterval = setInterval(performConnectivityCheck, CHECK_INTERVAL_MS);
}

/**
 * Stop monitoring backend connectivity.
 */
export function stopConnectivityMonitor(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('[Connectivity] Connectivity monitor stopped');
  }
}

/**
 * Get current connectivity status.
 * 
 * @returns True if backend is reachable
 */
export function isBackendOnline(): boolean {
  return isOnline;
}

/**
 * Manually trigger connectivity check.
 */
export async function checkConnectivityNow(): Promise<boolean> {
  console.log('[Connectivity] Manual connectivity check triggered');
  await performConnectivityCheck();
  return isOnline;
}

/**
 * Check if an error indicates backend is unreachable.
 * Useful for detecting offline mode from API call failures.
 * 
 * @param error - Error from fetch or API call
 * @returns True if error suggests backend is offline
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // Common network error patterns
  const networkErrorPatterns = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'NetworkError',
    'Failed to fetch',
    'Network request failed',
  ];
  
  const errorMessage = error.message || error.toString();
  return networkErrorPatterns.some(pattern => 
    errorMessage.includes(pattern)
  );
}
