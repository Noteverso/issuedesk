/**
 * User-friendly error messages for authentication errors
 * Feature: 002-github-app-auth
 * Task: T071 - Comprehensive error messages
 * 
 * Maps error codes to user-friendly messages with recovery suggestions.
 */

/**
 * Error code constants matching worker's ErrorCode enum
 */
export enum ErrorCode {
  // Configuration errors
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  
  // Request validation errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_SESSION_TOKEN = 'INVALID_SESSION_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // GitHub API errors
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  DEVICE_FLOW_ERROR = 'DEVICE_FLOW_ERROR',
  ACCESS_DENIED = 'ACCESS_DENIED',
  AUTHORIZATION_PENDING = 'AUTHORIZATION_PENDING',
  SLOW_DOWN = 'SLOW_DOWN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  
  // Rate limiting
  RATE_LIMIT = 'RATE_LIMIT',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * User-friendly error message with recovery suggestion
 */
export interface ErrorMessage {
  /** Short title for the error */
  title: string;
  
  /** Detailed explanation of what went wrong */
  message: string;
  
  /** Suggested action to recover */
  suggestion: string;
  
  /** Whether the operation can be retried */
  retryable: boolean;
  
  /** Optional link to documentation */
  learnMoreUrl?: string;
}

/**
 * User-friendly error messages for all error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // Configuration errors
  [ErrorCode.CONFIGURATION_ERROR]: {
    title: 'Configuration Error',
    message: 'The authentication service is not properly configured.',
    suggestion: 'Please contact support or check the application logs.',
    retryable: false,
  },
  
  // Request validation errors
  [ErrorCode.INVALID_REQUEST]: {
    title: 'Invalid Request',
    message: 'The request could not be processed due to invalid data.',
    suggestion: 'Please try again. If the problem persists, contact support.',
    retryable: false,
  },
  
  [ErrorCode.MISSING_PARAMETER]: {
    title: 'Missing Information',
    message: 'Required information is missing from your request.',
    suggestion: 'Please ensure all required fields are filled out.',
    retryable: false,
  },
  
  // Authentication errors
  [ErrorCode.UNAUTHORIZED]: {
    title: 'Authentication Required',
    message: 'You need to sign in to access this resource.',
    suggestion: 'Please sign in with your GitHub account and try again.',
    retryable: false,
  },
  
  [ErrorCode.INVALID_SESSION_TOKEN]: {
    title: 'Invalid Session',
    message: 'Your session token is invalid or malformed.',
    suggestion: 'Please sign out and sign in again.',
    retryable: false,
  },
  
  [ErrorCode.SESSION_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons.',
    suggestion: 'Please sign in again to continue.',
    retryable: false,
  },
  
  // GitHub API errors
  [ErrorCode.GITHUB_API_ERROR]: {
    title: 'GitHub Service Error',
    message: 'There was a problem communicating with GitHub.',
    suggestion: 'Please wait a moment and try again. Check GitHub status if the problem continues.',
    retryable: true,
    learnMoreUrl: 'https://www.githubstatus.com/',
  },
  
  [ErrorCode.DEVICE_FLOW_ERROR]: {
    title: 'Login Failed',
    message: 'There was a problem during the GitHub login process.',
    suggestion: 'Please try logging in again.',
    retryable: true,
  },
  
  [ErrorCode.ACCESS_DENIED]: {
    title: 'Access Denied',
    message: 'You denied access to the application on GitHub.',
    suggestion: 'To use this application, you need to authorize it on GitHub. Try logging in again.',
    retryable: false,
  },
  
  [ErrorCode.AUTHORIZATION_PENDING]: {
    title: 'Waiting for Authorization',
    message: 'Please complete the authorization on GitHub.',
    suggestion: 'Open GitHub in your browser and enter the device code shown.',
    retryable: true,
  },
  
  [ErrorCode.SLOW_DOWN]: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again.',
    suggestion: 'We\'re checking too frequently. Wait 10 seconds and try again.',
    retryable: true,
  },
  
  [ErrorCode.EXPIRED_TOKEN]: {
    title: 'Code Expired',
    message: 'Your device code has expired (15 minute limit).',
    suggestion: 'Click "Login with GitHub" to get a new code and try again.',
    retryable: false,
  },
  
  // Rate limiting
  [ErrorCode.RATE_LIMIT]: {
    title: 'Rate Limit Exceeded',
    message: 'You\'ve made too many requests in a short period.',
    suggestion: 'Please wait a few minutes before trying again.',
    retryable: true,
  },
  
  // Network errors
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Network Connection Error',
    message: 'Unable to connect to the authentication service.',
    suggestion: 'Check your internet connection and try again.',
    retryable: true,
  },
  
  [ErrorCode.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    suggestion: 'Check your internet connection and try again.',
    retryable: true,
  },
  
  // Generic errors
  [ErrorCode.INTERNAL_ERROR]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred on our end.',
    suggestion: 'Please try again. If the problem persists, contact support.',
    retryable: true,
  },
  
  [ErrorCode.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred.',
    suggestion: 'Please try again. If the problem persists, contact support.',
    retryable: false,
  },
};

/**
 * Get user-friendly error message for an error code
 * 
 * @param code - Error code
 * @param fallbackMessage - Optional fallback message if code not found
 * @returns User-friendly error message
 */
export function getErrorMessage(
  code: ErrorCode | string,
  fallbackMessage?: string
): ErrorMessage {
  const errorMessage = ERROR_MESSAGES[code as ErrorCode];
  
  if (errorMessage) {
    return errorMessage;
  }
  
  // Fallback for unknown error codes
  return {
    title: 'Error',
    message: fallbackMessage || 'An error occurred',
    suggestion: 'Please try again or contact support.',
    retryable: false,
  };
}

/**
 * Format error for display in UI
 * 
 * @param code - Error code
 * @param technicalMessage - Optional technical error message (shown in development)
 * @param showTechnical - Whether to include technical details (default: false)
 * @returns Formatted error string
 */
export function formatErrorForDisplay(
  code: ErrorCode | string,
  technicalMessage?: string,
  showTechnical: boolean = false
): string {
  const error = getErrorMessage(code);
  
  let display = `${error.title}: ${error.message}`;
  
  if (error.suggestion) {
    display += `\n\n${error.suggestion}`;
  }
  
  // Include technical message if requested
  if (technicalMessage && showTechnical) {
    display += `\n\nTechnical details: ${technicalMessage}`;
  }
  
  return display;
}
