/**
 * Response helper utilities
 * Feature: 002-github-app-auth
 * 
 * T083: Helpers for adding rate limit headers to responses.
 */

import type { RateLimitResult } from './rate-limit';

/**
 * Add rate limit headers to an existing Response.
 * T083: Ensures all responses include X-RateLimit-* headers.
 * 
 * @param response - Original response
 * @param rateLimitResult - Rate limit check result (optional)
 * @returns Response with rate limit headers added
 */
export function addRateLimitHeaders(
  response: Response,
  rateLimitResult?: RateLimitResult
): Response {
  if (!rateLimitResult) {
    return response;
  }

  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-RateLimit-Limit', '5'); // MAX_REQUESTS_PER_WINDOW
  newHeaders.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  newHeaders.set('X-RateLimit-Reset', rateLimitResult.resetAt.toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Create a success response with rate limit headers.
 * T083: Convenience method for handlers to include rate limit info.
 * 
 * @param data - Response body data
 * @param corsHeaders - CORS headers
 * @param rateLimitResult - Rate limit check result (optional)
 * @returns JSON response with rate limit headers
 */
export function successResponse(
  data: any,
  corsHeaders: Record<string, string>,
  rateLimitResult?: RateLimitResult
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...corsHeaders,
  };

  if (rateLimitResult) {
    headers['X-RateLimit-Limit'] = '5';
    headers['X-RateLimit-Remaining'] = rateLimitResult.remaining.toString();
    headers['X-RateLimit-Reset'] = rateLimitResult.resetAt.toISOString();
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}
