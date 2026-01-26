import { authMiddleware } from '../src/middleware/auth';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// ============================================================================
// Authentication Middleware Tests
// ============================================================================

describe('Authentication Middleware', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt-verification';
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Set environment variable for testing
    process.env.KEYCLOAK_PUBLIC_KEY = TEST_SECRET;

    // Create mock Request and Response objects
    mockReq = {
      headers: {},
      user: undefined,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Valid Token Handling', () => {
    it('should extract user claims from valid token', () => {
      const validToken = jwt.sign(
        {
          sub: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'testuser',
          given_name: 'Test',
          family_name: 'User',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET,
        { algorithm: 'HS256' }
      );

      mockReq.headers = {
        authorization: `Bearer ${validToken}`,
      };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.sub).toBe('test-user-123');
      expect(mockReq.user?.email).toBe('test@example.com');
      expect(mockReq.user?.name).toBe('Test User');
    });

    it('should call next() on successful authentication', () => {
      const validToken = jwt.sign(
        {
          sub: 'test-user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${validToken}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should extract all available user claims', () => {
      const tokenPayload = {
        sub: 'user-123',
        email: 'user@test.com',
        name: 'Full Name',
        preferred_username: 'username',
        given_name: 'First',
        family_name: 'Last',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(tokenPayload, TEST_SECRET);
      mockReq.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({
        sub: tokenPayload.sub,
        email: tokenPayload.email,
        name: tokenPayload.name,
        preferred_username: tokenPayload.preferred_username,
        given_name: tokenPayload.given_name,
        family_name: tokenPayload.family_name,
        iat: tokenPayload.iat,
        exp: tokenPayload.exp,
      });
    });
  });

  describe('Missing Authorization Header', () => {
    it('should return 401 when Authorization header is missing', () => {
      mockReq.headers = {};

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: expect.stringContaining('Missing or invalid Authorization header'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is empty', () => {
      mockReq.headers = { authorization: '' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header has no Bearer prefix', () => {
      mockReq.headers = { authorization: 'invalid-format-token' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: expect.stringContaining('Bearer'),
        })
      );
    });

    it('should return 401 when Bearer token is empty', () => {
      mockReq.headers = { authorization: 'Bearer ' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle Bearer with wrong case', () => {
      mockReq.headers = { authorization: 'bearer token-here' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Malformed Token Handling', () => {
    it('should return 401 for malformed JWT token', () => {
      mockReq.headers = { authorization: 'Bearer malformed.token.here' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for token with wrong signature', () => {
      const validToken = jwt.sign(
        {
          sub: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        'different-secret-key'
      );

      mockReq.headers = { authorization: `Bearer ${validToken}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for incomplete JWT', () => {
      mockReq.headers = { authorization: 'Bearer incomplete.jwt' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for random string as token', () => {
      mockReq.headers = { authorization: 'Bearer randomstringnotajwt' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Token Expiration', () => {
    it('should return 401 for expired token', () => {
      const expiredToken = jwt.sign(
        {
          sub: 'user',
          iat: Math.floor(Date.now() / 1000) - 7200,
          exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${expiredToken}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: expect.stringContaining('expired'),
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept token that is not yet expired', () => {
      const futureToken = jwt.sign(
        {
          sub: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${futureToken}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should include expiration info in error for expired token', () => {
      const expiredToken = jwt.sign(
        {
          sub: 'user',
          iat: Math.floor(Date.now() / 1000) - 7200,
          exp: Math.floor(Date.now() / 1000) - 3600,
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${expiredToken}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized',
          message: expect.stringContaining('expired'),
        })
      );
    });
  });

  describe('Token Claims Extraction', () => {
    it('should handle missing optional claims', () => {
      const minimalToken = jwt.sign(
        {
          sub: 'user-id',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${minimalToken}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user?.sub).toBe('user-id');
      expect(mockReq.user?.email).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fallback to jti for sub claim', () => {
      const tokenWithJti = jwt.sign(
        {
          jti: 'jwt-id-123',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${tokenWithJti}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user?.sub).toBe('jwt-id-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should include token timestamps in user object', () => {
      const now = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        {
          sub: 'user',
          iat: now,
          exp: now + 3600,
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user?.iat).toBe(now);
      expect(mockReq.user?.exp).toBe(now + 3600);
    });
  });

  describe('Configuration Errors', () => {
    it('should return 500 when KEYCLOAK_PUBLIC_KEY is not configured', () => {
      const originalKey = process.env.KEYCLOAK_PUBLIC_KEY;
      delete process.env.KEYCLOAK_PUBLIC_KEY;

      const token = jwt.sign(
        {
          sub: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${token}` };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Server Configuration Error',
        })
      );

      consoleSpy.mockRestore();
      process.env.KEYCLOAK_PUBLIC_KEY = originalKey;
    });
  });

  describe('HTTP Methods', () => {
    it('should work with any HTTP method (middleware agnostic)', () => {
      const token = jwt.sign(
        {
          sub: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );

      mockReq.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle case-insensitive Authorization header', () => {
      const token = jwt.sign(
        {
          sub: 'user',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        TEST_SECRET
      );

      // Express normalizes header names to lowercase
      mockReq.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error response structure', () => {
      mockReq.headers = {};

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const callArgs = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(callArgs).toHaveProperty('error');
      expect(callArgs).toHaveProperty('message');
    });

    it('should not expose sensitive information in error messages', () => {
      const token = jwt.sign({ sub: 'user' }, 'different-secret', { algorithm: 'HS256' });

      mockReq.headers = { authorization: `Bearer ${token}` };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      const callArgs = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.message).not.toContain('different-secret');
      // JWT library error may contain 'signature' in its error message, which is acceptable
      expect(callArgs.error).toBe('Unauthorized');
    });
  });
});
