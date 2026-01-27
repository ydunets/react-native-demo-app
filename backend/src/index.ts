import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { authMiddleware } from './middleware/auth.js';
import filesRouter from './routes/files.js';
import messagesRouter from './routes/messages.js';

// Load environment variables from .env.backend
dotenv.config({ path: path.resolve(__dirname, '../../.env.backend') });

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// Middleware Setup
// ============================================================================

// CORS Configuration
const corsOrigins = (process.env.CORS_ORIGINS || 'localhost:8081,10.0.2.2:8081').split(',');
app.use(
  cors({
    origin: corsOrigins.map((origin) => {
      // Normalize origins (add http:// if missing)
      return origin.includes('://') ? origin : `http://${origin}`;
    }),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.text({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware (development only)
if (NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// Health Check Endpoint
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// ============================================================================
// API Routes
// ============================================================================

// File download routes (protected by auth middleware)
app.use('/api/files', authMiddleware, filesRouter);

// Messages routes (protected by auth middleware)
app.use('/api/messages', authMiddleware, messagesRouter);

// ============================================================================
// Error Handling Middleware
// ============================================================================

// 404 Not Found handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${timestamp}] Error:`, {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: message,
    statusCode,
    timestamp,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║          File Server Started Successfully                      ║
╠════════════════════════════════════════════════════════════════╣
║ Environment: ${NODE_ENV.padEnd(53)} ║
║ Port:        ${String(PORT).padEnd(53)} ║
║ CORS Origins: ${corsOrigins.join(', ').padEnd(47)} ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
