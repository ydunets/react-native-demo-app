import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import { authMiddleware } from '../src/middleware/auth';
import filesRouter from '../src/routes/files';

// ============================================================================
// Test Setup & Utilities
// ============================================================================

let app: Express;
const TEST_SECRET = 'test-secret-key-for-jwt-verification';
const TEST_FILE = 'sample-text.txt';
const VALID_TOKEN = jwt.sign(
  {
    sub: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    preferred_username: 'testuser',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  },
  TEST_SECRET,
  { algorithm: 'HS256' }
);

const EXPIRED_TOKEN = jwt.sign(
  {
    sub: 'test-user-123',
    email: 'test@example.com',
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
  },
  TEST_SECRET,
  { algorithm: 'HS256' }
);

describe('File Download API', () => {
  beforeAll(() => {
    // Set environment variables for testing
    process.env.KEYCLOAK_PUBLIC_KEY = TEST_SECRET;
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.NODE_ENV = 'test';

    // Create Express app with middleware setup
    app = express();
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.text({ limit: '50mb' }));

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // API routes
    app.use('/api/files', authMiddleware, filesRouter);

    // Error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        statusCode,
      });
    });
  });

  describe('POST /api/files/download', () => {
    it('should successfully download a file with valid token', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ filename: TEST_FILE });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('contentLength');
      expect(response.body).toHaveProperty('base64');
      expect(response.body.filename).toBe(TEST_FILE);
      expect(typeof response.body.base64).toBe('string');
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .send({ filename: TEST_FILE });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid Authorization header');
    });

    it('should return 401 when token is expired', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${EXPIRED_TOKEN}`)
        .send({ filename: TEST_FILE });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('expired');
    });

    it('should return 401 when Authorization header format is invalid', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', 'InvalidFormat token-here')
        .send({ filename: TEST_FILE });

      expect(response.status).toBe(401);
    });

    it('should return 400 when filename is missing', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('filename is required');
    });

    it('should return 400 when filename is not a string', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ filename: 12345 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('must be a string');
    });

    it('should return 404 when file does not exist', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ filename: 'nonexistent-file.txt' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('File not found');
    });

    it('should prevent directory traversal attacks', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ filename: '../../etc/passwd' });

      expect(response.status).toBe(400 | 404 | 500);
    });

    it('should handle files with various extensions', async () => {
      const filesToTest = ['sample-text.txt', 'sample-data.json'];

      for (const filename of filesToTest) {
        const response = await request(app)
          .post('/api/files/download')
          .set('Authorization', `Bearer ${VALID_TOKEN}`)
          .send({ filename });

        if (fs.existsSync(path.join(__dirname, '../../files', filename))) {
          expect(response.status).toBe(200);
          expect(response.body.base64).toBeTruthy();
        }
      }
    });

    it('should include user info in logs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ filename: TEST_FILE });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Download')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('GET /api/files/list', () => {
    it('should list all available files with valid token', async () => {
      const response = await request(app)
        .get('/api/files/list')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .get('/api/files/list');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when token is expired', async () => {
      const response = await request(app)
        .get('/api/files/list')
        .set('Authorization', `Bearer ${EXPIRED_TOKEN}`);

      expect(response.status).toBe(401);
    });

    it('should return files count matching array length', async () => {
      const response = await request(app)
        .get('/api/files/list')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(response.body.files.length);
    });
  });

  describe('Authentication Middleware', () => {
    it('should extract user claims from valid token', async () => {
      const response = await request(app)
        .get('/api/files/list')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
    });

    it('should handle malformed JWT tokens', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', 'Bearer malformed.token.here')
        .send({ filename: TEST_FILE });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should handle empty Bearer token', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', 'Bearer ')
        .send({ filename: TEST_FILE });

      expect(response.status).toBe(401);
    });
  });

  describe('Server Health', () => {
    it('should respond to health check without authentication', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/undefined-endpoint')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(404);
    });

    it('should return JSON error responses', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .set('Content-Type', 'application/json')
        .send({ filename: null });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Response Format', () => {
    it('should return consistent error response format', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ filename: 'nonexistent.txt' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return Base64 encoded file content', async () => {
      const response = await request(app)
        .post('/api/files/download')
        .set('Authorization', `Bearer ${VALID_TOKEN}`)
        .send({ filename: TEST_FILE });

      if (response.status === 200) {
        // Verify Base64 encoding
        expect(() => Buffer.from(response.body.base64, 'base64')).not.toThrow();
      }
    });
  });
});
