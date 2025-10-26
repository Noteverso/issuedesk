import { getGitHubClient } from './client';

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  html_url: string;
  labels: Array<{ name: string }>;
}

/**
 * Issues API wrapper
 */
export class IssuesAPI {
  /**
   * List issues from GitHub
   */
  async list(page = 1, perPage = 100): Promise<GitHubIssue[]> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    const response = await client.issues.listForRepo({
      owner,
      repo,
      state: 'all',
      per_page: perPage,
      page,
    });

    return response.data as GitHubIssue[];
  }

  /**
   * Get a single issue from GitHub
   */
  async get(issueNumber: number): Promise<GitHubIssue> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    const response = await client.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    return response.data as GitHubIssue;
  }

  /**
   * Create an issue on GitHub
   */
  async create(title: string, body?: string, labels?: string[]): Promise<GitHubIssue> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    const response = await client.issues.create({
      owner,
      repo,
      title,
      body: body || undefined,
      labels: labels || [],
    });

    return response.data as GitHubIssue;
  }

  /**
   * Update an issue on GitHub
   */
  async update(
    issueNumber: number,
    data: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
    }
  ): Promise<GitHubIssue> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    const response = await client.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      ...data,
    });

    return response.data as GitHubIssue;
  }
}

export const issuesAPI = new IssuesAPI();
