import { Router, Request, Response } from 'express';
import { readFileFromStorage, validateContentLength, initializeStorage, listStorageFiles, getFilePath, getFileMetadata } from '../storage/fileStorage';
import * as fs from 'fs';

const router = Router();

// Initialize storage on startup
initializeStorage();

/**
 * POST /api/files/download
 *
 * Download a file from storage and return as Base64-encoded content.
 * Requires valid JWT authorization.
 *
 * Request Body:
 *   - filename: string - Name of the file to download (e.g., "sample.pdf")
 *
 * Response (200 OK):
 *   {
 *     filename: string,
 *     size: number,
 *     contentLength: number,
 *     base64: string
 *   }
 *
 * Error Responses:
 *   - 401 Unauthorized: No valid JWT token
 *   - 400 Bad Request: Missing or invalid filename
 *   - 404 Not Found: File does not exist
 *   - 413 Payload Too Large: File exceeds 50MB limit
 *   - 500 Internal Server Error: Unexpected error
 */
router.post('/download', async (req: Request, res: Response) => {
  try {
    // Extract filename from request body
    const { filename } = req.body;

    // Validate request
    if (!filename || typeof filename !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'filename is required and must be a string',
      });
      return;
    }

    // Log download request (with user info from JWT if available)
    const userId = req.user?.sub || 'anonymous';
    console.log(`[Download Request] User: ${userId}, File: ${filename}`);

    // Read file from storage
    const fileResponse = await readFileFromStorage(filename);

    // Validate content length one more time
    const validation = validateContentLength(fileResponse.contentLength);
    if (!validation.valid) {
      res.status(413).json({
        error: 'Payload Too Large',
        message: validation.error,
      });
      return;
    }

    // Return successful response
    res.status(200).json({
      filename: fileResponse.filename,
      size: fileResponse.size,
      contentLength: fileResponse.contentLength,
      base64: fileResponse.base64,
    });

    console.log(`[Download Success] User: ${userId}, File: ${filename}, Size: ${fileResponse.size} bytes`);
  } catch (error: any) {
    // Handle specific errors
    if (error.statusCode === 404) {
      res.status(404).json({
        error: 'Not Found',
        message: `File not found: ${req.body.filename}`,
      });
      return;
    }

    if (error.statusCode === 413) {
      res.status(413).json({
        error: 'Payload Too Large',
        message: error.message || 'File exceeds maximum size limit',
      });
      return;
    }

    // Generic error
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to download file',
    });
  }
});

/**
 * POST /api/files/download-binary
 *
 * Download a file from storage as binary stream (octet-stream).
 * Better for large files - no base64 overhead.
 * Requires valid JWT authorization.
 *
 * Request Body:
 *   - filename: string - Name of the file to download (e.g., "sample.pdf")
 *
 * Response (200 OK):
 *   Binary file data with headers:
 *   - Content-Type: application/octet-stream
 *   - Content-Length: <file size>
 *   - Content-Disposition: attachment; filename="<filename>"
 *
 * Error Responses:
 *   - 400 Bad Request: Missing or invalid filename
 *   - 404 Not Found: File does not exist
 *   - 413 Payload Too Large: File exceeds 50MB limit
 *   - 500 Internal Server Error: Unexpected error
 */
router.post('/download-binary', async (req: Request, res: Response) => {
  try {
    const { filename } = req.body;

    // Validate request
    if (!filename || typeof filename !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'filename is required and must be a string',
      });
      return;
    }

    const userId = req.user?.sub || 'anonymous';
    console.log(`[Binary Download Request] User: ${userId}, File: ${filename}`);

    // Get file metadata first
    const metadata = getFileMetadata(filename);
    if (!metadata) {
      res.status(404).json({
        error: 'Not Found',
        message: `File not found: ${filename}`,
      });
      return;
    }

    // Validate size
    const validation = validateContentLength(metadata.size);
    if (!validation.valid) {
      res.status(413).json({
        error: 'Payload Too Large',
        message: validation.error,
      });
      return;
    }

    // Get file path and stream it
    const filePath = getFilePath(filename);

    // Set headers for binary download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', metadata.size);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    // Stream the file
    const readStream = fs.createReadStream(filePath);
    
    readStream.on('error', (error) => {
      console.error(`[Binary Download Error] File: ${filename}`, error);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to stream file',
        });
      }
    });

    readStream.on('end', () => {
      console.log(`[Binary Download Success] User: ${userId}, File: ${filename}, Size: ${metadata.size} bytes`);
    });

    readStream.pipe(res);
  } catch (error: any) {
    console.error('Binary download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to download file',
      });
    }
  }
});

/**
 * GET /api/files/list
 *
 * List all available files in storage (for testing/debugging only).
 * Requires valid JWT authorization.
 *
 * Response (200 OK):
 *   {
 *     files: string[],
 *     count: number
 *   }
 */
router.get('/list', (_req: Request, res: Response) => {
  try {
    const files = listStorageFiles();
    res.status(200).json({
      files,
      count: files.length,
    });
  } catch (error: any) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list files',
    });
  }
});

export default router;
