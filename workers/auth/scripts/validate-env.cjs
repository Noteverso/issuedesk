#!/usr/bin/env node

/**
 * Validate .dev.vars configuration
 * Run: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

const DEV_VARS_PATH = path.join(__dirname, '..', '.dev.vars');

console.log('🔍 Validating Worker environment variables...\n');

// Check if .dev.vars exists
if (!fs.existsSync(DEV_VARS_PATH)) {
  console.error('❌ .dev.vars file not found!');
  console.error('   Create it by copying .dev.vars.example or following ENV_SETUP.md\n');
  process.exit(1);
}

// Read and parse .dev.vars
const content = fs.readFileSync(DEV_VARS_PATH, 'utf-8');
const lines = content.split('\n');
const vars = {};

lines.forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

// Required variables
const required = [
  'GITHUB_APP_ID',
  'GITHUB_PRIVATE_KEY',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET'
];

let hasErrors = false;

// Check each required variable
required.forEach(varName => {
  const value = vars[varName];
  
  if (!value || value.includes('your_') || value.includes('YOUR_')) {
    console.error(`❌ ${varName}: Not configured (contains placeholder)`);
    hasErrors = true;
  } else if (varName === 'GITHUB_PRIVATE_KEY') {
    // Validate private key format
    if (!value.includes('BEGIN') || !value.includes('END')) {
      console.error(`❌ ${varName}: Invalid format (must be PEM format)`);
      hasErrors = true;
    } else if (!value.includes('\\n')) {
      console.warn(`⚠️  ${varName}: Missing \\n escape sequences (may cause issues)`);
    } else {
      console.log(`✅ ${varName}: Configured (${value.length} chars)`);
    }
  } else if (varName === 'GITHUB_CLIENT_ID') {
    if (!value.startsWith('Iv')) {
      console.warn(`⚠️  ${varName}: Doesn't start with 'Iv' (unusual for OAuth Client ID)`);
    }
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

console.log();

if (hasErrors) {
  console.error('❌ Configuration has errors. Please fix them before running the worker.');
  console.error('   See ENV_SETUP.md for detailed setup instructions.\n');
  process.exit(1);
} else {
  console.log('✅ All environment variables are configured!\n');
  console.log('   Start the worker with: pnpm --filter @issuedesk/auth-worker dev\n');
  process.exit(0);
}
