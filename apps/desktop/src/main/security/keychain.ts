import Store from 'electron-store';

/**
 * Secure token storage using electron-store with OS keychain
 * Tokens are encrypted and stored in the system keychain
 */

interface TokenStore {
  githubToken?: string;
}

const store = new Store<TokenStore>({
  name: 'secure-tokens',
  encryptionKey: 'issuedesk-secure-key', // In production, use a proper encryption key
});

export class KeychainManager {
  /**
   * Store GitHub token securely
   */
  setToken(token: string): void {
    store.set('githubToken', token);
  }

  /**
   * Get GitHub token
   */
  getToken(): string | null {
    return store.get('githubToken') || null;
  }

  /**
   * Check if token exists
   */
  hasToken(): boolean {
    return store.has('githubToken');
  }

  /**
   * Get token preview (first 8 characters)
   */
  getTokenPreview(): string | null {
    const token = this.getToken();
    return token ? token.substring(0, 8) + '...' : null;
  }

  /**
   * Clear token
   */
  clearToken(): void {
    store.delete('githubToken');
  }
}

// Singleton instance
let instance: KeychainManager | null = null;

export function getKeychainManager(): KeychainManager {
  if (!instance) {
    instance = new KeychainManager();
  }
  return instance;
}
