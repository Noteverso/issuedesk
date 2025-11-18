/**
 * Retry utility with exponential backoff
 * Feature: 002-github-app-auth
 * 
 * Implements 3-retry strategy with 1s, 2s, 4s delays
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  
  /** Initial delay in milliseconds (default: 1000 = 1s) */
  initialDelay?: number;
  
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  
  /** Predicate to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Execute a function with automatic retry and exponential backoff.
 * 
 * @example
 * ```typescript
 * const result = await retry(
 *   () => fetch('https://api.github.com/user'),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    isRetryable = () => true,
  } = options;

  let lastError: unknown;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxAttempts || !isRetryable(error)) {
        throw error;
      }

      // Wait before next attempt (exponential backoff: 1s, 2s, 4s)
      await sleep(currentDelay);
      currentDelay *= backoffMultiplier;
    }
  }

  // Should never reach here, but TypeScript requires it
  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is a network error (retryable)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    // Common network error patterns
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Check if an error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status: number }).status === 429;
  }
  return false;
}

/**
 * Check if an error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status >= 500 && status < 600;
  }
  return false;
}

/**
 * Default retryable error checker (network errors, 5xx, 429)
 */
export function isDefaultRetryableError(error: unknown): boolean {
  return isNetworkError(error) || isRateLimitError(error) || isServerError(error);
}
