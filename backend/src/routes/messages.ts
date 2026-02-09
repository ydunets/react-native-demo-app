import { Router, Request, Response } from 'express';
import { listStorageFiles, getFileMetadata } from '../storage/fileStorage';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Message display data constants
const SENDER_NAMES = [
  'Support Team',
  'Admin',
  'System',
  'Calendar',
  'HR Department',
  'Finance Team',
  'Marketing',
  'IT Support',
  'Legal Department',
  'Operations',
  'Customer Service',
  'Product Team',
  'Sales Team',
  'Design Team',
  'Engineering',
  'Quality Assurance',
  'Project Manager',
  'Executive Team',
  'Security Team',
  'Compliance',
] as const;

const SUBJECTS = [
  'Welcome Message',
  'Important Update',
  'Reminder',
  'Meeting Scheduled',
  'Document Review',
  'Payment Received',
  'Account Verification',
  'Password Reset',
  'New Feature Available',
  'Maintenance Notice',
  'Security Alert',
  'Policy Update',
  'Training Session',
  'Performance Review',
  'Budget Approval',
  'Contract Renewal',
  'Event Invitation',
  'Survey Request',
  'Feedback Requested',
  'Status Update',
] as const;

const PREVIEWS = [
  'Welcome to our app! This is a preview of the message content.',
  'We have exciting new features available. Check them out!',
  "Don't forget to check in regularly for updates.",
  'Your meeting has been scheduled for next Monday.',
  'Please review the attached documents at your convenience.',
  'Your payment has been successfully processed.',
  'Please verify your account to continue using our services.',
  'A password reset request has been initiated for your account.',
  "We're excited to announce a new feature that will enhance your experience.",
  'Scheduled maintenance will occur this weekend. Services may be temporarily unavailable.',
  'We detected unusual activity on your account. Please review immediately.',
  'Our privacy policy has been updated. Please review the changes.',
  "You're invited to attend our upcoming training session.",
  'Your performance review is scheduled. Please prepare accordingly.',
  'Your budget request has been approved and funds are available.',
  'Your contract is up for renewal. Please review the terms.',
  "You're invited to our upcoming event. RSVP by clicking here.",
  'We value your feedback. Please take a moment to complete our survey.',
  "We'd love to hear your thoughts. Share your feedback with us.",
  "Here's the latest status update on your request.",
] as const;

const DEFAULT_MESSAGE_LIMIT = 8;
const BASE_DATE = new Date('2024-01-15');
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;

/**
 * Generate a deterministic date for a message based on its index
 */
const generateMessageDate = (index: number): Date => {
  const date = new Date(BASE_DATE);
  date.setDate(date.getDate() - index);
  date.setHours(Math.floor((index * 7) % HOURS_IN_DAY));
  date.setMinutes(Math.floor((index * 13) % MINUTES_IN_HOUR));
  return date;
};

const MESSAGE_DISPLAY_ENTRIES = Array.from({ length: DEFAULT_MESSAGE_LIMIT }, (_, index) => ({
  subject: SUBJECTS[index],
  senderName: SENDER_NAMES[index],
  preview: PREVIEWS[index],
  sentAt: generateMessageDate(index).toISOString(),
  unread: index === 0 || index === 3 || index === 6,
}));

/**
 * GET /api/messages/recent
 *
 * Get recent messages with file attachments.
 * Each message contains up to 2 attachments from available files.
 * Requires valid JWT authorization.
 *
 * Query Parameters:
 *   - limit: number (optional) - Number of messages to return (default: 8)
 *   - includeAttachments: boolean (optional) - Whether to include attachments (default: true)
 *
 * Response (200 OK):
 *   {
 *     messages: Array<{
 *       id: string,
 *       subject: string,
 *       senderName: string,
 *       preview: string,
 *       sentAt: string (ISO date),
 *       unread: boolean,
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
    const limit = parseInt(req.query.limit as string) || DEFAULT_MESSAGE_LIMIT;
    const includeAttachments = req.query.includeAttachments !== 'false';

    // Get available files from storage (sorted for deterministic grouping)
    const availableFiles = listStorageFiles().sort((left, right) => left.localeCompare(right));

    if (availableFiles.length === 0) {
      res.status(200).json({
        messages: [],
      });
      return;
    }

    const filesPerMessage = 2;
    const totalMessages = Math.ceil(availableFiles.length / filesPerMessage);
    const messageCount = Math.min(limit, totalMessages);

    // Generate messages with display data and attachments
    const messages = [];

    for (let i = 0; i < messageCount; i++) {
      const messageId = uuidv4();
      const displayData = MESSAGE_DISPLAY_ENTRIES[i % MESSAGE_DISPLAY_ENTRIES.length];
      const attachments = [];

      if (includeAttachments) {
        const startIndex = i * filesPerMessage;
        const endIndex = Math.min(startIndex + filesPerMessage, availableFiles.length);

        for (let j = startIndex; j < endIndex; j++) {
          const filename = availableFiles[j];
          const metadata = getFileMetadata(filename);

          if (!metadata) continue;

          attachments.push({
            id: `${metadata.filename}-${metadata.size}`,
            name: metadata.filename,
            filename: metadata.filename,
            fileUrl: `/api/files/download`,
            fileSizeBytes: metadata.size,
            messageId: messageId,
          });
        }
      }

      messages.push({
        id: messageId,
        ...displayData,
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
