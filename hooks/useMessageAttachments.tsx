/**
 * useMessageAttachments
 * Fetches message attachments (up to 50) and filters out completed, queued, cached, or oversized files.
 */

import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/axios-client';
import { useIsLoggedIn } from '@/stores/auth';

const DEFAULT_LIMIT = 10;

export interface Attachment {
  id: string;
  name: string;
  messageId: string;
  filename: string;
  url?: string;
  fileUrl?: string;
  fileSize?: number;
  fileSizeBytes?: number;
}

export interface MessageWithAttachments {
  id: string;
  subject: string,
  senderName: string,
  preview: string,
  sentAt: string,
  unread: string,
  attachments?: Attachment[];
}

interface Messages {
  messages?: MessageWithAttachments[];
}

const fetchAndFilterAttachments = async (): Promise<Attachment[]> => {
  try {
    console.warn("[Fetch Attachments] Fetch attachments from backend API started...");
    
    const { data } = await axiosClient.get<Messages>('/messages/recent', {
      params: { limit: DEFAULT_LIMIT, includeAttachments: true },
    });

    // Get messages from response
    const messages = data?.messages ?? [];
  
    // Filter messages that have attachments
    const messagesWithAttachments = messages.filter(
      (message) => !!message?.attachments && message?.attachments.length > 0
    ) as Required<MessageWithAttachments>[];

    const rawAttachments: Attachment[] = messagesWithAttachments.flatMap((message) => {
      return message.attachments;
    });

    const attachments = [...new Map(rawAttachments.map(item => [item.filename, item])).values()]

    console.warn("[Fetch Attachments] Fetch attachments from backend API finished. Total attachments:",attachments.length,"attachments.");
    return attachments;
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return [];
  }
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const EMPTY_ATTACHMENTS: Attachment[] = [];
export const MESSAGE_ATTACHMENTS_KEY = ['message-attachments'];

export const useMessageAttachments = () => {
  const isLoggedIn = useIsLoggedIn();

  const query = useQuery<Attachment[], Error>({
    queryKey: MESSAGE_ATTACHMENTS_KEY,
    queryFn: () => fetchAndFilterAttachments(),
    staleTime: STALE_TIME,
    enabled: isLoggedIn,
  });

  return {
    attachments: query.data ?? EMPTY_ATTACHMENTS,
    isSuccess: query.isSuccess,
    isLoading: query.isLoading || query.isFetching,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};
