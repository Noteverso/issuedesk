/**
 * Cloudflare Worker for IssueDesk GitHub App Authentication
 * Feature: 002-github-app-auth
 * 
 * This worker handles GitHub App device flow authentication and token management.
 * All sensitive credentials (private keys, client secrets) are stored as Worker secrets.
 */

import { handleDeviceFlow, handlePollDeviceFlow } from './handlers/device-flow';

export interface Env {
  // KV namespace for session storage
  SESSIONS: KVNamespace;
  
  // GitHub App credentials (set via wrangler secret)
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // Validate environment variables on startup
    if (!env.GITHUB_APP_ID || !env.GITHUB_PRIVATE_KEY || !env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'CONFIGURATION_ERROR', message: 'Missing required environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CORS headers for Electron app
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'electron://issuedesk',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    
    // Route handlers for device flow
    if (url.pathname === '/auth/device' && request.method === 'POST') {
      return handleDeviceFlow(request, env, corsHeaders);
    }
    
    if (url.pathname === '/auth/poll' && request.method === 'POST') {
      return handlePollDeviceFlow(request, env, corsHeaders);
    }

    // 404 for unimplemented routes
    return new Response(
      JSON.stringify({ error: 'NOT_FOUND', message: 'Endpoint not found' }),
      { 
        status: 404, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  },
};
