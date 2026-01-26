import Store from 'electron-store';
import { safeStorage } from 'electron';
import { AppSettings, RepositoryConfig, ThemeMode, EditorMode, ViewPreferences } from '@issuedesk/shared';

interface SettingsStore {
  activeRepositoryId: string | null;
  repositories: RepositoryConfig[];
  theme: ThemeMode;
  editorMode: EditorMode;
  viewPreferences: ViewPreferences;
  r2ConfigEncrypted: string | null; // Encrypted base64 string
}

const store = new Store<SettingsStore>({
  name: 'app-settings',
  defaults: {
    activeRepositoryId: null,
    repositories: [],
    theme: 'light',
    editorMode: 'preview',
    viewPreferences: {
      issues: 'list',
      labels: 'list',
    },
    r2ConfigEncrypted: null,
  },
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
 * Settings manager using electron-store
 * Persists user preferences and repository configurations
 */
export class SettingsManager {
  /**
   * Get all settings
   */
  getAll(): AppSettings {
    // Decrypt R2 config if it exists
    let r2Config: AppSettings['r2Config'] = null;
    const encryptedR2 = store.get('r2ConfigEncrypted');
    
    if (encryptedR2) {
      try {
        const decryptedJson = decryptData(encryptedR2);
        r2Config = JSON.parse(decryptedJson);
      } catch (error) {
        console.error('[SettingsManager] Failed to decrypt R2 config:', error);
        // Clear invalid encrypted data
        store.set('r2ConfigEncrypted', null);
      }
    }
    
    return {
      activeRepositoryId: store.get('activeRepositoryId'),
      repositories: store.get('repositories'),
      theme: store.get('theme'),
      editorMode: store.get('editorMode'),
      viewPreferences: store.get('viewPreferences'),
      rateLimit: null, // Runtime state, not persisted
      r2Config,
    };
  }

  /**
   * Update theme
   */
  setTheme(theme: ThemeMode): void {
    store.set('theme', theme);
  }

  /**
   * Update editor mode
   */
  setEditorMode(mode: EditorMode): void {
    store.set('editorMode', mode);
  }

  /**
   * Update view preferences
   */
  setViewPreferences(prefs: Partial<ViewPreferences>): void {
    const current = store.get('viewPreferences');
    store.set('viewPreferences', { ...current, ...prefs });
  }

  /**
   * Add or update a repository configuration
   */
  setRepository(config: RepositoryConfig): void {
    const repos = store.get('repositories');
    const existing = repos.findIndex((r) => r.id === config.id);

    if (existing >= 0) {
      repos[existing] = config;
    } else {
      repos.push(config);
    }

    store.set('repositories', repos);

    // Set as active if it's the only one
    if (repos.length === 1) {
      store.set('activeRepositoryId', config.id);
    }
  }

  /**
   * Get active repository ID
   */
  getActiveRepositoryId(): string | null {
    return store.get('activeRepositoryId');
  }

  /**
   * Set active repository
   */
  setActiveRepository(id: string | null): void {
    if (id === null) {
      store.set('activeRepositoryId', null);
      return;
    }

    const repos = store.get('repositories');
    const exists = repos.some((r) => r.id === id);

    if (exists) {
      store.set('activeRepositoryId', id);
    } else {
      throw new Error(`Repository ${id} not found`);
    }
  }

  /**
   * Get all repositories
   */
  getRepositories(): RepositoryConfig[] {
    return store.get('repositories');
  }

  /**
   * Get a specific repository
   */
  getRepository(id: string): RepositoryConfig | null {
    const repos = store.get('repositories');
    return repos.find((r) => r.id === id) || null;
  }

  /**
   * Remove a repository
   */
  removeRepository(id: string): void {
    const repos = store.get('repositories').filter((r) => r.id !== id);
    store.set('repositories', repos);

    // Clear active if it was this one
    if (store.get('activeRepositoryId') === id) {
      store.set('activeRepositoryId', repos.length > 0 ? repos[0].id : null);
    }
  }

  /**
   * Set R2 configuration (encrypted with OS-managed keys)
   */
  setR2Config(config: AppSettings['r2Config']): void {
    if (config === null) {
      store.set('r2ConfigEncrypted', null);
      return;
    }
    
    try {
      const jsonString = JSON.stringify(config);
      const encryptedData = encryptData(jsonString);
      store.set('r2ConfigEncrypted', encryptedData);
    } catch (error) {
      console.error('[SettingsManager] Failed to encrypt R2 config:', error);
      throw error;
    }
  }

  /**
   * Get R2 configuration (decrypted)
   */
  getR2Config(): AppSettings['r2Config'] {
    const encryptedR2 = store.get('r2ConfigEncrypted');
    
    if (!encryptedR2) {
      return null;
    }
    
    try {
      const decryptedJson = decryptData(encryptedR2);
      return JSON.parse(decryptedJson);
    } catch (error) {
      console.error('[SettingsManager] Failed to decrypt R2 config:', error);
      // Clear invalid encrypted data
      store.set('r2ConfigEncrypted', null);
      return null;
    }
  }

  /**
   * clear all settings (when logout)
   */
  clearAll(): void {
    store.clear();
  }
}

// Singleton instance
let instance: SettingsManager | null = null;

export function getSettingsManager(): SettingsManager {
  if (!instance) {
    instance = new SettingsManager();
  }
  return instance;
}
