/**
 * Request deduplication utility
 * Feature: 002-github-app-auth
 * Task: T070a - Prevent duplicate concurrent requests
 * 
 * Prevents multiple simultaneous requests for the same resource.
 * Useful for token refresh where multiple API calls might trigger refresh simultaneously.
 */

interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

// In-memory map of pending requests
// Key format: `${method}:${url}:${userId}`
const pendingRequests = new Map<string, PendingRequest>();

const REQUEST_TTL_MS = 5000; // 5 seconds

/**
 * Clean up expired pending requests.
 */
function cleanupExpiredRequests(): void {
  const now = Date.now();
  
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > REQUEST_TTL_MS) {
      pendingRequests.delete(key);
    }
  }
}

/**
 * Deduplicate concurrent requests to the same resource.
 * 
 * If a request is already in flight for the same key, returns the existing promise.
 * Otherwise, executes the request function and caches the promise.
 * 
 * @param key - Unique identifier for the request (e.g., "POST:/auth/refresh-installation-token:12345")
 * @param requestFn - Function that performs the actual request
 * @returns Response promise
 */
export async function deduplicateRequest(
  key: string,
  requestFn: () => Promise<Response>
): Promise<Response> {
  // Clean up old requests periodically
  cleanupExpiredRequests();
  
  // Check if request is already in flight
  const existing = pendingRequests.get(key);
  if (existing) {
    console.log('[Dedup] Request already in flight, reusing promise:', key);
    return existing.promise;
  }

  // Execute new request
  console.log('[Dedup] Starting new request:', key);
  const promise = requestFn();
  
  // Cache the promise
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  // Clean up after request completes (success or failure)
  promise.finally(() => {
    pendingRequests.delete(key);
    console.log('[Dedup] Request completed, cleaned up:', key);
  });

  return promise;
}

/**
 * Generate deduplication key for token refresh requests.
 * 
 * @param userId - User ID making the request
 * @param installationId - Installation ID being refreshed
 * @returns Deduplication key
 */
export function getTokenRefreshKey(userId: number, installationId: number): string {
  return `POST:/auth/refresh-installation-token:${userId}:${installationId}`;
}

/**
 * Clear all pending requests (useful for testing or cleanup).
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
  console.log('[Dedup] All pending requests cleared');
}
