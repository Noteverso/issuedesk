import { getGitHubClient } from './client';

export interface RateLimit {
  remaining: number;
  limit: number;
  reset: number; // Unix timestamp (seconds)
}

/**
 * Rate limit tracker
 * Monitors GitHub API rate limits from response headers
 */
export class RateLimitTracker {
  private currentLimit: RateLimit | null = null;

  /**
   * Update rate limit from response headers
   */
  updateFromHeaders(headers: any): void {
    if (!headers) return;

    const remaining = headers['x-ratelimit-remaining'];
    const limit = headers['x-ratelimit-limit'];
    const reset = headers['x-ratelimit-reset'];

    if (remaining !== undefined && limit !== undefined && reset !== undefined) {
      this.currentLimit = {
        remaining: parseInt(remaining, 10),
        limit: parseInt(limit, 10),
        reset: parseInt(reset, 10),
      };
    }
  }

  /**
   * Get current rate limit state
   */
  getCurrent(): RateLimit | null {
    return this.currentLimit;
  }

  /**
   * Check if rate limit is below threshold (20%)
   */
  isBelowThreshold(threshold = 0.2): boolean {
    if (!this.currentLimit) return false;
    return this.currentLimit.remaining / this.currentLimit.limit < threshold;
  }

  /**
   * Check if rate limit is exhausted
   */
  isExhausted(): boolean {
    return this.currentLimit?.remaining === 0;
  }

  /**
   * Get time until rate limit reset (in milliseconds)
   */
  getTimeUntilReset(): number {
    if (!this.currentLimit) return 0;
    return (this.currentLimit.reset * 1000) - Date.now();
  }
}

export const rateLimitTracker = new RateLimitTracker();
