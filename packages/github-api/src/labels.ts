import { getGitHubClient } from './client';

export interface GitHubLabel {
  name: string;
  color: string;
  description: string | null;
}

/**
 * Labels API wrapper
 */
export class LabelsAPI {
  /**
   * List labels from GitHub
   */
  async list(): Promise<GitHubLabel[]> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    const response = await client.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
    });

    return response.data as GitHubLabel[];
  }

  /**
   * Create a label on GitHub
   */
  async create(name: string, color: string, description?: string): Promise<GitHubLabel> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    const response = await client.issues.createLabel({
      owner,
      repo,
      name,
      color,
      description: description || undefined,
    });

    return response.data as GitHubLabel;
  }

  /**
   * Update a label on GitHub
   */
  async update(
    currentName: string,
    data: {
      new_name?: string;
      color?: string;
      description?: string;
    }
  ): Promise<GitHubLabel> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    const response = await client.issues.updateLabel({
      owner,
      repo,
      name: currentName,
      ...data,
    });

    return response.data as GitHubLabel;
  }

  /**
   * Delete a label on GitHub
   */
  async delete(name: string): Promise<void> {
    const client = getGitHubClient().getClient();
    const owner = getGitHubClient().getOwner();
    const repo = getGitHubClient().getRepo();

    await client.issues.deleteLabel({
      owner,
      repo,
      name,
    });
  }
}

export const labelsAPI = new LabelsAPI();
