/**
 * Example usage of RateLimitTracker
 * 
 * This demonstrates how to use the rate limit tracker with the GitHub API client
 */

import { GitHubClient, RateLimitTracker, createRateLimitTracker } from '@issuedesk/github-api';

// Example 1: Using the tracker standalone
function standaloneExample() {
  const tracker = createRateLimitTracker(0.2); // Warn at 20% remaining

  // Register a warning callback
  tracker.onWarning((state) => {
    console.warn('⚠️ Rate limit warning!');
    console.warn(`Remaining: ${state.remaining}/${state.limit}`);
    console.warn(`Resets at: ${new Date(state.reset * 1000)}`);
  });

  // Simulate updating from API response headers
  const mockHeaders = {
    'x-ratelimit-limit': '5000',
    'x-ratelimit-remaining': '800',  // 16% remaining - will trigger warning
    'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
  };

  const state = tracker.update(mockHeaders);
  
  if (state) {
    console.log(`Rate limit: ${state.remaining}/${state.limit}`);
    console.log(`Can make request: ${tracker.canMakeRequest()}`);
    console.log(`Time until reset: ${tracker.getTimeUntilReset()} seconds`);
    console.log(`Remaining percentage: ${tracker.getRemainingPercentage().toFixed(2)}%`);
  }
}

// Example 2: Using with GitHubClient
async function clientExample() {
  const token = process.env.GITHUB_TOKEN || 'your-token-here';
  const client = new GitHubClient(token);

  // Register rate limit warning handler
  client.onRateLimitWarning((state) => {
    console.warn('⚠️ GitHub API rate limit warning!');
    console.warn(`Remaining: ${state.remaining}/${state.limit}`);
    
    const resetTime = new Date(state.reset * 1000);
    console.warn(`Rate limit resets at: ${resetTime.toLocaleString()}`);
  });

  try {
    // Make a request - rate limit is automatically tracked
    const response = await client.getCurrentUser();
    
    if (response.success) {
      console.log('User data:', response.data);
      
      // Check rate limit state after request
      const rateLimitState = client.getRateLimitState();
      if (rateLimitState) {
        console.log('\nRate Limit Status:');
        console.log(`  Remaining: ${rateLimitState.remaining}/${rateLimitState.limit}`);
        console.log(`  Reset: ${new Date(rateLimitState.reset * 1000).toLocaleString()}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 3: Checking before making requests
async function checkBeforeRequestExample() {
  const token = process.env.GITHUB_TOKEN || 'your-token-here';
  const client = new GitHubClient(token);

  // Check if we can make a request
  if (!client.canMakeRequest()) {
    const state = client.getRateLimitState();
    if (state) {
      const resetTime = new Date(state.reset * 1000);
      console.error(`Rate limited! Resets at: ${resetTime.toLocaleString()}`);
      return;
    }
  }

  // Safe to make request
  const response = await client.getCurrentUser();
  console.log('Request successful:', response.success);
}

// Example 4: Parsing rate limit from any response headers
function parseHeadersExample() {
  const tracker = new RateLimitTracker();

  // Example headers from a GitHub API response
  const headers = {
    'X-RateLimit-Limit': '5000',
    'X-RateLimit-Remaining': '4999',
    'X-RateLimit-Reset': '1640000000',
    'X-RateLimit-Used': '1',
    'X-RateLimit-Resource': 'core',
  };

  const state = tracker.parseHeaders(headers);
  
  if (state) {
    console.log('Parsed rate limit state:', state);
    console.log('Can make request:', tracker.canMakeRequest());
  }
}

// Run examples
if (require.main === module) {
  console.log('=== Standalone Example ===');
  standaloneExample();
  
  console.log('\n=== Parse Headers Example ===');
  parseHeadersExample();
  
  // Uncomment to run examples that require a GitHub token:
  // console.log('\n=== Client Example ===');
  // clientExample();
  
  // console.log('\n=== Check Before Request Example ===');
  // checkBeforeRequestExample();
}

export {
  standaloneExample,
  clientExample,
  checkBeforeRequestExample,
  parseHeadersExample,
};
