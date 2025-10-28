import { contextBridge, ipcRenderer } from 'electron';
import { IpcApi } from '@issuedesk/shared';

// Debug log to confirm preload script is loaded
console.log('🔧 Preload script loaded successfully');

// Type-safe API implementation matching IpcApi interface
const api: IpcApi = {
  // Issues API
  issues: {
    list: (req) => ipcRenderer.invoke('issues:list', req),
    get: (req) => ipcRenderer.invoke('issues:get', req),
    create: (req) => ipcRenderer.invoke('issues:create', req),
    update: (req) => ipcRenderer.invoke('issues:update', req),
    delete: (req) => ipcRenderer.invoke('issues:delete', req),
  },

  // Labels API
  labels: {
    list: () => ipcRenderer.invoke('labels:list'),
    create: (req) => ipcRenderer.invoke('labels:create', req),
    update: (req) => ipcRenderer.invoke('labels:update', req),
    delete: (req) => ipcRenderer.invoke('labels:delete', req),
  },

  // Sync API
  sync: {
    start: () => ipcRenderer.invoke('sync:start'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    resolveConflict: (req) => ipcRenderer.invoke('sync:resolveConflict', req),
  },

  // Settings API
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (req) => ipcRenderer.invoke('settings:update', req),
    setRepository: (req) => ipcRenderer.invoke('settings:setRepository', req),
    switchRepository: (req) => ipcRenderer.invoke('settings:switchRepository', req),
    getToken: () => ipcRenderer.invoke('settings:getToken'),
    setToken: (req) => ipcRenderer.invoke('settings:setToken', req),
    testConnection: (token) => ipcRenderer.invoke('settings:testConnection', token),
    getUser: (token) => ipcRenderer.invoke('settings:getUser', token),
    getRepositories: (token) => ipcRenderer.invoke('settings:getRepositories', token),
  },

  // Analytics API
  analytics: {
    getDashboard: () => ipcRenderer.invoke('analytics:getDashboard'),
  },

  // System API
  system: {
    openExternal: (req) => ipcRenderer.invoke('system:openExternal', req),
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    checkForUpdates: () => ipcRenderer.invoke('system:checkForUpdates'),
  },

  // Event listeners
  on: (channel, callback) => {
    const validChannels = ['sync:progress', 'sync:conflict', 'rate-limit:warning', 'token:invalid'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, data) => callback(data));
    }
  },
};

// Expose API to renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', api);

