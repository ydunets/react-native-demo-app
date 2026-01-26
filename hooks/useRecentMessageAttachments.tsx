/**
 * useRecentMessageAttachments
 * Fetches recent message attachments (up to 50) and filters out completed, queued, cached, or oversized files.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/axios-client';
import { AttachmentInput } from '@/contexts/downloadMessageAttachments';
import { MAX_FILE_SIZE } from '@/constants/File';
import { fileExistsInCache, isFileSizeValid } from '@/lib/files';
import { useDownloadQueueStore } from '@/store/downloadQueueStore';

const DEFAULT_LIMIT = 50;

interface MessageApiAttachment {
  id: string;
  name?: string;
  filename?: string;
  url?: string;
  fileUrl?: string;
  fileSize?: number;
  fileSizeBytes?: number;
  messageId?: string;
}

interface MessageWithAttachments {
  id: string;
  attachments?: MessageApiAttachment[];
}

interface FetcherResponse {
  messages?: MessageWithAttachments[];
  attachments?: MessageApiAttachment[];
}

export interface UseRecentMessageAttachmentsOptions {
  fetcher?: () => Promise<AttachmentInput[]>;
  enabled?: boolean;
}

const normalizeAttachment = (attachment: MessageApiAttachment): AttachmentInput | null => {
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

const defaultFetcher = async (): Promise<AttachmentInput[]> => {
  const { data } = await axiosClient.get<FetcherResponse>('/messages/recent', {
    params: { limit: DEFAULT_LIMIT, includeAttachments: true },
  });

  const rawAttachments: MessageApiAttachment[] = Array.isArray(data?.attachments)
    ? (data?.attachments ?? [])
    : (data?.messages ?? []).flatMap((message) => {
        const attachments = message.attachments ?? [];
        return attachments.map((att) => ({ ...att, messageId: att.messageId ?? message.id }));
      });

  return rawAttachments
    .map(normalizeAttachment)
    .filter((item): item is AttachmentInput => item !== null)
    .slice(0, DEFAULT_LIMIT);
};

export const useRecentMessageAttachments = (options?: UseRecentMessageAttachmentsOptions) => {
  const fetcher = useMemo(() => options?.fetcher ?? defaultFetcher, [options?.fetcher]);
  const enabled = options?.enabled ?? true;
  const [attachments, setAttachments] = useState<AttachmentInput[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const query = useQuery<AttachmentInput[], Error>({
    queryKey: ['recent-message-attachments'],
    queryFn: fetcher,
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    let cancelled = false;

    const filterAttachments = async () => {
      if (!query.data) {
        setAttachments([]);
        return;
      }

      setIsFiltering(true);
      const completed = useDownloadQueueStore.getState().getCompletedIdsAsSet();
      const queuedIds = new Set(
        useDownloadQueueStore.getState().queue.map((item) => item.attachmentId)
      );

      const unique = new Map<string, AttachmentInput>();

      for (const attachment of query.data) {
        if (!isFileSizeValid(attachment.fileSizeBytes ?? 0)) {
          continue;
        }

        if (attachment.fileSizeBytes > MAX_FILE_SIZE) {
          continue;
        }

        if (completed.has(attachment.id) || queuedIds.has(attachment.id)) {
          continue;
        }

        const existsInCache = await fileExistsInCache(attachment.id, attachment.name);
        if (existsInCache) {
          useDownloadQueueStore.getState().markCompleted(attachment.id);
          continue;
        }

        if (!unique.has(attachment.id)) {
          unique.set(attachment.id, attachment);
        }

        if (unique.size >= DEFAULT_LIMIT) {
          break;
        }
      }

      if (!cancelled) {
        setAttachments(Array.from(unique.values()));
        setIsFiltering(false);
      }
    };

    if (enabled) {
      void filterAttachments();
    }

    return () => {
      cancelled = true;
    };
  }, [enabled, query.data]);

  return {
    attachments,
    isLoading: query.isLoading || query.isFetching || isFiltering,
    error: query.error ?? null,
    refetch: query.refetch,
  };
};
