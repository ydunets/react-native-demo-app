/**
 * useMessageAttachments
 * Fetches message attachments (up to 50) and filters out completed, queued, cached, or oversized files.
 */

import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/axios-client';
import { MAX_FILE_SIZE, MAX_CACHED_FILES } from '@/constants/File';
import { fileExistsInCache, isFileSizeValid } from '@/lib/files';
import { useDownloadQueueStore, selectCompletedIdsAsSet } from '@/stores/downloadQueue';
import { useIsLoggedIn, useIsHydrated } from '@/stores/auth';

const DEFAULT_LIMIT = 10;

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

export type AttachmentInput = {
  id: string;
  name: string;
  url?: string;
  fileUrl?: string;
  fileSizeBytes: number;
  messageId: string;
};

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
  queuedIds: Set<string>,
  seenFilenames: Set<string>
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

  if (seenFilenames.has(attachment.name)) {
    return false;
  }

  const existsInCache = await fileExistsInCache(attachment.id, attachment.name);
  if (existsInCache) {
    useDownloadQueueStore.getState().actions.markCompleted(attachment.id);
    return false;
  }

  return true;
};

const fetchAndFilterAttachments = async (): Promise<AttachmentInput[]> => {
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
    

    // Normalize attachments
    const normalized = rawAttachments
      .map(normalizeAttachment)
      .filter((item) => item !== null);

    // Get current queue state for filtering
    const completed = selectCompletedIdsAsSet(useDownloadQueueStore.getState());
    const queuedIds = new Set(
      useDownloadQueueStore.getState().queue.map((item) => item.attachmentId)
    );

    // Filter and deduplicate by filename (not attachment ID)
    const unique = new Map<string, AttachmentInput>();
    const seenFilenames = new Set<string>();

    for (const attachment of normalized) {
      const shouldInclude = await shouldIncludeAttachment(attachment, completed, queuedIds, seenFilenames);

      if (!shouldInclude) {
        continue;
      }

      if (!unique.has(attachment.name)) {
        unique.set(attachment.name, attachment);
        seenFilenames.add(attachment.name);
      }

      if (unique.size >= MAX_CACHED_FILES) {
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
  const isLoggedIn = useIsLoggedIn();
  const isHydrated = useIsHydrated();

  // Only fetch when: store is hydrated and user is logged in
  const shouldFetch = isHydrated && isLoggedIn;

  const query = useQuery<AttachmentInput[], Error>({
    queryKey: ['message-attachments'],
    queryFn: () => fetchAndFilterAttachments(),
    staleTime: STALE_TIME,
    enabled: shouldFetch,
  });

  return {
    attachments: query.data ?? EMPTY_ATTACHMENTS,
    isLoading: query.isLoading || query.isFetching,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};
