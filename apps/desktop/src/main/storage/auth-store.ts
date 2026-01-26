/**
 * Electron-store configuration for encrypted auth storage
 * Feature: 002-github-app-auth
 * 
 * Stores user session data with platform-specific encryption using Electron safeStorage API.
 */

import Store from 'electron-store';
import { safeStorage } from 'electron';
import { UserSessionSchema } from '@issuedesk/shared';
import type { UserSession } from '@issuedesk/shared';

/**
 * Auth store schema for validation
 */
interface AuthStoreSchema {
  session: string | null; // Store as encrypted base64 string
}

/**
 * Store for auth data.
 * T037: Uses Electron safeStorage API for machine-level encryption (FR-014, FR-033)
 * 
 * Security features:
 * - Platform-specific encryption (Windows DPAPI, macOS Keychain, Linux Secret Service)
 * - Encryption key managed by OS (not in source code)
 * - Data encrypted at rest using OS key management
 * - Schema validation on read/write
 * 
 * Implementation:
 * - Session data is JSON stringified, encrypted with safeStorage, and stored as base64
 * - Decryption happens on read using OS-managed keys
 */
export const authStore = new Store<AuthStoreSchema>({
  name: 'auth',
  // T037: No hardcoded encryption key - using safeStorage instead
  schema: {
    session: {
      type: ['string', 'null'],
      default: null,
    },
  },
  clearInvalidConfig: false,
});

/**
 * Encrypt data using Electron safeStorage API.
 * 
 * @param data - Plain text data to encrypt
 * @returns Base64-encoded encrypted data
 */
function encryptData(data: string): string {
  const buffer = safeStorage.encryptString(data);
  return buffer.toString('base64');
}

/**
 * Decrypt data using Electron safeStorage API.
 * 
 * @param encryptedData - Base64-encoded encrypted data
 * @returns Decrypted plain text
 */
function decryptData(encryptedData: string): string {
  const buffer = Buffer.from(encryptedData, 'base64');
  return safeStorage.decryptString(buffer);
}

/**
 * T037: Verify encryption is available on this platform.
 * Should be called during app initialization.
 * 
 * @returns true if encryption is available, false otherwise
 */
export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

/**
 * T037: Get encryption status information.
 * Useful for debugging and security audits.
 * 
 * @returns Encryption status details including platform-specific information
 */
export function getEncryptionStatus(): {
  enabled: boolean;
  storeLocation: string;
  isAvailable: boolean;
  platform: string;
  securityProvider: string;
} {
  const platform = process.platform;
  let securityProvider = 'Unknown';
  
  if (platform === 'darwin') {
    securityProvider = 'macOS Keychain';
  } else if (platform === 'win32') {
    securityProvider = 'Windows DPAPI';
  } else if (platform === 'linux') {
    securityProvider = 'Linux Secret Service';
  }
  
  return {
    enabled: true,
    storeLocation: authStore.path,
    isAvailable: isEncryptionAvailable(),
    platform,
    securityProvider,
  };
}

/**
 * Get current session from encrypted storage.
 * Decrypts using Electron safeStorage and validates structure using Zod schema.
 * 
 * @returns UserSession or null if no session exists
 */
export function getStoredSession(): UserSession | null {
  try {
    const encryptedSession = authStore.get('session', null);
    
    if (!encryptedSession) {
      return null;
    }

    // Decrypt session data
    const decryptedJson = decryptData(encryptedSession);
    const sessionData = JSON.parse(decryptedJson);

    // Validate session structure
    const result = UserSessionSchema.safeParse(sessionData);
    if (!result.success) {
      console.error('[AuthStore] Invalid session format:', result.error);
      // Clear invalid session
      authStore.delete('session');
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('[AuthStore] Error reading session:', error);
    return null;
  }
}

/**
 * Store session in encrypted storage.
 * Validates session, encrypts using Electron safeStorage, and stores as base64.
 * 
 * @param session - UserSession to store
 */
export function setStoredSession(session: UserSession): void {
  try {
    // Validate session before storing
    const result = UserSessionSchema.safeParse(session);
    if (!result.success) {
      throw new Error(`Invalid session format: ${result.error.message}`);
    }

    // Encrypt session data
    const jsonString = JSON.stringify(result.data);
    const encryptedData = encryptData(jsonString);
    
    authStore.set('session', encryptedData);
  } catch (error) {
    console.error('[AuthStore] Error storing session:', error);
    throw error;
  }
}

/**
 * Clear session from encrypted storage (logout).
 */
export function clearStoredSession(): void {
  try {
    authStore.delete('session');
  } catch (error) {
    console.error('[AuthStore] Error clearing session:', error);
    throw error;
  }
}

/**
 * Check if token is expired.
 * 
 * @param expiresAt - ISO 8601 expiration timestamp
 * @returns True if token is expired or will expire within 5 minutes
 */
export function isTokenExpired(expiresAt: string): boolean {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const fiveMinutes = 5 * 60 * 1000;
  
  return (expiry - now) < fiveMinutes;
}

/**
 * Update installation token in current session.
 * 
 * @param token - New installation token
 * @param expiresAt - Token expiration time
 */
export function updateInstallationToken(token: string, expiresAt: string): void {
  const session = getStoredSession();
  if (!session || !session.currentInstallation) {
    throw new Error('No active session or installation');
  }

  session.credentials = {
    token: token,
    expires_at: expiresAt,
    permissions: session.currentInstallation.permissions,
    repository_selection: session.currentInstallation.repository_selection,
  };

  setStoredSession(session);
}

// T037: Log encryption status on module load (security audit)
const encryptionStatus = getEncryptionStatus();
console.log('[AuthStore] Encryption status:', encryptionStatus);
if (!encryptionStatus.isAvailable) {
  console.warn('[AuthStore] WARNING: Encryption may not be available on this platform!');
}
