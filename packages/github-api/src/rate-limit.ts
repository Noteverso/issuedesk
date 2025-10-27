import { RateLimitState } from '@issuedesk/shared';

/**
 * GitHub API Rate Limit Tracker
 * 
 * Parses rate limit information from GitHub API response headers
 * and provides utilities for tracking and managing API rate limits.
 * 
 * GitHub API Rate Limits (as of API v3):
 * - Authenticated: 5,000 requests per hour
 * - Unauthenticated: 60 requests per hour
 * 
 * Response Headers:
 * - X-RateLimit-Limit: Maximum number of requests per hour
 * - X-RateLimit-Remaining: Number of requests remaining
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 * - X-RateLimit-Used: Number of requests used
 * - X-RateLimit-Resource: Type of rate limit (core, search, graphql, etc.)
 */

export class RateLimitTracker {
  private currentState: RateLimitState | null = null;
  private warningThreshold: number = 0.2; // Warn at 20% remaining
  private onWarningCallback?: (state: RateLimitState) => void;

  constructor(warningThreshold?: number) {
    if (warningThreshold !== undefined && warningThreshold >= 0 && warningThreshold <= 1) {
      this.warningThreshold = warningThreshold;
    }
  }

  /**
   * Parse rate limit information from GitHub API response headers
   * @param headers - Response headers from GitHub API
   * @returns Parsed RateLimitState or null if headers are missing
   */
  parseHeaders(headers: Record<string, string | string[] | undefined>): RateLimitState | null {
    const remaining = this.getHeaderValue(headers, 'x-ratelimit-remaining');
    const limit = this.getHeaderValue(headers, 'x-ratelimit-limit');
    const reset = this.getHeaderValue(headers, 'x-ratelimit-reset');

    // All three headers must be present
    if (remaining === null || limit === null || reset === null) {
      return null;
    }

    return {
      remaining,
      limit,
      reset,
    };
  }

  /**
   * Update the current rate limit state from response headers
   * @param headers - Response headers from GitHub API
   * @returns The updated RateLimitState or null if parsing failed
   */
  update(headers: Record<string, string | string[] | undefined>): RateLimitState | null {
    const state = this.parseHeaders(headers);
    
    if (!state) {
      return null;
    }

    this.currentState = state;

    // Check if we should emit a warning
    if (this.shouldWarn(state)) {
      this.emitWarning(state);
    }

    return state;
  }

  /**
   * Get the current rate limit state
   * @returns Current RateLimitState or null if not yet initialized
   */
  getState(): RateLimitState | null {
    return this.currentState;
  }

  /**
   * Check if we can make a request based on current rate limit
   * @returns true if a request can be made, false if rate limited
   */
  canMakeRequest(): boolean {
    if (!this.currentState) {
      // No rate limit info yet, assume we can make requests
      return true;
    }

    // If we have remaining requests, we can proceed
    if (this.currentState.remaining > 0) {
      return true;
    }

    // If no remaining requests, check if reset time has passed
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= this.currentState.reset;
  }

  /**
   * Get time until rate limit reset (in seconds)
   * @returns Seconds until reset, or 0 if already reset or no state
   */
  getTimeUntilReset(): number {
    if (!this.currentState) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilReset = this.currentState.reset - currentTime;

    return Math.max(0, timeUntilReset);
  }

  /**
   * Get reset time as a Date object
   * @returns Date object for reset time, or null if no state
   */
  getResetTime(): Date | null {
    if (!this.currentState) {
      return null;
    }

    return new Date(this.currentState.reset * 1000);
  }

  /**
   * Get percentage of remaining requests
   * @returns Percentage (0-100) of remaining requests, or 100 if no state
   */
  getRemainingPercentage(): number {
    if (!this.currentState || this.currentState.limit === 0) {
      return 100;
    }

    return (this.currentState.remaining / this.currentState.limit) * 100;
  }

  /**
   * Register a callback to be called when rate limit warning threshold is reached
   * @param callback - Function to call with current RateLimitState
   */
  onWarning(callback: (state: RateLimitState) => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Check if we should emit a warning based on current state
   * @param state - Current RateLimitState
   * @returns true if warning should be emitted
   */
  private shouldWarn(state: RateLimitState): boolean {
    if (state.limit === 0) {
      return false;
    }

    const percentage = state.remaining / state.limit;
    return percentage <= this.warningThreshold && percentage > 0;
  }

  /**
   * Emit a warning by calling the registered callback
   * @param state - Current RateLimitState
   */
  private emitWarning(state: RateLimitState): void {
    if (this.onWarningCallback) {
      this.onWarningCallback(state);
    }
  }

  /**
   * Extract and parse a header value as an integer
   * @param headers - Response headers
   * @param key - Header key to extract
   * @returns Parsed integer value or null if missing/invalid
   */
  private getHeaderValue(
    headers: Record<string, string | string[] | undefined>,
    key: string
  ): number | null {
    const value = headers[key] || headers[key.toLowerCase()];
    
    if (value === undefined) {
      return null;
    }

    // Handle string arrays (some HTTP libraries return arrays)
    const stringValue = Array.isArray(value) ? value[0] : value;
    
    if (!stringValue) {
      return null;
    }

    const parsed = parseInt(stringValue, 10);
    
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Reset the tracker state
   */
  reset(): void {
    this.currentState = null;
  }

  /**
   * Set a new warning threshold
   * @param threshold - New threshold (0-1, e.g., 0.2 = 20%)
   */
  setWarningThreshold(threshold: number): void {
    if (threshold >= 0 && threshold <= 1) {
      this.warningThreshold = threshold;
    }
  }
}

/**
 * Create a new RateLimitTracker instance
 * @param warningThreshold - Optional warning threshold (default: 0.2 = 20%)
 * @returns New RateLimitTracker instance
 */
export function createRateLimitTracker(warningThreshold?: number): RateLimitTracker {
  return new RateLimitTracker(warningThreshold);
}
