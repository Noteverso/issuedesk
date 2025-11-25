/**
 * GitHub API client for Cloudflare Worker
 * Feature: 002-github-app-auth
 * 
 * Wraps GitHub Device Flow, User Info, and Installations API endpoints.
 */

import type { WorkerEnv } from '@issuedesk/shared';
import type { DeviceAuthorization, User, Installation, GitHubDeviceFlowResponse } from '@issuedesk/shared';
import { generateGitHubAppJWT } from './jwt';
import { retry, isDefaultRetryableError } from '../utils/retry';
import { ErrorCode } from '../utils/errors';

const GITHUB_API_BASE = 'https://api.github.com';
const USER_AGENT = 'IssueDesk/1.0.0'; // GitHub requires User-Agent header

/**
 * GitHub API client with automatic retry and JWT generation
 */
export class GitHubClient {
  constructor(private env: WorkerEnv) {}

  /**
   * Initiate device flow authorization.
   * POST https://github.com/login/device/code
   */
  async initiateDeviceFlow(): Promise<DeviceAuthorization> {
    const response = await retry(
      () => fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({
          client_id: this.env.GITHUB_CLIENT_ID,
          // Scope required to read user's installations
          // See: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#using-the-device-flow-to-generate-a-user-access-token
          scope: '',
        }),
      }),
      { isRetryable: isDefaultRetryableError }
    );

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return await response.json() as DeviceAuthorization;
  }

  /**
   * Poll for device flow authorization.
   * POST https://github.com/login/oauth/access_token
   * 
   * Returns GitHub's API response directly - either success with access_token
   * or error response (authorization_pending, slow_down, expired_token, access_denied)
   */
  async pollDeviceFlow(deviceCode: string): Promise<GitHubDeviceFlowResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({
        client_id: this.env.GITHUB_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return await response.json() as GitHubDeviceFlowResponse;
  }

  /**
   * Get authenticated user information.
   * GET https://api.github.com/user
   */
  async getUser(accessToken: string): Promise<User> {
    const response = await retry(
      () => fetch(`${GITHUB_API_BASE}/user`, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': USER_AGENT,
        },
      }),
      { isRetryable: isDefaultRetryableError }
    );

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return await response.json() as User;
  }

  /**
   * Get user's GitHub App installations.
   * GET https://api.github.com/user/installations
   */
  async getUserInstallations(accessToken: string): Promise<Installation[]> {
    console.log('[getUserInstallations] Token:', accessToken.substring(0, 10) + '...');
    console.log('[getUserInstallations] URL:', `${GITHUB_API_BASE}/user/installations`);
    
    const response = await retry(
      () => fetch(`${GITHUB_API_BASE}/user/installations`, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': USER_AGENT,
        },
      }),
      { isRetryable: isDefaultRetryableError }
    );

    console.log('[getUserInstallations] Response status:', response.status);
    console.log('[getUserInstallations] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getUserInstallations] Error response:', errorText);
      // Need to create a new response since we consumed the body
      const errorResponse = new Response(errorText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      throw await this.handleErrorResponse(errorResponse);
    }

    const data = await response.json();
    return (data as { installations?: Installation[] }).installations || [];
  }

  /**
   * Create installation access token.
   * POST https://api.github.com/app/installations/{installation_id}/access_tokens
   * 
   * Requires GitHub App JWT authentication.
   */
  async createInstallationToken(installationId: number): Promise<{
    token: string;
    expires_at: string;
    permissions: Record<string, string>;
    repository_selection: 'all' | 'selected';
  }> {
    const jwt = await generateGitHubAppJWT(this.env);

    const response = await retry(
      () => fetch(`${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${jwt}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': USER_AGENT,
        },
      }),
      { isRetryable: isDefaultRetryableError }
    );

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return await response.json() as { 
      token: string; 
      expires_at: string; 
      permissions: Record<string, string>; 
      repository_selection: 'all' | 'selected'; 
    };
  }

  /**
   * Handle error responses from GitHub API
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    const status = response.status;
    let errorData: any;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    return {
      name: ErrorCode.GITHUB_API_ERROR,
      message: errorData.message || `GitHub API error: ${status}`,
      status,
      ...errorData,
    } as any;
  }
}
