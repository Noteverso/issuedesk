/**
 * Cloudflare Worker for IssueDesk GitHub App Authentication
 * Feature: 002-github-app-auth
 * 
 * This worker handles GitHub App device flow authentication and token management.
 * All sensitive credentials (private keys, client secrets) are stored as Worker secrets.
 */

import { handleDeviceFlow, handlePollDeviceFlow } from './handlers/device-flow';
import { handleInstallationToken, handleRefreshInstallationToken } from './handlers/tokens';
import { handleRefreshInstallations } from './handlers/installations';
import type { WorkerEnv } from '@issuedesk/shared';

export default {
  async fetch(request: Request, env: WorkerEnv, _ctx: ExecutionContext): Promise<Response> {
    // T034: Validate environment variables on startup (FR-030)
    const missingVars = [];
    if (!env.GITHUB_APP_ID) missingVars.push('GITHUB_APP_ID');
    if (!env.GITHUB_PRIVATE_KEY) missingVars.push('GITHUB_PRIVATE_KEY');
    if (!env.GITHUB_CLIENT_ID) missingVars.push('GITHUB_CLIENT_ID');
    if (!env.GITHUB_CLIENT_SECRET) missingVars.push('GITHUB_CLIENT_SECRET');
    
    if (missingVars.length > 0) {
      console.error('[Config] Missing environment variables:', missingVars.join(', '));
      return new Response(
        JSON.stringify({ 
          error: 'CONFIGURATION_ERROR', 
          message: `Missing required environment variables: ${missingVars.join(', ')}. Set via wrangler secret put.`,
          missing: missingVars
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate private key format (accepts both PKCS8 and PKCS1)
    const hasPKCS8 = env.GITHUB_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');
    const hasPKCS1 = env.GITHUB_PRIVATE_KEY.includes('BEGIN RSA PRIVATE KEY');
    
    if (!hasPKCS8 && !hasPKCS1) {
      console.error('[Config] Invalid GITHUB_PRIVATE_KEY format - must be PEM format');
      return new Response(
        JSON.stringify({ 
          error: 'CONFIGURATION_ERROR', 
          message: 'GITHUB_PRIVATE_KEY must be in PEM format (BEGIN PRIVATE KEY or BEGIN RSA PRIVATE KEY). See PRIVATE-KEY-CONVERSION.md'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('[Config] Environment validation passed - all secrets configured');

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
    
    if (url.pathname === '/auth/installation-token' && request.method === 'POST') {
      return handleInstallationToken(request, env, corsHeaders);
    }
    
    if (url.pathname === '/auth/installations' && request.method === 'POST') {
      return handleRefreshInstallations(request, env, corsHeaders);
    }
    
    if (url.pathname === '/auth/refresh-installation-token' && request.method === 'POST') {
      return handleRefreshInstallationToken(request, env, corsHeaders);
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
