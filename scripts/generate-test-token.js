#!/usr/bin/env node

/**
 * Generate a test JWT token for backend API testing
 * 
 * Usage:
 *   node scripts/generate-test-token.js
 *   node scripts/generate-test-token.js --hours 1
 *   node scripts/generate-test-token.js --secret "my-secret"
 */

const jwt = require('jsonwebtoken');

// Default values
const DEFAULT_SECRET = 'your-test-secret-key-here';
const DEFAULT_HOURS = 2;

// Parse command line arguments
const args = process.argv.slice(2);
let secret = DEFAULT_SECRET;
let hours = DEFAULT_HOURS;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--secret' && args[i + 1]) {
    secret = args[i + 1];
    i++;
  } else if (args[i] === '--hours' && args[i + 1]) {
    hours = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Generate JWT test token for backend API testing

Usage: node generate-test-token.js [options]

Options:
  --secret <secret>    JWT secret (default: "your-test-secret-key-here")
  --hours <number>     Token validity in hours (default: 2)
  --help, -h           Show this help message

Examples:
  node generate-test-token.js
  node generate-test-token.js --hours 1
  node generate-test-token.js --secret "my-custom-secret"
  node generate-test-token.js --secret "my-secret" --hours 24

Environment:
  Set KEYCLOAK_PUBLIC_KEY in .env.backend to match the secret used here.
    `);
    process.exit(0);
  }
}

// Generate token
const now = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  {
    sub: `test-user-${Date.now()}`,
    email: 'test@example.local',
    name: 'Test User',
    preferred_username: 'testuser',
    given_name: 'Test',
    family_name: 'User',
    iat: now,
    exp: now + hours * 3600,
  },
  secret,
  { algorithm: 'HS256' }
);

// Output
console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    JWT TEST TOKEN GENERATED                    ║
╠════════════════════════════════════════════════════════════════╣
║ Valid for: ${hours} hour(s)                                    ${' '.repeat(39 - String(hours).length)}║
║ Algorithm: HS256                                               ║
║ Secret:    ${secret.substring(0, 48)}${secret.length > 48 ? '...' : ' '.repeat(51 - secret.length)}║
╠════════════════════════════════════════════════════════════════╣
║ TOKEN:                                                         ║
╚════════════════════════════════════════════════════════════════╝

${token}

═════════════════════════════════════════════════════════════════

📝 Use this token with curl:

curl http://localhost:3001/api/files/list \\
  -H "Authorization: Bearer ${token.substring(0, 20)}..."

📝 Or save to variable:

TOKEN="${token}"
curl http://localhost:3001/api/files/list \\
  -H "Authorization: Bearer \$TOKEN"

⚙️  Setup Instructions:

1. Update .env.backend:
   KEYCLOAK_PUBLIC_KEY=${secret}

2. Start backend:
   npm --prefix backend run dev

3. Test endpoint:
   curl http://localhost:3001/api/files/list \\
     -H "Authorization: Bearer ${token.substring(0, 40)}..."

✅ Token expires at: ${new Date((now + hours * 3600) * 1000).toISOString()}

`);
