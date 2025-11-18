/**
 * GitHub API response types
 * 
 * These types represent the raw response structures from GitHub's REST API.
 * They should match GitHub's API documentation exactly.
 */

// ============================================================================
// Device Flow Responses
// ============================================================================

/**
 * GitHub Device Flow polling response.
 * 
 * This is the raw response from POST https://github.com/login/oauth/access_token
 * when polling for device authorization completion.
 * 
 * Success response includes access_token and optional refresh_token.
 * Error responses include error code and optional description.
 * 
 * @see https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#response-3
 */
export type GitHubDeviceFlowResponse = 
  | {
      /** OAuth access token (on success) */
      access_token: string;
      /** Token type - always "bearer" for GitHub */
      token_type: 'bearer';
      /** Granted scope (empty string for GitHub Apps with device flow) */
      scope: string;
      /** Token expiration time in seconds (optional, only if token expires) */
      expires_in?: number;
      /** Refresh token for obtaining new access token (optional, only if refresh is enabled) */
      refresh_token?: string;
      /** Refresh token expiration time in seconds (optional, only with refresh_token) */
      refresh_token_expires_in?: number;
    }
  | {
      /** Error code indicating the current state */
      error: 'authorization_pending' | 'slow_down' | 'expired_token' | 'access_denied';
      /** Human-readable error description */
      error_description?: string;
      /** URI with more information about the error */
      error_uri?: string;
      /** Polling interval in seconds (returned with slow_down error) */
      interval?: number;
    };
