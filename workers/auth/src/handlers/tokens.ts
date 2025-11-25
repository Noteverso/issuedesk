/**
 * Token handlers for GitHub App authentication
 * Feature: 002-github-app-auth
 * 
 * Handles installation token exchange and refresh.
 */

import type { WorkerEnv } from '@issuedesk/shared';
import { GitHubClient } from '../auth/github';
import { getSession } from '../storage/sessions';
import { errorResponse, validateRequest, mapGitHubError, ErrorCode } from '../utils/errors';
import { rateLimitMiddleware } from '../utils/rate-limit';
import { z } from 'zod';

const InstallationTokenRequestSchema = z.object({
  installation_id: z.number().int().positive(),
});

type InstallationTokenRequest = z.infer<typeof InstallationTokenRequestSchema>;

/**
 * POST /auth/installation-token
 * 
 * Exchange installation_id for a short-lived (1-hour) access token.
 * Requires valid session token in X-Session-Token header.
 */
export async function handleInstallationToken(
  request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Validate session token
  const sessionToken = request.headers.get('X-Session-Token');
  if (!sessionToken) {
    return errorResponse(
      ErrorCode.UNAUTHORIZED,
      'Missing X-Session-Token header',
      401,
      false,
      corsHeaders
    );
  }

  const session = await getSession(sessionToken, env);
  if (!session) {
    return errorResponse(
      ErrorCode.UNAUTHORIZED,
      'Invalid or expired session',
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

  const validation = validateRequest(body, InstallationTokenRequestSchema, corsHeaders);
  if (validation instanceof Response) {
    return validation;
  }

  const { installation_id } = validation.data as InstallationTokenRequest;

  // Verify installation belongs to user
  const userOwnsInstallation = session.installations.some(
    (inst) => inst.id === installation_id
  );

  if (!userOwnsInstallation) {
    return errorResponse(
      ErrorCode.UNAUTHORIZED,
      'Installation not accessible. This installation does not belong to your account.',
      403,
      false,
      corsHeaders
    );
  }

  try {
    const client = new GitHubClient(env);
    
    // Exchange installation_id for access token
    const tokenResponse = await client.createInstallationToken(installation_id);

    return new Response(
      JSON.stringify({
        token: tokenResponse.token,
        expires_at: tokenResponse.expires_at,
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
    console.error('[Tokens] Error getting installation token:', error);
    const mapped = mapGitHubError(error);
    return errorResponse(
      mapped.code,
      mapped.message,
      500,
      mapped.retryable,
      corsHeaders
    );
  }
}

/**
 * POST /auth/refresh-installation-token
 * 
 * Refresh installation token (functionally identical to /auth/installation-token).
 * Separate endpoint for semantic clarity and potential future analytics.
 */
export async function handleRefreshInstallationToken(
  request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Delegate to handleInstallationToken - same implementation
  return handleInstallationToken(request, env, corsHeaders);
}
