# Testing the Backend File Server with JWT Tokens

## Option 1: Get Token from Your Keycloak Instance (Recommended)

If you have Keycloak running via `docker-compose up`, you can get a real token:

```bash
# 1. Check if Keycloak is running
curl http://localhost:8080/auth/realms/master

# 2. Get a token (assumes default Keycloak admin credentials)
# Replace REALM, CLIENT_ID, USERNAME, PASSWORD with your values
curl -X POST http://localhost:8080/auth/realms/REALM/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=CLIENT_ID" \
  -d "username=USERNAME" \
  -d "password=PASSWORD" \
  -d "grant_type=password" \
  -d "client_secret=CLIENT_SECRET"

# Response example:
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC..." (THIS IS YOUR TOKEN),
#   "expires_in": 300,
#   "token_type": "Bearer"
# }
```

## Option 2: Create a Test Token Manually (for development)

You can create a test JWT token manually using Node.js:

```bash
node -e "
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Generate a test token (use any secret for testing)
const token = jwt.sign(
  {
    sub: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    preferred_username: 'testuser',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour from now
  },
  'your-test-secret', // Use this as KEYCLOAK_PUBLIC_KEY in .env.backend for testing
  { algorithm: 'HS256' }
);

console.log(token);
"
```

## Option 3: Use a Pre-Generated Test Token

Here's a simple test token (expires in 1 hour from generation):

```bash
# Generate and save a token to a file
node << 'EOF'
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: 'test-user-' + Date.now(),
    email: 'dev@test.local',
    name: 'Development User',
    preferred_username: 'devtest',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  },
  'dev-test-secret-key',
  { algorithm: 'HS256' }
);

console.log('\n📋 TEST TOKEN:');
console.log(token);
console.log('\n✅ Valid for 1 hour from now');
EOF
```

## Testing the Endpoints

### 1. Test Health Check (No Auth Required)
```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-26T...",
  "environment": "development"
}
```

### 2. List Available Files (Requires Auth)
```bash
# Replace YOUR_TOKEN with actual token
curl http://localhost:3001/api/files/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "files": ["sample-pdf.pdf", "sample-text.txt", "sample-data.json"],
  "count": 3
}
```

### 3. Download a File (Requires Auth)
```bash
curl -X POST http://localhost:3001/api/files/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"sample-pdf.pdf"}'
```

**Expected Response:**
```json
{
  "filename": "sample-pdf.pdf",
  "size": 247,
  "contentLength": 247,
  "base64": "U2FtcGxlIFBERiBEb2N1bWVudA..."
}
```

## Setup for Local Testing

### Step 1: Configure Backend for Testing

Edit `.env.backend` to use a simple test secret:

```bash
# For HS256 (symmetric key - good for testing)
KEYCLOAK_PUBLIC_KEY=your-test-secret-key-here

# OR for RS256 (asymmetric - use Keycloak's actual public key)
KEYCLOAK_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
```

### Step 2: Start Backend
```bash
npm --prefix backend run dev
```

You should see:
```
File Server Started Successfully
Port: 3001
```

### Step 3: Generate Test Token

Using the manual generation approach from Option 2:

```bash
cd /Users/yurydunets/Documents/education/expo-app-presentation
node << 'EOF'
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: 'test-dev-user',
    email: 'test@example.com',
    name: 'Test Developer',
    preferred_username: 'testdev',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7200  // 2 hours
  },
  'your-test-secret-key-here',  // Must match KEYCLOAK_PUBLIC_KEY in .env.backend
  { algorithm: 'HS256' }
);

console.log('\n✅ Test Token (valid for 2 hours):');
console.log(token);
console.log('\n📝 Use with:');
console.log(`curl http://localhost:3001/api/files/list \\`);
console.log(`  -H "Authorization: Bearer ${token}"`);
EOF
```

### Step 4: Test with Token

```bash
# Save token to variable
TOKEN=$(node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({sub: 'test', email: 'test@example.com', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600}, 'your-test-secret-key-here', { algorithm: 'HS256' }))")

# Test endpoint
curl http://localhost:3001/api/files/list \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Error: "KEYCLOAK_PUBLIC_KEY not configured"

**Solution**: Update `.env.backend` with a test secret:
```bash
KEYCLOAK_PUBLIC_KEY=your-test-secret-key-here
```

Then restart the backend:
```bash
npm --prefix backend run dev
```

### Error: "Unauthorized - Invalid token signature"

**Cause**: The token was signed with a different secret than what's in `KEYCLOAK_PUBLIC_KEY`

**Solution**: Make sure the secret used to generate the token matches the one in `.env.backend`

### Error: "Token has expired"

**Cause**: The token's `exp` claim is in the past

**Solution**: Generate a new token with `exp: Math.floor(Date.now() / 1000) + 3600` (1 hour from now)

## Production Setup

For production, configure real Keycloak:

1. Get your Keycloak public key:
```bash
curl http://keycloak-server/auth/realms/YOUR_REALM/protocol/openid-connect/certs
```

2. Extract and format the public key from the JWK

3. Set in `.env.backend`:
```bash
KEYCLOAK_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----
```

## Quick Reference

| Scenario | Solution |
|----------|----------|
| Local testing, no Keycloak | Use HS256 with test secret |
| Local with Keycloak running | Get token from Keycloak endpoint |
| Production | Use Keycloak RS256 public key |
| Token expired | Generate new token with future `exp` |
| Wrong secret error | Ensure token secret matches KEYCLOAK_PUBLIC_KEY |
