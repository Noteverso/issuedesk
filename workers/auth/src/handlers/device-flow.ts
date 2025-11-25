/**
 * Device Flow handlers for GitHub App authentication
 * Feature: 002-github-app-auth
 * 
 * Implements the OAuth device flow for GitHub Apps.
 * 
 * Flow:
 * 1. Client calls POST /auth/device → receives device_code and user_code
 * 2. User visits verification_uri and enters user_code
 * 3. Client polls POST /auth/poll with device_code
 * 4. On success, returns session_token, user data, and installations
 */

import type { WorkerEnv } from '@issuedesk/shared';
import { GitHubClient } from '../auth/github';
import { createSession } from '../storage/sessions';
import { errorResponse, validateRequest, mapGitHubError, ErrorCode } from '../utils/errors';
import { rateLimitMiddleware } from '../utils/rate-limit';
import { PollRequestSchema } from '@issuedesk/shared';

/**
 * POST /auth/device
 * 
 * Initiates GitHub device flow.
 * Returns device_code (for polling) and user_code (for user display).
 */
export async function handleDeviceFlow(
  _request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const client = new GitHubClient(env);
    const deviceAuth = await client.initiateDeviceFlow();
    console.log('Device Auth Response:', deviceAuth);

    return new Response(
      JSON.stringify(deviceAuth),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('[DeviceFlow] Error initiating device flow:', error);
    const mapped = mapGitHubError(error);
    return errorResponse(mapped.code, mapped.message, 500, mapped.retryable, corsHeaders);
  }
}

/**
 * POST /auth/poll
 * 
 * Polls GitHub for device authorization completion.
 * Returns session_token, user, and installations on success.
 * 
 * Special GitHub errors:
 * - authorization_pending: User hasn't authorized yet (keep polling)
 * - slow_down: Polling too fast (increase interval)
 * - expired_token: Device code expired (restart flow)
 * - access_denied: User denied access (stop polling)
 */
export async function handlePollDeviceFlow(
  request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(
      ErrorCode.INVALID_REQUEST,
      'Invalid JSON in request body',
      400,
      false,
      corsHeaders
    );
  }

  const validation = validateRequest(body, PollRequestSchema, corsHeaders);
  if (validation instanceof Response) {
    return validation;
  }

  const { device_code } = validation.data;

  try {
    const client = new GitHubClient(env);

    // Poll GitHub for authorization
    const tokenResponse = await client.pollDeviceFlow(device_code);
    
    // Handle GitHub error responses (authorization_pending, slow_down, etc.)
    if ('error' in tokenResponse) {
      throw tokenResponse; // Will be handled by mapGitHubError in catch block
    }
    
    console.log('[DeviceFlow] Got access token, fetching installations', tokenResponse);

    // Get user's installations first (this works without user profile permission)
    const installations = await client.getUserInstallations(tokenResponse.access_token);
    console.log('[DeviceFlow] Got installations:', installations.length);

    // For issue management apps, we can use the first installation account as user info
    // If no installations, we'll need to get user info from GitHub API
    let user;
    if (installations.length === 0) {
      // Fetch user profile when no installations exist
      const githubUser = await client.getUser(tokenResponse.access_token);
      user = {
        id: githubUser.id,
        login: githubUser.login,
        name: githubUser.name || githubUser.login,
        avatar_url: githubUser.avatar_url,
        email: githubUser.email,
      };
      console.log('[DeviceFlow] No installations, using GitHub user profile:', user.login);
    } else {
      const firstInstallation = installations[0]!;
      user = {
        id: firstInstallation.account.id,
        login: firstInstallation.account.login,
        name: firstInstallation.account.login, // Use login as name fallback
        avatar_url: firstInstallation.account.avatar_url,
        email: null, // Email not needed for issue management
      };
      console.log('[DeviceFlow] Using installation account as user:', user.login);
    }

    // Apply rate limiting based on user ID
    const rateLimitResult = await rateLimitMiddleware(
      user.id.toString(),
      env,
      corsHeaders
    );
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Create backend session
    const sessionToken = await createSession(
      user.id,
      tokenResponse.access_token,
      installations,
      env
    );

    // Return session data
    return new Response(
      JSON.stringify({
        session_token: sessionToken,
        user,
        installations,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('[DeviceFlow] Error polling device flow:', error);
    const mapped = mapGitHubError(error);

    // Map GitHub-specific errors to appropriate HTTP status codes
    let status = 500;
    if (mapped.code === ErrorCode.AUTHORIZATION_PENDING) {
      status = 202; // Accepted - still waiting
    } else if (mapped.code === ErrorCode.SLOW_DOWN) {
      status = 429; // Too Many Requests
    } else if (mapped.code === ErrorCode.EXPIRED_TOKEN) {
      status = 410; // Gone
    } else if (mapped.code === ErrorCode.ACCESS_DENIED) {
      status = 403; // Forbidden
    }

    return errorResponse(mapped.code, mapped.message, status, mapped.retryable, corsHeaders);
  }
}
