import { Octokit } from '@octokit/rest';

/**
 * GitHub API client wrapper
 * Handles authentication and provides typed API methods
 */
export class GitHubClient {
  private octokit: Octokit | null = null;
  private owner: string = '';
  private repo: string = '';

  /**
   * Initialize client with authentication token
   */
  authenticate(token: string, owner: string, repo: string): void {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return this.octokit !== null;
  }

  /**
   * Get rate limit information from response headers
   */
  getRateLimit(response: any): { remaining: number; limit: number; reset: number } | null {
    const headers = response?.headers;
    if (!headers) return null;

    return {
      remaining: parseInt(headers['x-ratelimit-remaining'] || '0', 10),
      limit: parseInt(headers['x-ratelimit-limit'] || '0', 10),
      reset: parseInt(headers['x-ratelimit-reset'] || '0', 10),
    };
  }

  /**
   * Get Octokit instance (throws if not authenticated)
   */
  getClient(): Octokit {
    if (!this.octokit) {
      throw new Error('GitHub client not authenticated');
    }
    return this.octokit;
  }

  /**
   * Get current repository owner
   */
  getOwner(): string {
    return this.owner;
  }

  /**
   * Get current repository name
   */
  getRepo(): string {
    return this.repo;
  }
}

// Singleton instance
let instance: GitHubClient | null = null;

export function getGitHubClient(): GitHubClient {
  if (!instance) {
    instance = new GitHubClient();
  }
  return instance;
}
