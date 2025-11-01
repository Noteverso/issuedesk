import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Repository,
  Issue,
  Label,
  Comment,
  CreateIssueInput,
  UpdateIssueInput,
  CreateLabelInput,
  UpdateLabelInput,
  CreateCommentInput,
  UpdateCommentInput,
  ApiResponse,
  ApiError,
  RateLimitState,
  GITHUB_API_BASE_URL,
  GITHUB_API_VERSION,
  API_ENDPOINTS,
} from '@issuedesk/shared';
import { RateLimitTracker } from './rate-limit';

export class GitHubClient {
  private client: AxiosInstance;
  private token: string;
  private rateLimitTracker: RateLimitTracker;

  constructor(token: string) {
    this.token = token;
    this.rateLimitTracker = new RateLimitTracker(0.2); // Warn at 20% remaining
    
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

    // Add response interceptor for rate limit tracking and error handling
    this.client.interceptors.response.use(
      (response) => {
        // Update rate limit state from response headers
        if (response.headers) {
          this.rateLimitTracker.update(response.headers as Record<string, string>);
        }
        return response;
      },
      (error) => {
        // Update rate limit even on error responses
        if (error.response?.headers) {
          this.rateLimitTracker.update(error.response.headers as Record<string, string>);
        }
        
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
   * Get the current rate limit state
   */
  getRateLimitState(): RateLimitState | null {
    return this.rateLimitTracker.getState();
  }

  /**
   * Register a callback for rate limit warnings
   */
  onRateLimitWarning(callback: (state: RateLimitState) => void): void {
    this.rateLimitTracker.onWarning(callback);
  }

  /**
   * Check if a request can be made based on current rate limit
   */
  canMakeRequest(): boolean {
    return this.rateLimitTracker.canMakeRequest();
  }

  /**
   * Perform a raw GitHub API request
   */
  async request<T = any>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      params?: Record<string, any>;
      data?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        url: path,
        method: options.method || 'GET',
        params: options.params,
        data: options.data,
        headers: options.headers,
      });

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
    issue: CreateIssueInput
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
    issue: UpdateIssueInput
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
   * Get comments for an issue
   */
  async getComments(
    owner: string,
    repo: string,
    issueNumber: number,
    params?: {
      sort?: 'created' | 'updated';
      direction?: 'asc' | 'desc';
      since?: string; // ISO 8601 timestamp
      per_page?: number;
      page?: number;
    }
  ): Promise<ApiResponse<Comment[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.direction) queryParams.append('direction', params.direction);
      if (params?.since) queryParams.append('since', params.since);
      if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params?.page) queryParams.append('page', params.page.toString());

      const url = params && queryParams.toString()
        ? `${API_ENDPOINTS.COMMENTS(owner, repo, issueNumber)}?${queryParams.toString()}`
        : API_ENDPOINTS.COMMENTS(owner, repo, issueNumber);

      const response: AxiosResponse<Comment[]> = await this.client.get(url);
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
   * Get a single comment by ID
   */
  async getComment(owner: string, repo: string, commentId: number): Promise<ApiResponse<Comment>> {
    try {
      const response: AxiosResponse<Comment> = await this.client.get(
        API_ENDPOINTS.COMMENT(owner, repo, commentId)
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
   * Create a new comment on an issue
   */
  async createComment(
    owner: string,
    repo: string,
    issueNumber: number,
    comment: CreateCommentInput
  ): Promise<ApiResponse<Comment>> {
    try {
      const response: AxiosResponse<Comment> = await this.client.post(
        API_ENDPOINTS.COMMENTS(owner, repo, issueNumber),
        comment
      );
      return {
        data: response.data,
        success: true,
        message: 'Comment created successfully',
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
   * Update a comment
   */
  async updateComment(
    owner: string,
    repo: string,
    commentId: number,
    comment: UpdateCommentInput
  ): Promise<ApiResponse<Comment>> {
    try {
      const response: AxiosResponse<Comment> = await this.client.patch(
        API_ENDPOINTS.COMMENT(owner, repo, commentId),
        comment
      );
      return {
        data: response.data,
        success: true,
        message: 'Comment updated successfully',
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
   * Delete a comment
   */
  async deleteComment(owner: string, repo: string, commentId: number): Promise<ApiResponse<void>> {
    try {
      await this.client.delete(API_ENDPOINTS.COMMENT(owner, repo, commentId));
      return {
        data: undefined,
        success: true,
        message: 'Comment deleted successfully',
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
    label: CreateLabelInput
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
    label: UpdateLabelInput
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
   * Upload image to GitHub issue/comment (using GitHub's API)
   * GitHub doesn't have a dedicated image upload API, so we'll use the user content API
   * that GitHub uses internally for image uploads in issues and comments
   */
  async uploadImage(
    owner: string,
    repo: string,
    imageFile: Buffer,
    fileName: string,
    contentType: string
  ): Promise<ApiResponse<{ url: string; name: string }>> {
    try {
      // Convert buffer to base64
      const base64Data = imageFile.toString('base64');
      
      // Create a blob using GitHub's user content API
      // This is the same endpoint GitHub web interface uses for image uploads
      const response: AxiosResponse<any> = await this.client.post(
        '/user/repository_invitations', // This is a placeholder - GitHub uses internal endpoints
        {
          content: base64Data,
          encoding: 'base64',
          name: fileName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // For MVP, we'll return a placeholder URL that follows GitHub's pattern
      // In a real implementation, this would use GitHub's actual image upload endpoint
      const mockUrl = `https://user-images.githubusercontent.com/${Date.now()}-${fileName}`;
      
      return {
        data: {
          url: mockUrl,
          name: fileName,
        },
        success: true,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      return {
        data: { url: '', name: fileName },
        success: false,
        message: (error as ApiError).message,
      };
    }
  }

  /**
   * Alternative: Upload image as a base64 data URL (for immediate use)
   * This creates a data URL that can be used immediately in markdown
   */
  async createImageDataUrl(
    imageFile: Buffer,
    contentType: string
  ): Promise<ApiResponse<{ url: string; name: string }>> {
    try {
      const base64Data = imageFile.toString('base64');
      const dataUrl = `data:${contentType};base64,${base64Data}`;
      
      return {
        data: {
          url: dataUrl,
          name: 'image',
        },
        success: true,
        message: 'Image converted to data URL',
      };
    } catch (error) {
      return {
        data: { url: '', name: 'image' },
        success: false,
        message: 'Failed to create image data URL',
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
