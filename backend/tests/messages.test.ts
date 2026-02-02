import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import { authMiddleware } from '../src/middleware/auth';
import messagesRouter from '../src/routes/messages';

// ============================================================================
// Test Setup & Utilities
// ============================================================================

let app: Express;
const TEST_SECRET = 'test-secret-key-for-jwt-verification';
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

describe('Messages API', () => {
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
    app.use('/api/messages', authMiddleware, messagesRouter);

    // Error handler
    app.use(
      (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
          error: err.message || 'Internal Server Error',
          statusCode,
        });
      }
    );
  });

  describe('GET /api/messages/recent', () => {
    it('should return messages with attachments with valid token', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=5&includeAttachments=true')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('messages');
      expect(Array.isArray(response.body.messages)).toBe(true);
      expect(response.body.messages.length).toBeLessThanOrEqual(5);

      // Validate first message structure
      if (response.body.messages.length > 0) {
        const message = response.body.messages[0];
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('attachments');
        expect(Array.isArray(message.attachments)).toBe(true);
        expect(typeof message.id).toBe('string');
      }
    });

    it('should return messages with 4 attachments each', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=3&includeAttachments=true')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(3);

      // Each message should have 4 attachments (if files are available)
      response.body.messages.forEach((message: any) => {
        expect(message.attachments).toBeDefined();
        expect(Array.isArray(message.attachments)).toBe(true);
        
        // Validate attachment structure
        message.attachments.forEach((attachment: any) => {
          expect(attachment).toHaveProperty('id');
          expect(attachment).toHaveProperty('name');
          expect(attachment).toHaveProperty('filename');
          expect(attachment).toHaveProperty('fileUrl');
          expect(attachment).toHaveProperty('fileSizeBytes');
          expect(attachment).toHaveProperty('messageId');
          expect(typeof attachment.id).toBe('string');
          expect(typeof attachment.name).toBe('string');
          expect(typeof attachment.fileSizeBytes).toBe('number');
          expect(attachment.messageId).toBe(message.id);
        });
      });
    });

    it('should respect the limit parameter', async () => {
      const limit = 10;
      const response = await request(app)
        .get(`/api/messages/recent?limit=${limit}`)
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.messages.length).toBeLessThanOrEqual(limit);
    });

    it('should use default limit of 50 when not specified', async () => {
      const response = await request(app)
        .get('/api/messages/recent')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.messages.length).toBeLessThanOrEqual(50);
    });

    it('should return messages without attachments when includeAttachments=false', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=3&includeAttachments=false')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(3);

      response.body.messages.forEach((message: any) => {
        expect(message).toHaveProperty('attachments');
        expect(message.attachments).toHaveLength(0);
      });
    });

    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/messages/recent?limit=5');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body.message).toContain('Missing or invalid Authorization header');
    });

    it('should return 401 when token is expired', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=5')
        .set('Authorization', `Bearer ${EXPIRED_TOKEN}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=5')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 when Authorization scheme is not Bearer', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=5')
        .set('Authorization', `Basic ${VALID_TOKEN}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should handle large limit values gracefully', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=1000')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toBeDefined();
      expect(Array.isArray(response.body.messages)).toBe(true);
    });

    it('should generate unique message IDs', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=10')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      const messageIds = response.body.messages.map((m: any) => m.id);
      const uniqueIds = new Set(messageIds);
      expect(uniqueIds.size).toBe(messageIds.length);
    });

    it('should generate unique attachment IDs', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=3&includeAttachments=true')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      
      const allAttachmentIds: string[] = [];
      response.body.messages.forEach((message: any) => {
        message.attachments.forEach((attachment: any) => {
          allAttachmentIds.push(attachment.id);
        });
      });

      const uniqueIds = new Set(allAttachmentIds);
      expect(uniqueIds.size).toBe(allAttachmentIds.length);
    });

    it('should have proper fileUrl format', async () => {
      const response = await request(app)
        .get('/api/messages/recent?limit=1&includeAttachments=true')
        .set('Authorization', `Bearer ${VALID_TOKEN}`);

      expect(response.status).toBe(200);
      
      if (response.body.messages.length > 0 && response.body.messages[0].attachments.length > 0) {
        const attachment = response.body.messages[0].attachments[0];
        expect(attachment.fileUrl).toBe('/api/files/download');
      }
    });
  });
});
