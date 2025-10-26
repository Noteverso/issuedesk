import Store from 'electron-store';
import { AppSettings, RepositoryConfig, ThemeMode, EditorMode, ViewPreferences } from '@issuedesk/shared';

interface SettingsStore {
  activeRepositoryId: string | null;
  repositories: RepositoryConfig[];
  theme: ThemeMode;
  editorMode: EditorMode;
  viewPreferences: ViewPreferences;
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
  },
});

/**
 * Settings manager using electron-store
 * Persists user preferences and repository configurations
 */
export class SettingsManager {
  /**
   * Get all settings
   */
  getAll(): AppSettings {
    return {
      activeRepositoryId: store.get('activeRepositoryId'),
      repositories: store.get('repositories'),
      theme: store.get('theme'),
      editorMode: store.get('editorMode'),
      viewPreferences: store.get('viewPreferences'),
      rateLimit: null, // Runtime state, not persisted
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
  setActiveRepository(id: string): void {
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
}

// Singleton instance
let instance: SettingsManager | null = null;

export function getSettingsManager(): SettingsManager {
  if (!instance) {
    instance = new SettingsManager();
  }
  return instance;
}
