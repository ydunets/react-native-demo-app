import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        name?: string;
        preferred_username?: string;
        given_name?: string;
        family_name?: string;
        iat: number;
        exp: number;
      };
    }
  }
}

/**
 * JWT Authentication Middleware
 *
 * Validates Bearer token from Authorization header and extracts user claims.
 * Token is verified against Keycloak public key.
 *
 * @middleware
 * @throws 401 if token is missing, invalid, or expired
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
      return;
    }

    // Extract token
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Get public key for verification
    const publicKey = process.env.KEYCLOAK_PUBLIC_KEY;

    if (!publicKey) {
      console.error('KEYCLOAK_PUBLIC_KEY not configured');
      res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Auth verification not properly configured',
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256', 'HS256'],
    }) as any;

    // Check token expiration manually (jwt.verify should handle this, but explicit check for safety)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
      return;
    }

    // Extract user claims
    req.user = {
      sub: decoded.sub || decoded.jti,
      email: decoded.email,
      name: decoded.name,
      preferred_username: decoded.preferred_username,
      given_name: decoded.given_name,
      family_name: decoded.family_name,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error: any) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
        expiresAt: error.expiredAt,
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token signature or format',
      });
      return;
    }

    // Generic error
    console.error('Auth middleware error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token validation failed',
    });
  }
};

/**
 * Optional auth middleware
 * Same as authMiddleware but doesn't fail if token is missing or invalid.
 * Sets req.user if token is valid, otherwise leaves it undefined.
 */
export const optionalAuthMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.slice(7);
    const publicKey = process.env.KEYCLOAK_PUBLIC_KEY;

    if (!publicKey) {
      console.warn('KEYCLOAK_PUBLIC_KEY not configured, skipping token verification');
      next();
      return;
    }

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256', 'HS256'],
    }) as any;

    req.user = {
      sub: decoded.sub || decoded.jti,
      email: decoded.email,
      name: decoded.name,
      preferred_username: decoded.preferred_username,
      given_name: decoded.given_name,
      family_name: decoded.family_name,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    // Continue without user if token is invalid
    console.warn('Optional auth middleware: token validation skipped', error);
    next();
  }
};
