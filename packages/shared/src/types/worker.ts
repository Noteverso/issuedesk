/**
 * Cloudflare Worker Environment Types
 * Feature: 002-github-app-auth
 */


/**
 * Environment variables and bindings for the auth worker
 */
export interface WorkerEnv {
  // KV namespace for session storage
  SESSIONS: KVNamespace;
  
  // GitHub App credentials (set via wrangler secret)
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}
