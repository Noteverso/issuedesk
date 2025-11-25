/**
 * Token Cache Service
 * Feature: 002-github-app-auth
 * 
 * Manages multi-installation token caching for instant switching (FR-013a/b).
 * Caches tokens for all authorized installations to enable 0ms switching delay.
 */

import type { InstallationToken } from '@issuedesk/shared';

export interface CachedToken {
  installationId: number;
  token: string;
  expiresAt: string;
  permissions: Record<string, string>;
  repositorySelection: 'all' | 'selected';
}

/**
 * TokenCache manages installation tokens in memory for fast access.
 * Tokens are also persisted to encrypted electron-store for persistence across app restarts.
 */
export class TokenCache {
  private cache: Map<number, CachedToken> = new Map();

  /**
   * Get cached token for an installation.
   * Returns null if token is not cached or expired.
   * 
   * @param installationId - Installation ID to get token for
   * @returns Cached token or null
   */
  getToken(installationId: number): InstallationToken | null {
    const cached = this.cache.get(installationId);
    
    if (!cached) {
      return null;
    }

    // Check if token is expired
    const expiresAt = new Date(cached.expiresAt);
    const now = new Date();
    
    if (expiresAt <= now) {
      // Token expired, remove from cache
      this.cache.delete(installationId);
      return null;
    }

    return {
      token: cached.token,
      expires_at: cached.expiresAt,
      permissions: cached.permissions,
      repository_selection: cached.repositorySelection,
    };
  }

  /**
   * Put token in cache for an installation.
   * Overwrites any existing token for this installation.
   * 
   * @param installationId - Installation ID
   * @param installationToken - Complete installation token object
   */
  putToken(installationId: number, installationToken: InstallationToken): void {
    this.cache.set(installationId, {
      installationId,
      token: installationToken.token,
      expiresAt: installationToken.expires_at,
      permissions: installationToken.permissions,
      repositorySelection: installationToken.repository_selection,
    });
  }

  /**
   * Check if cache has a valid token for an installation.
   * 
   * @param installationId - Installation ID to check
   * @returns True if valid token exists
   */
  hasToken(installationId: number): boolean {
    return this.getToken(installationId) !== null;
  }

  /**
   * Evict expired tokens from cache.
   * Called periodically to clean up expired entries.
   */
  evictExpired(): void {
    const now = new Date();
    
    for (const [installationId, cached] of this.cache.entries()) {
      const expiresAt = new Date(cached.expiresAt);
      if (expiresAt <= now) {
        this.cache.delete(installationId);
      }
    }
  }

  /**
   * Clear all tokens from cache.
   * Called on logout.
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get all cached installation IDs.
   * Useful for debugging and stats.
   * 
   * @returns Array of installation IDs
   */
  getCachedInstallationIds(): number[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size (number of cached tokens).
   * 
   * @returns Number of cached tokens
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Export cache to JSON for persistence.
   * Used to save cache to electron-store.
   * 
   * @returns JSON-serializable cache data
   */
  toJSON(): CachedToken[] {
    return Array.from(this.cache.values());
  }

  /**
   * Import cache from JSON.
   * Used to restore cache from electron-store on app startup.
   * 
   * @param data - JSON cache data
   */
  fromJSON(data: CachedToken[]): void {
    this.cache.clear();
    
    for (const cached of data) {
      // Only restore non-expired tokens
      const expiresAt = new Date(cached.expiresAt);
      const now = new Date();
      
      if (expiresAt > now) {
        this.cache.set(cached.installationId, cached);
      }
    }
  }
}

// Singleton instance for app-wide use
let instance: TokenCache | null = null;

/**
 * Get the global TokenCache instance.
 * Creates instance on first call.
 */
export function getTokenCache(): TokenCache {
  if (!instance) {
    instance = new TokenCache();
  }
  return instance;
}

/**
 * Reset the global TokenCache instance.
 * Used for testing.
 */
export function resetTokenCache(): void {
  instance = null;
}
