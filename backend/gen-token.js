const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.backend
dotenv.config({ path: path.resolve(__dirname, '../.env.backend') });

const secret = process.env.JWT_SECRET || 'dev-secret-key';
const hours = 2;
const now = Math.floor(Date.now() / 1000);

const token = jwt.sign(
  {
    sub: 'test-user-' + Date.now(),
    email: 'test@example.local',
    name: 'Test Developer',
    preferred_username: 'testdev',
    iat: now,
    exp: now + hours * 3600,
  },
  secret,
  { algorithm: 'HS256' }
);

// Check if we're being piped (for scripts)
const isPiped = !process.stdout.isTTY;

if (isPiped) {
  // Just output the token for piping to other commands
  console.log(token);
} else {
  // Pretty output for interactive terminal
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        TEST JWT TOKEN - Valid for 2 hours                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(token);
  console.log('\n');
}
