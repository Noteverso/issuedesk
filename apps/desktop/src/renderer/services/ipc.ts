/**
 * IPC Client - Type-safe wrapper for renderer-to-main communication
 * 
 * This utility provides a convenient API for accessing IPC methods
 * exposed via the preload script, with proper error handling and
 * TypeScript type safety.
 * 
 * NOTE: This is a temporary adapter that wraps the old flat API
 * into the new namespaced structure until IPC handlers are fully implemented.
 */

import {
  IssueListRequest,
  IssueListResult,
  IssueGetRequest,
  IssueCreateRequest,
  IssueUpdateRequest,
  IssueDeleteRequest,
} from '@issuedesk/shared';

/**
 * Check if the Electron API is available
 */
function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}

/**
 * Temporary mock implementation until IPC handlers are ready
 * Returns empty/default values to prevent crashes
 */
const mockIssuesApi = {
  list: async (req: IssueListRequest): Promise<IssueListResult> => {
    console.warn('IPC not available: issues.list called with mock data');
    return {
      issues: [],
      totalCount: 0,
      page: req.page || 1,
      perPage: req.perPage || 50,
      hasMore: false,
    };
  },
  
  get: async (req: IssueGetRequest): Promise<{ issue: null }> => {
    console.warn('IPC not available: issues.get called');
    return { issue: null };
  },
  
  create: async (req: IssueCreateRequest): Promise<{ issue: any }> => {
    console.warn('IPC not available: issues.create called');
    throw new Error('Cannot create issue: IPC not available');
  },
  
  update: async (req: IssueUpdateRequest): Promise<{ issue: any }> => {
    console.warn('IPC not available: issues.update called');
    throw new Error('Cannot update issue: IPC not available');
  },
  
  delete: async (req: IssueDeleteRequest): Promise<{ success: boolean }> => {
    console.warn('IPC not available: issues.delete called');
    return { success: false };
  },
};

/**
 * Type-safe IPC client
 * Provides namespaced API that calls the actual Electron IPC handlers
 */
export const ipcClient = {
  get issues() {
    if (!isElectronAvailable()) {
      console.warn('Electron not available, using mock issues API');
      return mockIssuesApi;
    }
    
    // Use the real IPC API exposed by preload (window.electronAPI)
    return (window as any).electronAPI.issues;
  },
  
  get labels() {
    if (!isElectronAvailable()) {
      return {
        list: async () => ({ labels: [], totalCount: 0 }),
        get: async () => { throw new Error('Not implemented'); },
        create: async () => { throw new Error('Not implemented'); },
        update: async () => { throw new Error('Not implemented'); },
        delete: async () => ({ success: false }),
      };
    }
    return (window as any).electronAPI.labels;
  },
  
  get sync() {
    if (!isElectronAvailable()) {
      return {
        start: async () => ({ syncId: 'mock' }),
        getStatus: async () => ({
          status: 'idle' as const,
          lastSyncAt: null,
          conflicts: [],
        }),
        resolveConflict: async () => ({ success: false }),
      };
    }
    return (window as any).electronAPI.sync;
  },
  
  get settings() {
    if (!isElectronAvailable()) {
      return {
        get: async () => ({
          settings: {
            activeRepositoryId: null,
            repositories: [],
            theme: 'light' as const,
            editorMode: 'preview' as const,
            viewPreferences: {
              issuesView: 'list' as const,
              issuesPerPage: 50,
              defaultFilter: {},
            },
            rateLimit: null,
          },
        }),
        update: async (req: any) => ({
          settings: {
            activeRepositoryId: null,
            repositories: [],
            theme: req.theme || 'light' as const,
            editorMode: req.editorMode || 'preview' as const,
            viewPreferences: req.viewPreferences || {
              issuesView: 'list' as const,
              issuesPerPage: 50,
              defaultFilter: {},
            },
            rateLimit: null,
          },
        }),
        setRepository: async () => ({ success: true }),
        switchRepository: async () => ({ success: true }),
        getToken: async () => ({ token: null }),
        setToken: async () => ({ success: true }),
      };
    }
    return (window as any).electronAPI.settings;
  },
  
  get analytics() {
    if (!isElectronAvailable()) {
      return {
        getMetrics: async () => ({
          totalIssues: 0,
          openIssues: 0,
          closedIssues: 0,
          issuesByLabel: [],
          issuesOverTime: [],
        }),
      };
    }
    return (window as any).electronAPI.analytics;
  },
  
  get system() {
    if (!isElectronAvailable()) {
      return {
        getInfo: async () => ({
          version: '0.0.1',
          platform: 'unknown',
          electron: 'unknown',
        }),
        checkForUpdates: async () => ({
          available: false,
          currentVersion: '0.0.1',
        }),
      };
    }
    return (window as any).electronAPI.system;
  },
  
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (!isElectronAvailable()) {
      console.warn(`Event listener not implemented: ${channel}`);
      return () => {};
    }
    return (window as any).electronAPI.on(channel, callback);
  },
};

export { isElectronAvailable };
export default ipcClient;
