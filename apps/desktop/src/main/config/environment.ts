/**
 * Environment configuration for IssueDesk Desktop
 * Handles backend URL and environment-specific settings
 */

/**
 * Get the authentication worker backend URL.
 * Priority:
 * 1. AUTH_WORKER_URL environment variable (if set) - overrides all
 * 2. PROD_AUTH_WORKER_URL (if in production mode)
 * 3. Development localhost (if in development mode)
 * 4. Fallback production URL
 * 
 * Note: Uses process.env since this runs in Electron main process (Node.js context)
 */
export function getBackendUrl(): string {
  // Priority 1: Explicit AUTH_WORKER_URL override (works in both dev and prod)
  const envUrl = process.env.AUTH_WORKER_URL;
  if (envUrl) {
    console.log('[Environment] Using AUTH_WORKER_URL:', envUrl);
    return envUrl;
  }

  // Determine if we're in development
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';

  if (isDev) {
    // Priority 2: Development - use local Cloudflare Worker
    const devUrl = 'http://localhost:8787';
    console.log('[Environment] Using development URL:', devUrl);
    return devUrl;
  } else {
    // Priority 3: Production - use PROD_AUTH_WORKER_URL or fallback
    const prodUrl = process.env.PROD_AUTH_WORKER_URL || 'https://youname.workers.dev';
    console.log('[Environment] Using production URL:', prodUrl);
    return prodUrl;
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return !isDevelopment();
}

/**
 * Get environment name
 */
export function getEnvironment(): 'development' | 'production' {
  return isDevelopment() ? 'development' : 'production';
}
