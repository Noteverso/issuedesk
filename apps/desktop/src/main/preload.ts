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

  // Comments API
  comments: {
    list: (req) => ipcRenderer.invoke('comments:list', req),
    get: (req) => ipcRenderer.invoke('comments:get', req),
    create: (req) => ipcRenderer.invoke('comments:create', req),
    update: (req) => ipcRenderer.invoke('comments:update', req),
    delete: (req) => ipcRenderer.invoke('comments:delete', req),
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
    setR2Config: (req) => ipcRenderer.invoke('settings:setR2Config', req),
    getR2Config: () => ipcRenderer.invoke('settings:getR2Config'),
    testR2Connection: () => ipcRenderer.invoke('settings:testR2Connection'),
    uploadToR2: (req) => ipcRenderer.invoke('settings:uploadToR2', req),
  },

  // Analytics API
  analytics: {
    getDashboard: () => ipcRenderer.invoke('analytics:getDashboard'),
  },

  // Auth API (Feature: 002-github-app-auth)
  auth: {
    githubLogin: () => ipcRenderer.invoke('auth:github-login'),
    getSession: () => ipcRenderer.invoke('auth:get-session'),
    selectInstallation: (req) => ipcRenderer.invoke('auth:select-installation', req),
    checkInstallations: () => ipcRenderer.invoke('auth:check-installations'),
    refreshInstallationToken: (req) => ipcRenderer.invoke('auth:refresh-installation-token', req),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },

  // System API
  system: {
    openExternal: (req) => ipcRenderer.invoke('system:openExternal', req),
    getVersion: () => ipcRenderer.invoke('system:getVersion'),
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    checkForUpdates: () => ipcRenderer.invoke('system:checkForUpdates'),
    zoomIn: () => ipcRenderer.invoke('system:zoomIn'),
    zoomOut: () => ipcRenderer.invoke('system:zoomOut'),
    resetZoom: () => ipcRenderer.invoke('system:resetZoom'),
    getZoomLevel: () => ipcRenderer.invoke('system:getZoomLevel'),
    setWindowTitle: (title) => ipcRenderer.invoke('system:setWindowTitle', title),
    selectImage: () => ipcRenderer.invoke('system:selectImage'),
    imageToDataUrl: (req) => ipcRenderer.invoke('system:imageToDataUrl', req),
  },

  // Event listeners
  on: (channel, callback) => {
    const validChannels = [
      'sync:progress', 
      'sync:conflict', 
      'rate-limit:warning', 
      'token:invalid',
      'auth:user-code',
      'auth:login-success',
      'auth:login-error',
      'auth:token-refreshed',
      'auth:session-expired'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, data) => callback(data));
    }
  },
};

// Expose API to renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', api);

