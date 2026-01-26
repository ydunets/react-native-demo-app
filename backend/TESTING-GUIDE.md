# Testing Guide - Backend Server

## Quick Start

### Install dependencies
```bash
cd backend
npm install
```

### Run all tests
```bash
npm run test
```

### Output
```
 PASS  tests/controllers.test.ts
 PASS  tests/fileStorage.test.ts
 PASS  tests/auth.test.ts

Test Suites: 3 passed, 3 total
Tests:       82 passed, 82 total
```

---

## Available Test Commands

### `npm run test`
Runs all tests once and exits.

```bash
npm run test
# Output: 82 passed
```

### `npm run test:watch`
Runs tests in watch mode. Tests re-run when files change.

```bash
npm run test:watch
# Press 'q' to quit watch mode
```

### `npm run test:coverage`
Generates a coverage report showing code coverage percentage.

```bash
npm run test:coverage
# Creates coverage/ directory with HTML report
# Open: coverage/lcov-report/index.html
```

### `npm run test:controllers`
Runs only controller/route tests.

```bash
npm run test:controllers
# 20 tests from controllers.test.ts
```

### `npm run test:storage`
Runs only file storage module tests.

```bash
npm run test:storage
# 31 tests from fileStorage.test.ts
```

### `npm run test:auth`
Runs only authentication middleware tests.

```bash
npm run test:auth
# 31 tests from auth.test.ts
```

---

## Test Files Location

```
backend/
├── tests/
│   ├── controllers.test.ts      (20 tests - API endpoints)
│   ├── fileStorage.test.ts      (31 tests - File operations)
│   └── auth.test.ts             (31 tests - JWT authentication)
├── jest.config.js               (Jest configuration)
└── package.json                 (npm scripts)
```

---

## What's Being Tested

### Controllers (routes/files.ts)
- ✅ POST `/api/files/download` - Download file with JWT auth
- ✅ GET `/api/files/list` - List available files
- ✅ Error handling for missing auth, bad requests, file not found
- ✅ Base64 encoding of file content

### File Storage (storage/fileStorage.ts)
- ✅ `validateContentLength()` - Check file size limits
- ✅ `getFileMetadata()` - Get file info without reading
- ✅ `readFileFromStorage()` - Read file as buffer + Base64
- ✅ `listStorageFiles()` - List available files
- ✅ Security: Directory traversal prevention
- ✅ Concurrency: Handle multiple requests

### Authentication (middleware/auth.ts)
- ✅ JWT token validation
- ✅ Bearer token extraction
- ✅ User claims extraction
- ✅ Token expiration checking
- ✅ Error handling and error messages

---

## Example Test Scenarios

### Testing File Download
```typescript
it('should successfully download a file with valid token', async () => {
  const response = await request(app)
    .post('/api/files/download')
    .set('Authorization', `Bearer ${VALID_TOKEN}`)
    .send({ filename: 'sample-text.txt' });

  expect(response.status).toBe(200);
  expect(response.body.base64).toBeTruthy();
});
```

### Testing Authentication
```typescript
it('should return 401 when Authorization header is missing', async () => {
  const response = await request(app)
    .post('/api/files/download')
    .send({ filename: 'sample-text.txt' });

  expect(response.status).toBe(401);
});
```

### Testing Security
```typescript
it('should prevent directory traversal attacks', async () => {
  const response = await request(app)
    .post('/api/files/download')
    .set('Authorization', `Bearer ${VALID_TOKEN}`)
    .send({ filename: '../../etc/passwd' });

  expect(response.status).not.toBe(200);
});
```

---

## Coverage Metrics

Run coverage report to see detailed metrics:
```bash
npm run test:coverage
```

This generates:
- **Lines**: % of lines executed
- **Statements**: % of statements executed
- **Functions**: % of functions called
- **Branches**: % of conditional branches taken

Open the HTML report:
```bash
open coverage/lcov-report/index.html
```

---

## Debugging Tests

### Run single test file
```bash
npx jest tests/controllers.test.ts
```

### Run tests matching pattern
```bash
npx jest --testNamePattern="should download"
```

### Verbose output
```bash
npx jest --verbose
```

### Debug in Node inspector
```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand
```

---

## Common Issues

### Tests failing with "Cannot find module"
```bash
npm install
# Reinstall dependencies
```

### Watchman warnings
```bash
watchman watch-del '/path/to/project'
watchman watch-project '/path/to/project'
```

### TypeScript errors
```bash
npm run type-check
# Check for TypeScript compilation errors
```

---

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    cd backend
    npm install
    npm run test
```

### Pre-commit Hook
```bash
#!/bin/sh
npm run test || exit 1
```

---

## Test Data

### Sample Files (in `backend/files/`)
- `sample-text.txt` - Text file for testing
- `sample-data.json` - JSON file for testing
- `sample-pdf.pdf` - PDF file for testing

### Test JWT Tokens
Tests generate valid tokens with:
- Subject: `test-user-123`
- Email: `test@example.com`
- Expiration: 1 hour from test execution

---

## Performance

Typical test run times:
- Full suite: ~1 second
- Controllers: ~300ms
- File storage: ~400ms
- Authentication: ~300ms

---

## References

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Last Updated**: 2026-01-26  
**Test Framework**: Jest 29.x + Supertest  
**Node Version**: 20.x
