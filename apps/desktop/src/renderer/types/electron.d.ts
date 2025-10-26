import { IpcApi, AppConfig, Repository, Issue, Label, CreateIssueInput, UpdateIssueInput, CreateLabelInput, UpdateLabelInput, ApiResponse } from '@issuedesk/shared';

declare global {
  interface Window {
    electronAPI: IpcApi & {
      // Legacy flat API for backward compatibility
      getConfig: () => Promise<AppConfig>;
      setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>;
      testGitHubConnection: (token: string) => Promise<ApiResponse<boolean>>;
      getGitHubUser: (token: string) => Promise<ApiResponse<any>>;
      getRepositories: (token: string) => Promise<ApiResponse<Repository[]>>;
      getIssues: (token: string, owner: string, repo: string, options?: any) => Promise<ApiResponse<Issue[]>>;
      createIssue: (token: string, owner: string, repo: string, issue: CreateIssueInput) => Promise<ApiResponse<Issue>>;
      updateIssue: (token: string, owner: string, repo: string, number: number, issue: UpdateIssueInput) => Promise<ApiResponse<Issue>>;
      getLabels: (token: string, owner: string, repo: string) => Promise<ApiResponse<Label[]>>;
      createLabel: (token: string, owner: string, repo: string, label: CreateLabelInput) => Promise<ApiResponse<Label>>;
      updateLabel: (token: string, owner: string, repo: string, name: string, label: UpdateLabelInput) => Promise<ApiResponse<Label>>;
      deleteLabel: (token: string, owner: string, repo: string, name: string) => Promise<ApiResponse<void>>;
    };
  }
}

export {};
