/**
 * useMessageAttachments
 * Fetches message attachments (up to 50) and filters out completed, queued, cached, or oversized files.
 */

import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/axios-client';
import { AttachmentInput } from '@/contexts/downloadMessageAttachments';
import { MAX_FILE_SIZE } from '@/constants/File';
import { fileExistsInCache, isFileSizeValid } from '@/lib/files';
import { useDownloadQueueStore } from '@/store/downloadQueueStore';
import { useAuthStore } from '@/store/authStore';

const DEFAULT_LIMIT = 50;

interface Attachment {
  id: string;
  name?: string;
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

export interface UseMessageAttachmentsOptions {
  fetchAttachments?: () => Promise<AttachmentInput[]>;
  enabled?: boolean;
}

const normalizeAttachment = (attachment: Attachment): AttachmentInput | null => {
  const id = attachment.id;
  const name = attachment.name || attachment.filename;
  const fileUrl = attachment.fileUrl || attachment.url;
  const fileSizeBytes = attachment.fileSizeBytes ?? attachment.fileSize ?? 0;
  const messageId = attachment.messageId;

  if (!id || !fileUrl || !name) {
    return null;
  }

  return {
    id,
    name,
    fileUrl,
    fileSizeBytes,
    messageId: messageId || '',
  };
};

const shouldIncludeAttachment = async (
  attachment: AttachmentInput,
  completed: Set<string>,
  queuedIds: Set<string>
): Promise<boolean> => {
  if (!isFileSizeValid(attachment.fileSizeBytes ?? 0)) {
    return false;
  }

  if (attachment.fileSizeBytes > MAX_FILE_SIZE) {
    return false;
  }

  if (completed.has(attachment.id) || queuedIds.has(attachment.id)) {
    return false;
  }

  const existsInCache = await fileExistsInCache(attachment.id, attachment.name);
  if (existsInCache) {
    useDownloadQueueStore.getState().markCompleted(attachment.id);
    return false;
  }

  return true;
};

const fetchAndFilterAttachments = async (): Promise<AttachmentInput[]> => {
  try {
    console.log("[Fetch Attachments] Started");
    
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

    // Normalize attachments
    const normalized = rawAttachments
      .map(normalizeAttachment)
      .filter((item) => item !== null);

    // Get current queue state for filtering
    const completed = useDownloadQueueStore.getState().getCompletedIdsAsSet();
    const queuedIds = new Set(
      useDownloadQueueStore.getState().queue.map((item) => item.attachmentId)
    );

    // Filter and deduplicate
    const unique = new Map<string, AttachmentInput>();

    for (const attachment of normalized) {
      const shouldInclude = await shouldIncludeAttachment(attachment, completed, queuedIds);
      
      if (!shouldInclude) {
        continue;
      }

      if (!unique.has(attachment.id)) {
        unique.set(attachment.id, attachment);
      }

      if (unique.size >= DEFAULT_LIMIT) {
        break;
      }
    }

    return Array.from(unique.values());
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return [];
  }
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const EMPTY_ATTACHMENTS: AttachmentInput[] = [];

export const useMessageAttachments = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const query = useQuery<AttachmentInput[], Error>({
    queryKey: ['message-attachments'],
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
