/**
 * Environment configuration for IssueDesk Desktop
 * Handles backend URL and environment-specific settings
 */

/**
 * Get the authentication worker backend URL.
 * Priority:
 * 1. AUTH_WORKER_URL environment variable (if set)
 * 2. Production default (if not in development)
 * 3. Development localhost
 */
export function getBackendUrl(): string {
  // Check environment variable first
  const envUrl = process.env.AUTH_WORKER_URL;
  if (envUrl) {
    return envUrl;
  }

  // Determine if we're in development
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV === '1';

  if (isDev) {
    // Development: use local Cloudflare Worker
    return 'http://localhost:8787';
  } else {
    // Production: use deployed Cloudflare Worker
    // TODO: Replace with your actual deployed worker URL
    return process.env.PROD_AUTH_WORKER_URL || 'https://your-production-worker.example.com';
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
