/**
 * Error handling utilities for API errors
 * Implements T080 - Handle authorization errors
 */

/**
 * Check if an error is an authorization error
 */
export function isUnauthorizedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ((error as any).code === 'UNAUTHORIZED' || 
     error.message.includes('Authorization failed') ||
     error.message.includes('Not authenticated'))
  );
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('Network request failed') ||
     error.message.includes('Failed to fetch'))
  );
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return 'Session expired. Please log in again.';
  }

  if (isNetworkError(error)) {
    return 'Network error. Please check your connection.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
