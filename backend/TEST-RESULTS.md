# Server Controllers Test Suite

## Overview
Comprehensive test suite for the attachment download queue backend server with Express.js, JWT authentication, and file storage.

**Status**: ✅ **82/82 tests passing**

---

## Test Suite Breakdown

### 1. Controllers Tests (`tests/controllers.test.ts`)
**Purpose**: Integration tests for Express routes and endpoints

**Coverage**: 20 tests
- ✅ POST `/api/files/download` endpoint
  - Successfully download files with valid JWT token
  - Validate authentication headers
  - Validate request body parameters
  - Handle directory traversal attacks
  - Support various file types
  - Include user info in logs
  
- ✅ GET `/api/files/list` endpoint
  - List available files with authentication
  - Validate count matches array length
  - Handle missing tokens

- ✅ Authentication Middleware integration
  - Extract user claims from tokens
  - Handle malformed tokens
  - Handle empty Bearer tokens

- ✅ Server health check endpoint
  - Respond without authentication

- ✅ Error handling
  - 404 for undefined routes
  - JSON error responses
  - Consistent error format
  - Base64 encoding validation

---

### 2. File Storage Module Tests (`tests/fileStorage.test.ts`)
**Purpose**: Unit tests for file system operations and validation

**Coverage**: 31 tests

**Validation Tests**:
- ✅ `validateContentLength()` function
  - Accept valid file sizes
  - Reject files exceeding 50MB limit
  - Reject zero/negative sizes
  - Reject non-integer sizes
  - Provide helpful error messages

**File Metadata Tests**:
- ✅ `getFileMetadata()` function
  - Return null for non-existent files
  - Return correct metadata for existing files
  - Prevent directory traversal attacks (`../../../etc/passwd`)
  - Prevent absolute path attacks (`/etc/passwd`)
  - Return correct file size and timestamps

**File Reading Tests**:
- ✅ `readFileFromStorage()` function
  - Read existing files and return Base64
  - Throw 404 for non-existent files
  - Throw 413 for oversized files
  - Prevent directory traversal
  - Return valid Base64 content
  - Handle various file types (txt, json, pdf)
  - Return both buffer and Base64 in response

**File Listing Tests**:
- ✅ `listStorageFiles()` function
  - Return array of filenames
  - Only return files (not directories)
  - Handle empty storage directories
  - Include sample test files

**Security Tests**:
- ✅ Path traversal prevention
  - Block `..` sequences
  - Block absolute paths
  - Block special characters safely

**Concurrency Tests**:
- ✅ Handle multiple concurrent read requests
- ✅ Handle concurrent metadata requests

**Error Handling Tests**:
- ✅ Graceful error handling
- ✅ Meaningful error messages

---

### 3. Authentication Middleware Tests (`tests/auth.test.ts`)
**Purpose**: Unit tests for JWT authentication middleware

**Coverage**: 31 tests

**Valid Token Handling**:
- ✅ Extract user claims from valid tokens
- ✅ Call `next()` on successful authentication
- ✅ Extract all available user claims
- ✅ Include token timestamps (iat, exp)

**Authorization Header Validation**:
- ✅ Return 401 when header is missing
- ✅ Return 401 when header is empty
- ✅ Return 401 when Bearer prefix is missing
- ✅ Return 401 when Bearer token is empty
- ✅ Reject Bearer with wrong case

**Token Validation**:
- ✅ Reject malformed JWT tokens
- ✅ Reject tokens with wrong signature
- ✅ Reject incomplete JWTs
- ✅ Reject random strings as tokens

**Expiration Handling**:
- ✅ Return 401 for expired tokens
- ✅ Accept tokens not yet expired
- ✅ Include expiration info in error messages

**Claims Extraction**:
- ✅ Handle missing optional claims
- ✅ Fallback to `jti` for `sub` claim
- ✅ Include token timestamps

**Configuration**:
- ✅ Return 500 when `KEYCLOAK_PUBLIC_KEY` is not set

**HTTP Methods**:
- ✅ Work with any HTTP method

**Error Format**:
- ✅ Return consistent error structure
- ✅ Don't expose sensitive information

---

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test suite
```bash
npm run test:controllers
npm run test:storage
npm run test:auth
```

### Generate coverage report
```bash
npm run test:coverage
```

---

## Test Architecture

### Setup
- **Framework**: Jest with Supertest for HTTP testing
- **TypeScript**: ts-jest preset for TS transpilation
- **Test Environment**: Node.js
- **Mocking**: Jest mocks for Express Request/Response objects

### Best Practices
- ✅ Isolated test suites (each describes a unit/feature)
- ✅ Setup/teardown with `beforeEach` for clean state
- ✅ Mock dependencies (Request, Response, Next)
- ✅ Test both success and error paths
- ✅ Security-focused tests (path traversal, auth validation)
- ✅ Concurrent operation testing
- ✅ Meaningful test descriptions

---

## Key Test Scenarios

### 1. File Download Security
- Validates JWT tokens before serving files
- Prevents directory traversal attacks
- Enforces 50MB file size limit
- Returns Base64-encoded content

### 2. Authentication Flow
- Extracts user information from JWT claims
- Validates token signature and expiration
- Handles multiple error scenarios
- Preserves user context for logging

### 3. File System Operations
- Safe file reading with path validation
- Metadata retrieval without full file load
- Listing operations with filtering
- Graceful error handling

### 4. Error Handling
- Consistent JSON error responses
- Appropriate HTTP status codes
- Informative error messages
- No exposure of sensitive data

---

## Coverage Summary

| Module | Tests | Status |
|--------|-------|--------|
| controllers.test.ts | 20 | ✅ PASS |
| fileStorage.test.ts | 31 | ✅ PASS |
| auth.test.ts | 31 | ✅ PASS |
| **TOTAL** | **82** | **✅ PASS** |

---

## Next Steps

1. **Integration Testing**: Test full download flow with real network calls
2. **Performance Testing**: Benchmark file download speeds with various sizes
3. **Load Testing**: Test concurrent downloads under stress
4. **End-to-End Testing**: Test with frontend React Native app
5. **Coverage Metrics**: Generate detailed coverage reports (lines, branches, functions)

---

## Scripts Added to package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:controllers": "jest tests/controllers.test.ts",
    "test:storage": "jest tests/fileStorage.test.ts",
    "test:auth": "jest tests/auth.test.ts"
  }
}
```

---

**Generated**: 2026-01-26  
**Branch**: 001-attachment-download-queue
