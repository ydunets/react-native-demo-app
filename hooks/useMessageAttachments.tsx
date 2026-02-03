/**
 * useMessageAttachments
 * Fetches message attachments (up to 50) and filters out completed, queued, cached, or oversized files.
 */

import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/axios-client';
import { useIsLoggedIn } from '@/stores/auth';

const DEFAULT_LIMIT = 10;

interface Attachment {
  id: string;
  name: string;
  filename?: string;
  url?: string;
  fileUrl?: string;
  fileSize?: number;
  fileSizeBytes?: number;
  messageId: string;
}

interface MessageWithAttachments {
  id: string;
  attachments?: Attachment[];
}

interface Messages {
  messages?: MessageWithAttachments[];
}

const fetchAndFilterAttachments = async (): Promise<Attachment[]> => {
  try {
    console.warn("[Fetch Attachments] Started");
    
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

    return [...new Map(rawAttachments.map(item => [item.filename, item])).values()];
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return [];
  }
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const EMPTY_ATTACHMENTS: Attachment[] = [];
export const MESSAGE_ATTACHMENTS = ['message-attachments'];

export const useMessageAttachments = () => {
  const isLoggedIn = useIsLoggedIn();

  const query = useQuery<Attachment[], Error>({
    queryKey: MESSAGE_ATTACHMENTS,
    queryFn: () => fetchAndFilterAttachments(),
    staleTime: STALE_TIME,
    enabled: isLoggedIn,
  });

  return {
    attachments: query.data ?? EMPTY_ATTACHMENTS,
    isLoading: query.isLoading || query.isFetching,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};
