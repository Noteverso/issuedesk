/**
 * Security event logging utility
 * Feature: 002-github-app-auth
 * Task: T038 - Security event logging (FR-012)
 * 
 * Logs critical security events for audit purposes.
 * Events include authentication attempts, token generation, and failures.
 */

export enum SecurityEventType {
  AUTH_ATTEMPT = 'AUTH_ATTEMPT',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  TOKEN_GENERATED = 'TOKEN_GENERATED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSTALLATION_SELECTED = 'INSTALLATION_SELECTED',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_HIT = 'RATE_LIMIT_HIT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  userId?: number;
  installationId?: number;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/**
 * Log a security event to console.
 * In production, this could be extended to send to external logging service.
 * 
 * @param event - Security event to log
 */
export function logSecurityEvent(event: SecurityEvent): void {
  const logEntry = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  // Format for structured logging
  const formatted = `[Security] ${logEntry.type} | User: ${logEntry.userId || 'N/A'} | ${JSON.stringify(logEntry.details || {})}`;
  
  // Log based on event severity
  switch (event.type) {
    case SecurityEventType.AUTH_FAILURE:
    case SecurityEventType.RATE_LIMIT_HIT:
    case SecurityEventType.INVALID_REQUEST:
    case SecurityEventType.CONFIGURATION_ERROR:
      console.error(formatted);
      break;
    
    case SecurityEventType.TOKEN_EXPIRED:
    case SecurityEventType.SESSION_EXPIRED:
      console.warn(formatted);
      break;
    
    default:
      console.log(formatted);
      break;
  }

  // TODO: In production, send to external logging service (e.g., Cloudflare Logs, Sentry)
  // await sendToLogService(logEntry);
}

/**
 * Helper to create authentication attempt event.
 */
export function logAuthAttempt(userId?: number, details?: Record<string, unknown>): void {
  const event: SecurityEvent = {
    type: SecurityEventType.AUTH_ATTEMPT,
    timestamp: new Date().toISOString(),
  };
  if (userId !== undefined) event.userId = userId;
  if (details !== undefined) event.details = details;
  logSecurityEvent(event);
}

/**
 * Helper to log successful authentication.
 */
export function logAuthSuccess(userId: number, installationId?: number): void {
  const event: SecurityEvent = {
    type: SecurityEventType.AUTH_SUCCESS,
    timestamp: new Date().toISOString(),
    userId,
  };
  if (installationId !== undefined) event.installationId = installationId;
  logSecurityEvent(event);
}

/**
 * Helper to log authentication failure.
 */
export function logAuthFailure(reason: string, userId?: number, details?: Record<string, unknown>): void {
  const event: SecurityEvent = {
    type: SecurityEventType.AUTH_FAILURE,
    timestamp: new Date().toISOString(),
    details: { reason, ...details },
  };
  if (userId !== undefined) event.userId = userId;
  logSecurityEvent(event);
}

/**
 * Helper to log token generation.
 */
export function logTokenGenerated(userId: number, installationId: number): void {
  logSecurityEvent({
    type: SecurityEventType.TOKEN_GENERATED,
    timestamp: new Date().toISOString(),
    userId,
    installationId,
  });
}

/**
 * Helper to log token refresh.
 */
export function logTokenRefreshed(userId: number, installationId: number): void {
  logSecurityEvent({
    type: SecurityEventType.TOKEN_REFRESHED,
    timestamp: new Date().toISOString(),
    userId,
    installationId,
  });
}

/**
 * Helper to log rate limit hit.
 */
export function logRateLimitHit(userId: number, endpoint: string): void {
  logSecurityEvent({
    type: SecurityEventType.RATE_LIMIT_HIT,
    timestamp: new Date().toISOString(),
    userId,
    details: { endpoint },
  });
}

/**
 * Helper to log invalid request.
 */
export function logInvalidRequest(reason: string, details?: Record<string, unknown>): void {
  logSecurityEvent({
    type: SecurityEventType.INVALID_REQUEST,
    timestamp: new Date().toISOString(),
    details: { reason, ...details },
  });
}

/**
 * Helper to log configuration error.
 */
export function logConfigurationError(error: string): void {
  logSecurityEvent({
    type: SecurityEventType.CONFIGURATION_ERROR,
    timestamp: new Date().toISOString(),
    details: { error },
  });
}
