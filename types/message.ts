/**
 * Shared types for messages and attachments
 * Used across frontend components and hooks
 */

export interface Attachment {
  id: string;
  name: string;
  filename: string;
  fileUrl: string;
  fileSizeBytes: number;
  messageId: string;
}

export interface Message {
  id: string;
  subject: string;
  senderName: string;
  preview: string;
  sentAt: string;
  unread: boolean;
  attachments: Attachment[];
}

export interface MessagesResponse {
  messages: Message[];
}
