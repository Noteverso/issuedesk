/**
 * Error handling utilities for Cloudflare Worker
 * Feature: 002-github-app-auth
 * 
 * Standardized error responses and error code mappings
 */

import { z } from 'zod';

/**
 * Standard error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  retryable: z.boolean().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Error codes used throughout the auth system
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
 * Create a standardized error response
 */
export function createErrorResponse(
  error: ErrorCode | string,
  message: string,
  retryable: boolean = false
): ErrorResponse {
  return {
    error,
    message,
    retryable,
  };
}

/**
 * Create a JSON Response with error
 */
export function errorResponse(
  error: ErrorCode | string,
  message: string,
  status: number = 400,
  retryable: boolean = false,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify(createErrorResponse(error, message, retryable)),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Map GitHub API errors to our error codes
 */
export function mapGitHubError(error: unknown): { code: ErrorCode; message: string; retryable: boolean } {
  // Handle GitHub API error response
  if (error && typeof error === 'object' && 'error' in error) {
    const githubError = error as { error: string; error_description?: string };
    
    switch (githubError.error) {
      case 'authorization_pending':
        return {
          code: ErrorCode.AUTHORIZATION_PENDING,
          message: 'User has not yet authorized the device',
          retryable: true,
        };
      
      case 'slow_down':
        return {
          code: ErrorCode.SLOW_DOWN,
          message: 'Polling too frequently. Please slow down.',
          retryable: true,
        };
      
      case 'expired_token':
        return {
          code: ErrorCode.EXPIRED_TOKEN,
          message: 'Device code has expired',
          retryable: false,
        };
      
      case 'access_denied':
        return {
          code: ErrorCode.ACCESS_DENIED,
          message: 'User denied access',
          retryable: false,
        };
      
      default:
        return {
          code: ErrorCode.GITHUB_API_ERROR,
          message: githubError.error_description || 'GitHub API error',
          retryable: false,
        };
    }
  }

  // Handle HTTP status errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    
    if (status === 429) {
      return {
        code: ErrorCode.RATE_LIMIT,
        message: 'Rate limit exceeded',
        retryable: true,
      };
    }
    
    if (status >= 500) {
      return {
        code: ErrorCode.GITHUB_API_ERROR,
        message: 'GitHub service unavailable',
        retryable: true,
      };
    }
  }

  // Handle network errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Network error connecting to GitHub',
        retryable: true,
      };
    }
  }

  // Default: unknown error
  return {
    code: ErrorCode.UNKNOWN,
    message: error instanceof Error ? error.message : 'Unknown error',
    retryable: false,
  };
}

/**
 * Validate request body against schema and return error response if invalid
 */
export function validateRequest<T>(
  body: unknown,
  schema: z.ZodSchema<T>,
  corsHeaders: Record<string, string> = {}
): { data: T } | Response {
  try {
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return errorResponse(
        ErrorCode.INVALID_REQUEST,
        `Invalid request: ${message}`,
        400,
        false,
        corsHeaders
      );
    }
    return errorResponse(
      ErrorCode.INVALID_REQUEST,
      'Invalid request body',
      400,
      false,
      corsHeaders
    );
  }
}
