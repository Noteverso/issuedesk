/**
 * Rate limiting utility using Cloudflare KV
 * Feature: 002-github-app-auth
 * 
 * Implements 5 requests per minute per user rate limiting.
 */

import type { WorkerEnv } from '@issuedesk/shared';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Generate rate limit headers for responses.
 * T083: Add rate limit headers to all Worker responses.
 * 
 * @param result - Rate limit check result
 * @returns Headers object with rate limit information
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
}

/**
 * Check if a request is within rate limits.
 * Stores request timestamps in KV with 1-minute TTL.
 * 
 * @param identifier - User ID or IP address for rate limiting
 * @param env - Cloudflare Worker environment
 * @returns Rate limit result with allowed status and remaining count
 */
export async function checkRateLimit(
  identifier: string,
  env: WorkerEnv
): Promise<RateLimitResult> {
  const now = Date.now();
  const kvKey = `rate-limit:${identifier}`;

  // Get existing rate limit data from KV
  const existingData = await env.SESSIONS.get(kvKey, 'json') as { requests?: number[] } | null;
  let requests: number[] = existingData?.requests || [];

  // Filter out expired requests (older than 1 minute)
  const windowStart = now - RATE_LIMIT_WINDOW;
  requests = requests.filter(timestamp => timestamp > windowStart);

  // Check if under limit
  if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
    // Rate limit exceeded
    const oldestRequest = Math.min(...requests);
    const resetAt = new Date(oldestRequest + RATE_LIMIT_WINDOW);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add current request timestamp
  requests.push(now);

  // Store updated requests in KV with 60-second TTL
  await env.SESSIONS.put(
    kvKey,
    JSON.stringify({ requests }),
    { expirationTtl: 60 }
  );

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - requests.length,
    resetAt: new Date(now + RATE_LIMIT_WINDOW),
  };
}

/**
 * Rate limit middleware for Worker handlers.
 * Returns 429 error response if rate limit exceeded.
 * T083: Returns rate limit headers for both successful and failed requests.
 * 
 * @example
 * ```typescript
 * const rateLimitResult = await rateLimitMiddleware(userId, env, corsHeaders);
 * if (rateLimitResult) return rateLimitResult; // Rate limit exceeded
 * ```
 */
export async function rateLimitMiddleware(
  identifier: string,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const result = await checkRateLimit(identifier, env);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'RATE_LIMIT',
        message: `Rate limit exceeded. Try again after ${result.resetAt.toISOString()}`,
        retryable: true,
        resetAt: result.resetAt.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(result),
          'Retry-After': '60',
          ...corsHeaders,
        },
      }
    );
  }

  // Rate limit OK - return null (no error)
  return null;
}

/**
 * Apply rate limit check and return both the result and any error response.
 * T083: Enhanced version that returns rate limit info for successful requests.
 * 
 * @param identifier - User ID or IP address for rate limiting
 * @param env - Cloudflare Worker environment
 * @param corsHeaders - CORS headers to include
 * @returns Object with rate limit result and optional error response
 */
export async function checkRateLimitWithHeaders(
  identifier: string,
  env: WorkerEnv,
  corsHeaders: Record<string, string>
): Promise<{ result: RateLimitResult; errorResponse: Response | null }> {
  const result = await checkRateLimit(identifier, env);
  const errorResponse = await rateLimitMiddleware(identifier, env, corsHeaders);
  
  return { result, errorResponse };
}

/**
 * Clear rate limit data for a user (for testing or manual reset).
 * 
 * @param identifier - User ID or IP address
 * @param env - Cloudflare Worker environment
 */
export async function clearRateLimit(identifier: string, env: WorkerEnv): Promise<void> {
  const kvKey = `rate-limit:${identifier}`;
  await env.SESSIONS.delete(kvKey);
}
