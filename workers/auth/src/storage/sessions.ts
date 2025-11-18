/**
 * Cloudflare KV session storage
 * Feature: 002-github-app-auth
 * 
 * Manages backend session data with 30-day TTL and sliding window expiration.
 */

import type { Env } from '../index';
import type { BackendSession, Installation } from '@issuedesk/shared';

const SESSION_TTL_DAYS = 30;
const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60; // 30 days in seconds

/**
 * Generate a cryptographically secure session token (64 bytes = 128 hex chars).
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new backend session in KV storage.
 * 
 * @param userId - GitHub user ID
 * @param accessToken - GitHub OAuth access token
 * @param installations - User's GitHub App installations
 * @param env - Cloudflare Worker environment
 * @returns Session token (64 bytes = 128 hex chars)
 */
export async function createSession(
  userId: number,
  accessToken: string,
  installations: Installation[],
  env: Env
): Promise<string> {
  const sessionToken = generateSessionToken();
  const now = new Date().toISOString();

  const session: BackendSession = {
    sessionToken,
    userId,
    accessToken,
    createdAt: now,
    lastAccessedAt: now,
    installations,
  };

  // Store in KV with 30-day TTL
  const kvKey = `session:${sessionToken}`;
  await env.SESSIONS.put(
    kvKey,
    JSON.stringify(session),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  return sessionToken;
}

/**
 * Get session from KV storage by session token.
 * Updates lastAccessedAt for sliding window expiration.
 * 
 * @param sessionToken - Session token to retrieve
 * @param env - Cloudflare Worker environment
 * @returns Session data or null if not found/expired
 */
export async function getSession(
  sessionToken: string,
  env: Env
): Promise<BackendSession | null> {
  const kvKey = `session:${sessionToken}`;
  const sessionData = await env.SESSIONS.get(kvKey, 'json');

  if (!sessionData) {
    return null;
  }

  const session = sessionData as BackendSession;

  // Update lastAccessedAt for sliding window expiration
  session.lastAccessedAt = new Date().toISOString();
  await env.SESSIONS.put(
    kvKey,
    JSON.stringify(session),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  return session;
}

/**
 * Update session installations (cache refresh).
 * 
 * @param sessionToken - Session token to update
 * @param installations - Updated installations list
 * @param env - Cloudflare Worker environment
 */
export async function updateSessionInstallations(
  sessionToken: string,
  installations: Installation[],
  env: Env
): Promise<void> {
  const session = await getSession(sessionToken, env);
  if (!session) {
    throw new Error('Session not found');
  }

  session.installations = installations;
  session.lastAccessedAt = new Date().toISOString();

  const kvKey = `session:${sessionToken}`;
  await env.SESSIONS.put(
    kvKey,
    JSON.stringify(session),
    { expirationTtl: SESSION_TTL_SECONDS }
  );
}

/**
 * Delete session from KV storage (logout).
 * 
 * @param sessionToken - Session token to delete
 * @param env - Cloudflare Worker environment
 */
export async function deleteSession(
  sessionToken: string,
  env: Env
): Promise<void> {
  const kvKey = `session:${sessionToken}`;
  await env.SESSIONS.delete(kvKey);
}

/**
 * Validate session token format (64 bytes = 128 hex chars).
 * 
 * @param sessionToken - Token to validate
 * @returns True if valid format
 */
export function isValidSessionTokenFormat(sessionToken: string): boolean {
  return /^[0-9a-f]{128}$/i.test(sessionToken);
}
