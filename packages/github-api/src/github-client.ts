import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Repository,
  Issue,
  Label,
  CreateIssue,
  UpdateIssue,
  CreateLabel,
  UpdateLabel,
  ApiResponse,
  ApiError,
  GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
  API_ENDPOINTS,
} from '@issuedesk/shared';

export class GitHubClient {
  private client: AxiosInstance;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.client = axios.create({
      baseURL: GITHUB_API_BASE_URL,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': `application/vnd.github.v3+json`,
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
        'User-Agent': 'IssueDesk-Client/1.0.0',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'Unknown error',
          status: error.response?.status,
          code: error.response?.data?.errors?.[0]?.code,
        };
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.client.get(API_ENDPOINTS.USER);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Get user repositories
   */
  async getRepositories(): Promise<ApiResponse<Repository[]>> {
    try {
      const response: AxiosResponse<Repository[]> = await this.client.get(API_ENDPOINTS.REPOS);
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<ApiResponse<Repository>> {
    try {
      const response: AxiosResponse<Repository> = await this.client.get(
        API_ENDPOINTS.REPO(owner, repo)
      );
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Get issues for a repository
   */
  async getIssues(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<ApiResponse<Issue[]>> {
    try {
      const params = new URLSearchParams();
      if (options.state) params.append('state', options.state);
      if (options.labels) params.append('labels', options.labels);
      if (options.sort) params.append('sort', options.sort);
      if (options.direction) params.append('direction', options.direction);
      if (options.per_page) params.append('per_page', options.per_page.toString());
      if (options.page) params.append('page', options.page.toString());

      const response: AxiosResponse<Issue[]> = await this.client.get(
        `${API_ENDPOINTS.ISSUES(owner, repo)}?${params.toString()}`
      );
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Get a specific issue
   */
  async getIssue(owner: string, repo: string, number: number): Promise<ApiResponse<Issue>> {
    try {
      const response: AxiosResponse<Issue> = await this.client.get(
        API_ENDPOINTS.ISSUE(owner, repo, number)
      );
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(
    owner: string,
    repo: string,
    issue: CreateIssue
  ): Promise<ApiResponse<Issue>> {
    try {
      const response: AxiosResponse<Issue> = await this.client.post(
        API_ENDPOINTS.ISSUES(owner, repo),
        issue
      );
      return {
        data: response.data,
        success: true,
        message: 'Issue created successfully',
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(
    owner: string,
    repo: string,
    number: number,
    issue: UpdateIssue
  ): Promise<ApiResponse<Issue>> {
    try {
      const response: AxiosResponse<Issue> = await this.client.patch(
        API_ENDPOINTS.ISSUE(owner, repo, number),
        issue
      );
      return {
        data: response.data,
        success: true,
        message: 'Issue updated successfully',
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Get labels for a repository
   */
  async getLabels(owner: string, repo: string): Promise<ApiResponse<Label[]>> {
    try {
      const response: AxiosResponse<Label[]> = await this.client.get(
        API_ENDPOINTS.LABELS(owner, repo)
      );
      return {
        data: response.data,
        success: true,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Create a new label
   */
  async createLabel(
    owner: string,
    repo: string,
    label: CreateLabel
  ): Promise<ApiResponse<Label>> {
    try {
      const response: AxiosResponse<Label> = await this.client.post(
        API_ENDPOINTS.LABELS(owner, repo),
        label
      );
      return {
        data: response.data,
        success: true,
        message: 'Label created successfully',
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Update a label
   */
  async updateLabel(
    owner: string,
    repo: string,
    name: string,
    label: UpdateLabel
  ): Promise<ApiResponse<Label>> {
    try {
      const response: AxiosResponse<Label> = await this.client.patch(
        API_ENDPOINTS.LABEL(owner, repo, name),
        label
      );
      return {
        data: response.data,
        success: true,
        message: 'Label updated successfully',
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Delete a label
   */
  async deleteLabel(owner: string, repo: string, name: string): Promise<ApiResponse<void>> {
    try {
      await this.client.delete(API_ENDPOINTS.LABEL(owner, repo, name));
      return {
        data: undefined,
        success: true,
        message: 'Label deleted successfully',
      };
    } catch (error) {
      return {
        data: undefined,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Test the connection with current token
   */
  async testConnection(): Promise<ApiResponse<boolean>> {
    try {
      const userResponse = await this.getCurrentUser();
      return {
        data: userResponse.success,
        success: userResponse.success,
        message: userResponse.success ? 'Connection successful' : userResponse.message,
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: (error as ApiError).message,
      };
    }
  }
}
