import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig, Repository, Issue, Label, CreateIssue, UpdateIssue, CreateLabel, UpdateLabel, ApiResponse } from '@issuedesk/shared';

// Debug log to confirm preload script is loaded
console.log('🔧 Preload script loaded successfully');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Config management
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('get-config'),
  setConfig: (config: Partial<AppConfig>): Promise<AppConfig> => ipcRenderer.invoke('set-config', config),

  // GitHub connection
  testGitHubConnection: (token: string): Promise<ApiResponse<boolean>> => 
    ipcRenderer.invoke('test-github-connection', token),
  getGitHubUser: (token: string): Promise<ApiResponse<any>> => 
    ipcRenderer.invoke('get-github-user', token),

  // Repository management
  getRepositories: (token: string): Promise<ApiResponse<Repository[]>> => 
    ipcRenderer.invoke('get-repositories', token),

  // Issue management
  getIssues: (token: string, owner: string, repo: string, options?: any): Promise<ApiResponse<Issue[]>> => 
    ipcRenderer.invoke('get-issues', token, owner, repo, options),
  createIssue: (token: string, owner: string, repo: string, issue: CreateIssue): Promise<ApiResponse<Issue>> => 
    ipcRenderer.invoke('create-issue', token, owner, repo, issue),
  updateIssue: (token: string, owner: string, repo: string, number: number, issue: UpdateIssue): Promise<ApiResponse<Issue>> => 
    ipcRenderer.invoke('update-issue', token, owner, repo, number, issue),

  // Label management
  getLabels: (token: string, owner: string, repo: string): Promise<ApiResponse<Label[]>> => 
    ipcRenderer.invoke('get-labels', token, owner, repo),
  createLabel: (token: string, owner: string, repo: string, label: CreateLabel): Promise<ApiResponse<Label>> => 
    ipcRenderer.invoke('create-label', token, owner, repo, label),
  updateLabel: (token: string, owner: string, repo: string, name: string, label: UpdateLabel): Promise<ApiResponse<Label>> => 
    ipcRenderer.invoke('update-label', token, owner, repo, name, label),
  deleteLabel: (token: string, owner: string, repo: string, name: string): Promise<ApiResponse<void>> => 
    ipcRenderer.invoke('delete-label', token, owner, repo, name),
});

// Debug log to confirm electronAPI is exposed
console.log('🔧 electronAPI exposed to window object');

