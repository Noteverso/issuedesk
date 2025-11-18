/**
 * GitHub App JWT generator using Web Crypto API
 * Feature: 002-github-app-auth
 * 
 * Generates JWTs for GitHub App authentication.
 * GitHub requires RS256 algorithm (RSA + SHA-256).
 */

import type { Env } from '../index';

/**
 * Generate a GitHub App JWT for API authentication.
 * 
 * GitHub App JWT claims:
 * - iat: Issued at time (current time)
 * - exp: Expiration time (iat + 10 minutes, max allowed)
 * - iss: GitHub App ID
 * 
 * @param env - Cloudflare Worker environment with GITHUB_APP_ID and GITHUB_PRIVATE_KEY
 * @returns JWT string
 */
export async function generateGitHubAppJWT(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  // JWT claims
  const payload = {
    iat: now,
    exp: now + 600, // Expire in 10 minutes (GitHub max)
    iss: env.GITHUB_APP_ID,
  };

  // Create JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // Base64url encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  // Import RSA private key
  const privateKey = await importPrivateKey(env.GITHUB_PRIVATE_KEY);

  // Sign with RS256 (RSASSA-PKCS1-v1_5 + SHA-256)
  const signature = await signMessage(message, privateKey);

  // Return complete JWT
  return `${message}.${signature}`;
}

/**
 * Import RSA private key from PEM format
 */
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM header/footer and whitespace
  let pemContents = pemKey
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '') // Remove escaped newlines
    .replace(/\n/g, '')  // Remove actual newlines
    .replace(/\r/g, '')  // Remove carriage returns
    .replace(/\s/g, ''); // Remove all whitespace

  // Decode base64
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  // Try PKCS8 format first (most common from GitHub)
  try {
    return await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );
  } catch (pkcs8Error) {
    // If PKCS8 fails, the key might be in PKCS1 format
    // PKCS1 is not directly supported by WebCrypto, so this will fail
    console.error('Failed to import key as PKCS8:', pkcs8Error);
    throw new Error('Private key must be in PKCS8 format. Convert with: openssl pkcs8 -topk8 -nocrypt -in private-key.pem -out private-key-pkcs8.pem');
  }
}

/**
 * Sign message with RSA private key (RS256)
 */
async function signMessage(message: string, privateKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    data
  );

  return base64urlEncode(signature);
}

/**
 * Base64url encode (RFC 4648)
 */
function base64urlEncode(input: string | ArrayBuffer): string {
  let base64: string;
  
  if (typeof input === 'string') {
    base64 = btoa(input);
  } else {
    // Convert ArrayBuffer to base64
    const uint8Array = new Uint8Array(input);
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
    base64 = btoa(binaryString);
  }

  // Convert base64 to base64url
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Verify that private key is valid by attempting to generate a JWT
 */
export async function validatePrivateKey(env: Env): Promise<boolean> {
  try {
    await generateGitHubAppJWT(env);
    return true;
  } catch {
    return false;
  }
}
