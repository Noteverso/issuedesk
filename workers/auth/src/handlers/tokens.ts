/**
 * Token handlers for GitHub App authentication
 * Feature: 002-github-app-auth
 * 
 * Handles installation token exchange and refresh.
 */

import type { WorkerEnv } from '@issuedesk/shared';
import { GitHubClient } from '../auth/github';
import { getBackendSession, updateSessionRefreshTime } from '../storage/sessions';
import { errorResponse, validateRequest, mapGitHubError, ErrorCode } from '../utils/errors';
import { rateLimitMiddleware } from '../utils/rate-limit';
import { deduplicateRequest, getTokenRefreshKey } from '../utils/dedup'; // T070a/b
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

  const session = await getBackendSession(sessionToken, env);
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
 * T060a: Updates lastRefreshAt to reset 30-day sliding window TTL.
 * T070b: Applies request deduplication to prevent concurrent refresh calls.
 */
export async function handleRefreshInstallationToken(
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

  const session = await getBackendSession(sessionToken, env);
  if (!session) {
    return errorResponse(
      ErrorCode.UNAUTHORIZED,
      'Invalid or expired session',
      401,
      false,
      corsHeaders
    );
  }

  // Validate request body
  let body: unknown;
  try {
    body = await request.clone().json();
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
  
  // T070b: Deduplicate concurrent refresh requests
  const dedupKey = getTokenRefreshKey(session.userId, installation_id);
  
  // Wrap the refresh request in deduplication
  const response = await deduplicateRequest(dedupKey, async () => {
    return handleInstallationToken(request, env, corsHeaders);
  });
  
  // Post-processing after deduplicated request
  return await postProcessRefresh(response, sessionToken, env, session, installation_id);
}

/**
 * Post-process refresh response (update session, log, emit events).
 */
async function postProcessRefresh(
  response: Response,
  sessionToken: string | null,
  env: WorkerEnv,
  session: any,
  installationId: number
): Promise<Response> {
  // If successful, update session refresh time to reset 30-day TTL
  if (response.status === 200 && sessionToken) {
    try {
      // T062: Log token refresh success
      console.log('[Tokens] Token refresh successful', {
        userId: session?.userId,
        installationId,
        timestamp: new Date().toISOString()
      });
      
      await updateSessionRefreshTime(sessionToken, env);
      console.log('[Tokens] Session refresh time updated for sliding window TTL');
    } catch (error) {
      console.error('[Tokens] Failed to update session refresh time:', error);
      // Non-fatal error - don't fail the token refresh
    }
  } else if (response.status !== 200) {
    // T062: Log token refresh failures
    console.error('[Tokens] Token refresh failed', {
      status: response.status,
      timestamp: new Date().toISOString()
    });
  }
  
  return response;
}
