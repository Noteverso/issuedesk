/**
 * Zod validation schemas for GitHub App Authentication
 * Feature: 002-github-app-auth
 * 
 * These schemas validate data at runtime for type safety.
 */

import { z } from 'zod';

// ============================================================================
// User Schema
// ============================================================================

export const UserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1).max(39).regex(/^[a-zA-Z0-9-]+$/),
  name: z.string().min(1),
  avatar_url: z.string().url().startsWith('https://'),
  email: z.string().email().optional().nullable(),
});

// ============================================================================
// Account Schema
// ============================================================================

export const AccountSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1).max(39),
  type: z.enum(['User', 'Organization']),
  avatar_url: z.string().url().startsWith('https://'),
});

// ============================================================================
// Installation Schema
// ============================================================================

export const InstallationSchema = z.object({
  id: z.number().int().positive(),
  account: AccountSchema,
  repository_selection: z.enum(['all', 'selected']),
  permissions: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: 'Permissions must have at least one entry' }
  ),
});

// ============================================================================
// Installation Token Schema
// ============================================================================

export const InstallationTokenSchema = z.object({
  token: z.string().min(1),
  expires_at: z.string().datetime(),
  permissions: z.record(z.string(), z.string()),
  repository_selection: z.enum(['all', 'selected']),
});

// ============================================================================
// User Session Schema
// ============================================================================

export const UserSessionSchema = z.object({
  userToken: z.string().length(128), // 64 bytes = 128 hex chars
  user: UserSchema,
  installations: z.array(InstallationSchema),
  currentInstallation: InstallationSchema.nullable(),
  installationToken: InstallationTokenSchema.nullable(),
});

// ============================================================================
// Device Authorization Schema
// ============================================================================

export const DeviceAuthorizationSchema = z.object({
  device_code: z.string().min(1),
  user_code: z.string().length(9).regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/), // e.g., "ABCD-1234"
  verification_uri: z.string().url().startsWith('https://'),
  interval: z.number().int().positive(),
  expires_in: z.number().int().positive(),
});

// ============================================================================
// Backend Session Schema
// ============================================================================

export const BackendSessionSchema = z.object({
  sessionToken: z.string().length(128),
  userId: z.number().int().positive(),
  accessToken: z.string().min(1),
  createdAt: z.string().datetime(),
  lastAccessedAt: z.string().datetime(),
  installations: z.array(InstallationSchema),
});

// ============================================================================
// API Request/Response Schemas
// ============================================================================

/**
 * POST /auth/device response
 */
export const DeviceFlowResponseSchema = DeviceAuthorizationSchema;

/**
 * POST /auth/poll request
 */
export const PollRequestSchema = z.object({
  device_code: z.string().min(1),
});

/**
 * POST /auth/poll response (success)
 */
export const PollSuccessResponseSchema = z.object({
  session_token: z.string().length(128),
  user: UserSchema,
  installations: z.array(InstallationSchema),
});

/**
 * POST /auth/installations request (requires session token header)
 */
export const InstallationsRequestSchema = z.object({
  // No body - uses session token from header
});

/**
 * POST /auth/installation-token request
 */
export const InstallationTokenRequestSchema = z.object({
  installation_id: z.number().int().positive(),
});

/**
 * POST /auth/installation-token response
 */
export const InstallationTokenResponseSchema = InstallationTokenSchema;

/**
 * POST /auth/refresh-installation-token request
 */
export const RefreshTokenRequestSchema = z.object({
  installation_id: z.number().int().positive(),
});

/**
 * POST /auth/logout request (requires session token header)
 */
export const LogoutRequestSchema = z.object({
  // No body - uses session token from header
});

/**
 * Generic error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  retryable: z.boolean().optional(),
});
