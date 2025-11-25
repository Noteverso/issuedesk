/**
 * Shared types for GitHub App Authentication
 * Feature: 002-github-app-auth
 * 
 * These types are shared between desktop app and backend worker.
 */

// ============================================================================
// User Session (Client-Side Storage)
// ============================================================================

/**
 * User session stored in Electron app using electron-store with encryption.
 * Contains all data needed to maintain authenticated state.
 */
export interface UserSession {
  /** Backend session token for re-authentication (64 bytes = 128 hex chars) */
  userToken: string;
  
  /** GitHub user profile information */
  user: User;
  
  /** Available installations (from backend session) */
  installations: Installation[];
  
  /** Currently selected installation (null if none selected) */
  currentInstallation: Installation | null;
  
  /** Current installation access token (null if no installation selected) */
  installationToken: InstallationToken | null;
}

// ============================================================================
// User
// ============================================================================

/**
 * GitHub user profile information.
 * Source: GitHub API /user endpoint
 */
export interface User {
  /** GitHub user ID */
  id: number;
  
  /** GitHub username (1-39 chars, alphanumeric + hyphen) */
  login: string;
  
  /** User's display name */
  name: string;
  
  /** User's avatar image URL (HTTPS) */
  avatar_url: string;
  
  /** User's primary email (if public, optional) */
  email?: string | null;
}

// ============================================================================
// Installation
// ============================================================================

/**
 * GitHub App installation on a user's account or organization.
 * Source: GitHub API /user/installations endpoint
 */
export interface Installation {
  /** Installation ID */
  id: number;
  
  /** Account where app is installed */
  account: Account;
  
  /** Repository access scope */
  repository_selection: 'all' | 'selected';
  
  /** Granted permissions (e.g., { issues: 'write', contents: 'read' }) */
  permissions: Record<string, string>;
}

// ============================================================================
// Account
// ============================================================================

/**
 * GitHub account (user or organization) where app is installed.
 */
export interface Account {
  /** Account ID */
  id: number;
  
  /** Account login name */
  login: string;
  
  /** Account type */
  type: 'User' | 'Organization';
  
  /** Account avatar URL */
  avatar_url: string;
}

// ============================================================================
// Installation Token
// ============================================================================

/**
 * Short-lived access token for a specific installation.
 * Valid for 1 hour, needs refresh.
 */
export interface InstallationToken {
  /** Access token for GitHub API calls */
  token: string;
  
  /** Token expiration timestamp (ISO 8601) */
  expires_at: string;
  
  /** Granted permissions for this token */
  permissions: Record<string, string>;
  
  /** Repository access scope */
  repository_selection: 'all' | 'selected';
}

// ============================================================================
// Device Authorization (Temporary)
// ============================================================================

/**
 * Device flow authorization data.
 * Used during authentication flow, not persisted.
 */
export interface DeviceAuthorization {
  /** Unique device code for polling */
  device_code: string;
  
  /** 8-character user-friendly code (e.g., "ABCD-1234") */
  user_code: string;
  
  /** GitHub authorization page URL */
  verification_uri: string;
  
  /** Polling interval in seconds (typically 5) */
  interval: number;
  
  /** Seconds until code expires (typically 900 = 15 min) */
  expires_in: number;
}

// ============================================================================
// Backend Session (KV Storage)
// ============================================================================

/**
 * Session data stored in Cloudflare KV.
 * Contains minimal data needed for backend token exchange.
 */
export interface BackendSession {
  /** Session token (64 bytes = 128 hex chars) */
  sessionToken: string;
  
  /** GitHub user ID */
  userId: number;
  
  /** GitHub OAuth access token */
  accessToken: string;
  
  /** Session creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** Last access timestamp for sliding window expiration (ISO 8601) */
  lastAccessedAt: string;
  
  /** Available installations (cached from GitHub) */
  installations: Installation[];
}