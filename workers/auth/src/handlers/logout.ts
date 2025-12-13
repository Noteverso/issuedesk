/**
 * Logout handler for GitHub App authentication
 * Feature: 002-github-app-auth
 * Task: T073 - Create POST /auth/logout endpoint
 * 
 * Deletes backend session from KV storage.
 */

import type { WorkerEnv } from '@issuedesk/shared';
import { deleteSession, isValidSessionTokenFormat } from '../storage/sessions';
import { errorResponse, ErrorCode } from '../utils/errors';

/**
 * POST /auth/logout
 * 
 * Deletes backend session from KV storage.
 * Requires valid session token in X-Session-Token header.
 * 
 * Response:
 * - 200: { success: true }
 * - 401: Missing or invalid session token
 */
export async function handleLogout(
  request: Request,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Validate session token header
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

  // Validate token format
  if (!isValidSessionTokenFormat(sessionToken)) {
    return errorResponse(
      ErrorCode.UNAUTHORIZED,
      'Invalid session token format',
      401,
      false,
      corsHeaders
    );
  }

  // Delete session from KV storage
  try {
    await deleteSession(sessionToken, env);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('[Logout] Failed to delete session:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      'Failed to logout',
      500,
      true,
      corsHeaders
    );
  }
}
