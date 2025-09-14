import { AppConfig, Repository, Issue, Label, CreateIssue, UpdateIssue, CreateLabel, UpdateLabel, ApiResponse } from '@issuedesk/shared';

declare global {
  interface Window {
    electronAPI: {
      getConfig: () => Promise<AppConfig>;
      setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>;
      testGitHubConnection: (token: string) => Promise<ApiResponse<boolean>>;
      getGitHubUser: (token: string) => Promise<ApiResponse<any>>;
      getRepositories: (token: string) => Promise<ApiResponse<Repository[]>>;
      getIssues: (token: string, owner: string, repo: string, options?: any) => Promise<ApiResponse<Issue[]>>;
      createIssue: (token: string, owner: string, repo: string, issue: CreateIssue) => Promise<ApiResponse<Issue>>;
      updateIssue: (token: string, owner: string, repo: string, number: number, issue: UpdateIssue) => Promise<ApiResponse<Issue>>;
      getLabels: (token: string, owner: string, repo: string) => Promise<ApiResponse<Label[]>>;
      createLabel: (token: string, owner: string, repo: string, label: CreateLabel) => Promise<ApiResponse<Label>>;
      updateLabel: (token: string, owner: string, repo: string, name: string, label: UpdateLabel) => Promise<ApiResponse<Label>>;
      deleteLabel: (token: string, owner: string, repo: string, name: string) => Promise<ApiResponse<void>>;
    };
  }
}
