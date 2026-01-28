import { Router, Request, Response } from 'express';
import { listStorageFiles, getFileMetadata } from '../storage/fileStorage';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * GET /api/messages/recent
 *
 * Get recent messages with file attachments.
 * Each message contains 4 attachments from available files.
 * Requires valid JWT authorization.
 *
 * Query Parameters:
 *   - limit: number (optional) - Number of messages to return (default: 50)
 *   - includeAttachments: boolean (optional) - Whether to include attachments (default: true)
 *
 * Response (200 OK):
 *   {
 *     messages: Array<{
 *       id: string,
 *       attachments: Array<{
 *         id: string,
 *         name: string,
 *         filename: string,
 *         fileUrl: string,
 *         fileSizeBytes: number,
 *         messageId: string
 *       }>
 *     }>
 *   }
 */
router.get('/recent', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const includeAttachments = req.query.includeAttachments !== 'false';

    // Get available files from storage
    const availableFiles = listStorageFiles();

    if (availableFiles.length === 0) {
      res.status(200).json({
        messages: [],
      });
      return;
    }

    // Generate messages with attachments
    const messages = [];

    for (let i = 0; i < limit; i++) {
      const messageId = uuidv4();
      const attachments = [];

      if (includeAttachments) {
        // Each message gets 4 attachments (cycle through available files)
        for (let j = 0; j < 4; j++) {
          const fileIndex = (i * 4 + j) % availableFiles.length;
          const filename = availableFiles[fileIndex];
          const metadata = getFileMetadata(filename);

          if (metadata) {
            attachments.push({
              id: uuidv4(),
              name: metadata.filename,
              filename: metadata.filename,
              fileUrl: `/api/files/download`,
              fileSizeBytes: metadata.size,
              messageId: messageId,
            });
          }
        }
      }

      messages.push({
        id: messageId,
        attachments,
      });
    }

    res.status(200).json({
      messages,
    });

    console.log(`[Messages Recent] Returned ${messages.length} messages with ${messages[0]?.attachments?.length || 0} attachments each`);
  } catch (error: any) {
    console.error('Get recent messages error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get recent messages',
    });
  }
});

export default router;
