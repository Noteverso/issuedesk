/**
 * Secure storage service wrapper for expo-secure-store
 * Handles encrypted storage of sensitive data (tokens, sessions)
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { UserSession, AccessToken, AppPreferences, SelectedRepository } from '../types';

// Secure storage keys (encrypted)
const SECURE_KEYS = {
  USER_SESSION: 'issuedesk_user_session',
  ACCESS_TOKEN: 'issuedesk_access_token',
} as const;

// AsyncStorage keys (preferences, non-sensitive)
const ASYNC_KEYS = {
  APP_PREFERENCES: 'issuedesk_preferences',
  SELECTED_REPOSITORY: 'issuedesk_selected_repo',
} as const;

/**
 * Web-compatible secure storage wrapper
 */
const isWeb = Platform.OS === 'web';

const secureStoreWrapper = {
  async setItemAsync(key: string, value: string): Promise<void> {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItemAsync(key: string): Promise<string | null> {
    if (isWeb) {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async deleteItemAsync(key: string): Promise<void> {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

/**
 * Secure storage for sensitive data (expo-secure-store)
 */
export const secureStorage = {
  /**
   * Save user session to secure storage
   */
  async saveSession(session: UserSession): Promise<void> {
    await secureStoreWrapper.setItemAsync(
      SECURE_KEYS.USER_SESSION,
      JSON.stringify(session)
    );
  },

  /**
   * Get user session from secure storage
   */
  async getSession(): Promise<UserSession | null> {
    const data = await secureStoreWrapper.getItemAsync(SECURE_KEYS.USER_SESSION);
    if (!data) return null;
    try {
      return JSON.parse(data) as UserSession;
    } catch {
      return null;
    }
  },

  /**
   * Clear user session from secure storage
   */
  async clearSession(): Promise<void> {
    await secureStoreWrapper.deleteItemAsync(SECURE_KEYS.USER_SESSION);
  },

  /**
   * Save access token to secure storage
   */
  async saveAccessToken(token: AccessToken): Promise<void> {
    await secureStoreWrapper.setItemAsync(
      SECURE_KEYS.ACCESS_TOKEN,
      JSON.stringify(token)
    );
  },

  /**
   * Get access token from secure storage
   */
  async getAccessToken(): Promise<AccessToken | null> {
    const data = await secureStoreWrapper.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    if (!data) return null;
    try {
      return JSON.parse(data) as AccessToken;
    } catch {
      return null;
    }
  },

  /**
   * Clear access token from secure storage
   */
  async clearAccessToken(): Promise<void> {
    await secureStoreWrapper.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Clear all secure storage data (logout)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      secureStoreWrapper.deleteItemAsync(SECURE_KEYS.USER_SESSION),
      secureStoreWrapper.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
    ]);
  },
};

/**
 * AsyncStorage for preferences (non-sensitive)
 */
export const preferenceStorage = {
  /**
   * Get app preferences
   */
  async getPreferences(): Promise<AppPreferences> {
    const data = await AsyncStorage.getItem(ASYNC_KEYS.APP_PREFERENCES);
    if (!data) {
      return {
        themeMode: 'system',
        selectedRepositoryId: null,
      };
    }
    try {
      return JSON.parse(data) as AppPreferences;
    } catch {
      return {
        themeMode: 'system',
        selectedRepositoryId: null,
      };
    }
  },

  /**
   * Save app preferences
   */
  async savePreferences(preferences: Partial<AppPreferences>): Promise<void> {
    const current = await this.getPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(
      ASYNC_KEYS.APP_PREFERENCES,
      JSON.stringify(updated)
    );
  },

  /**
   * Get selected repository
   */
  async getSelectedRepository(): Promise<SelectedRepository | null> {
    const data = await AsyncStorage.getItem(ASYNC_KEYS.SELECTED_REPOSITORY);
    if (!data) return null;
    try {
      return JSON.parse(data) as SelectedRepository;
    } catch {
      return null;
    }
  },

  /**
   * Save selected repository
   */
  async saveSelectedRepository(repo: SelectedRepository): Promise<void> {
    await AsyncStorage.setItem(
      ASYNC_KEYS.SELECTED_REPOSITORY,
      JSON.stringify(repo)
    );
  },

  /**
   * Clear selected repository
   */
  async clearSelectedRepository(): Promise<void> {
    await AsyncStorage.removeItem(ASYNC_KEYS.SELECTED_REPOSITORY);
  },

  /**
   * Clear all preferences (but keep them distinct from secure data)
   */
  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(ASYNC_KEYS.APP_PREFERENCES),
      AsyncStorage.removeItem(ASYNC_KEYS.SELECTED_REPOSITORY),
    ]);
  },
};

/**
 * Clear all app data (full logout)
 */
export async function clearAllStorage(): Promise<void> {
  await Promise.all([
    secureStorage.clearAll(),
    preferenceStorage.clearAll(),
  ]);
}
