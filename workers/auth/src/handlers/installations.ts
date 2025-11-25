/**
 * Installations handler
 * Feature: 002-github-app-auth
 * 
 * Handles fetching and refreshing GitHub App installations for authenticated users.
 */

import type { WorkerEnv } from '@issuedesk/shared';
import { getSession, updateSessionInstallations } from '../storage/sessions';
import { rateLimitMiddleware } from '../utils/rate-limit';
import { errorResponse, ErrorCode, mapGitHubError } from '../utils/errors';
import { GitHubClient } from '../auth/github';

/**
 * POST /auth/installations
 * 
 * Refresh the list of GitHub App installations for the authenticated user.
 * This is useful after the user installs the app on new accounts/organizations.
 * 
 * Request headers:
 * - X-Session-Token: Backend session token from device flow
 * 
 * Response:
 * - installations: Array of Installation objects
 */
export async function handleRefreshInstallations(
  request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Get session token from header
    const sessionToken = request.headers.get('X-Session-Token');
    if (!sessionToken) {
      return errorResponse(
        ErrorCode.UNAUTHORIZED,
        'X-Session-Token header is required',
        401,
        false,
        corsHeaders
      );
    }

    // Get session from KV
    const session = await getSession(sessionToken, env);
    if (!session) {
      return errorResponse(
        ErrorCode.UNAUTHORIZED,
        'Invalid or expired session token',
        401,
        false,
        corsHeaders
      );
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      session.userId.toString(),
      env,
      corsHeaders
    );
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Fetch fresh installations from GitHub
    const client = new GitHubClient(env);
    const installations = await client.getUserInstallations(session.accessToken);

    console.log(`[Installations] User ${session.userId} has ${installations.length} installations`);

    // Update session with fresh installations
    await updateSessionInstallations(sessionToken, installations, env);

    return new Response(
      JSON.stringify({ installations }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('[Installations] Error:', error);

    // Handle GitHub API errors
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const githubError = mapGitHubError(error);
      return errorResponse(
        githubError.code,
        githubError.message,
        500,
        githubError.retryable,
        corsHeaders
      );
    }

    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : 'Failed to refresh installations',
      500,
      true,
      corsHeaders
    );
  }
}
