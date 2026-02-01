/**
 * API client adapter for React Native
 * Wraps @issuedesk/github-api for mobile use
 */

import type { AccessToken, SelectedRepository } from '../types';
import { secureStorage, preferenceStorage } from '../services/storage';

// Backend URL for authentication
const AUTH_BACKEND_URL = process.env.EXPO_PUBLIC_AUTH_BACKEND_URL || 'https://issuedesk-auth.byodian.workers.dev';

/**
 * GitHub API client for mobile
 */
export class MobileGitHubClient {
  private accessToken: string | null = null;
  private repository: SelectedRepository | null = null;

  /**
   * Initialize client with stored credentials
   */
  async initialize(): Promise<boolean> {
    const token = await secureStorage.getAccessToken();
    const repo = await preferenceStorage.getSelectedRepository();

    if (token && !this.isTokenExpired(token)) {
      this.accessToken = token.token;
      this.repository = repo;
      return true;
    }

    return false;
  }

  /**
   * Check if token is expired (with 5-minute buffer)
   */
  private isTokenExpired(token: AccessToken): boolean {
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= token.expiresAt - bufferMs;
  }

  /**
   * Set access token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Set active repository
   */
  setRepository(repo: SelectedRepository): void {
    this.repository = repo;
  }

  /**
   * Get current repository
   */
  getRepository(): SelectedRepository | null {
    return this.repository;
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const url = `https://api.github.com${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${this.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get repositories accessible by the installation
   */
  async getRepositories(): Promise<Array<{
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
    description: string | null;
    private: boolean;
  }>> {
    const response = await this.request<{
      repositories: Array<{
        id: number;
        name: string;
        full_name: string;
        owner: { login: string };
        description: string | null;
        private: boolean;
      }>;
    }>('/installation/repositories');
    return response.repositories;
  }

  /**
   * Get issues for the selected repository
   */
  async getIssues(params?: {
    state?: 'open' | 'closed' | 'all';
    labels?: string;
    page?: number;
    per_page?: number;
  }): Promise<Array<{
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    labels: Array<{ id: number; name: string; color: string; description: string | null }>;
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
    comments: number;
    html_url: string;
  }>> {
    if (!this.repository) {
      throw new Error('No repository selected');
    }

    const queryParams = new URLSearchParams();
    if (params?.state) queryParams.set('state', params.state);
    if (params?.labels) queryParams.set('labels', params.labels);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.per_page) queryParams.set('per_page', params.per_page.toString());

    const query = queryParams.toString();
    const endpoint = `/repos/${this.repository.owner}/${this.repository.name}/issues${query ? `?${query}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * Get a single issue
   */
  async getIssue(issueNumber: number): Promise<{
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    labels: Array<{ id: number; name: string; color: string; description: string | null }>;
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
    comments: number;
    html_url: string;
  }> {
    if (!this.repository) {
      throw new Error('No repository selected');
    }

    return this.request(
      `/repos/${this.repository.owner}/${this.repository.name}/issues/${issueNumber}`
    );
  }

  /**
   * Create a new issue
   */
  async createIssue(data: {
    title: string;
    body?: string;
    labels?: string[];
  }): Promise<{ number: number }> {
    if (!this.repository) {
      throw new Error('No repository selected');
    }

    return this.request(
      `/repos/${this.repository.owner}/${this.repository.name}/issues`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Update an existing issue
   */
  async updateIssue(
    issueNumber: number,
    data: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
    }
  ): Promise<void> {
    if (!this.repository) {
      throw new Error('No repository selected');
    }

    await this.request(
      `/repos/${this.repository.owner}/${this.repository.name}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Get comments for an issue
   */
  async getComments(issueNumber: number): Promise<Array<{
    id: number;
    body: string;
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
  }>> {
    if (!this.repository) {
      throw new Error('No repository selected');
    }

    return this.request(
      `/repos/${this.repository.owner}/${this.repository.name}/issues/${issueNumber}/comments`
    );
  }

  /**
   * Create a comment on an issue
   */
  async createComment(issueNumber: number, body: string): Promise<{
    id: number;
    body: string;
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
  }> {
    if (!this.repository) {
      throw new Error('No repository selected');
    }

    return this.request(
      `/repos/${this.repository.owner}/${this.repository.name}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * Get repository labels
   */
  async getLabels(): Promise<Array<{
    id: number;
    name: string;
    color: string;
    description: string | null;
  }>> {
    if (!this.repository) {
      throw new Error('No repository selected');
    }

    return this.request(
      `/repos/${this.repository.owner}/${this.repository.name}/labels`
    );
  }
}

// Singleton instance
export const githubClient = new MobileGitHubClient();

/**
 * Get the auth backend URL
 */
export function getAuthBackendUrl(): string {
  return AUTH_BACKEND_URL;
}
