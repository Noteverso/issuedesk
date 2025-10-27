import { contextBridge, ipcRenderer } from 'electron';

// Debug log to confirm preload script is loaded
console.log('🔧 Preload script loaded successfully');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // New namespaced API (matches IpcApi interface)
  issues: {
    list: (params: any) => ipcRenderer.invoke('issues:list', params),
    get: (params: any) => ipcRenderer.invoke('issues:get', params),
    create: (params: any) => ipcRenderer.invoke('issues:create', params),
    update: (params: any) => ipcRenderer.invoke('issues:update', params),
    delete: (params: any) => ipcRenderer.invoke('issues:delete', params),
  },

  labels: {
    list: (params: any) => ipcRenderer.invoke('labels:list', params),
    get: (params: any) => ipcRenderer.invoke('labels:get', params),
    create: (params: any) => ipcRenderer.invoke('labels:create', params),
    update: (params: any) => ipcRenderer.invoke('labels:update', params),
    delete: (params: any) => ipcRenderer.invoke('labels:delete', params),
  },

  sync: {
    start: () => ipcRenderer.invoke('sync:start'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
    resolveConflict: (params: any) => ipcRenderer.invoke('sync:resolveConflict', params),
  },

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (params: any) => ipcRenderer.invoke('settings:update', params),
    setRepository: (params: any) => ipcRenderer.invoke('settings:setRepository', params),
    switchRepository: (params: any) => ipcRenderer.invoke('settings:switchRepository', params),
    getToken: () => ipcRenderer.invoke('settings:getToken'),
    setToken: (params: any) => ipcRenderer.invoke('settings:setToken', params),
    testConnection: (token: string) => ipcRenderer.invoke('settings:testConnection', token),
    getUser: (token: string) => ipcRenderer.invoke('settings:getUser', token),
    getRepositories: (token: string) => ipcRenderer.invoke('settings:getRepositories', token),
    getLabels: (token: string, owner: string, repo: string) => ipcRenderer.invoke('settings:getLabels', token, owner, repo),
    createLabel: (token: string, owner: string, repo: string, label: any) => ipcRenderer.invoke('settings:createLabel', token, owner, repo, label),
    updateLabel: (token: string, owner: string, repo: string, name: string, label: any) => ipcRenderer.invoke('settings:updateLabel', token, owner, repo, name, label),
    deleteLabel: (token: string, owner: string, repo: string, name: string) => ipcRenderer.invoke('settings:deleteLabel', token, owner, repo, name),
  },

  analytics: {
    getMetrics: (params: any) => ipcRenderer.invoke('analytics:getMetrics', params),
  },

  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    checkForUpdates: () => ipcRenderer.invoke('system:checkForUpdates'),
  },

  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: any, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
});

// Debug log to confirm electronAPI is exposed
console.log('🔧 electronAPI exposed to window object');

