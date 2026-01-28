/**
 * Download Message Attachments Context
 * Manages the attachment download queue and processing lifecycle
 *
 * Architecture:
 * - Queue state managed via Zustand store (MMKV persistence)
 * - Download execution via react-native-blob-util with Bearer token auth
 * - Processing loop handles FIFO queue with pause/resume support
 * - Pause flag uses Proxy pattern for reactive updates without re-renders
 * - Context provides high-level API: addCommand, startProcessing, pauseProcessing, resumeProcessing
 */

import React, { createContext, useCallback, useMemo, useRef, useEffect } from 'react';
import RNFetchBlob from 'react-native-blob-util';
import { File } from 'expo-file-system';

import { envConfig } from '@/configs/env-config';
import { MAX_FILE_SIZE } from '@/constants/File';
import {
  fileExistsInCache,
  getCacheFilePath,
  getCachedFileCount,
  isFileSizeValid,
  makeCacheDirectory,
} from '@/lib/files';
import { MAX_CACHED_FILES } from '@/constants/File';
import { useAuthStore } from '@/stores/auth';
import { useDownloadQueueStore, useQueue, useDownloadQueueActions } from '@/stores/downloadQueue';
import type { DownloadCommand } from '@/stores/downloadQueue';
import { useDownloadStatsActions } from '@/stores/downloadStats';
import { useMessageAttachments } from '@/hooks/useMessageAttachments';

export type AttachmentInput = {
  id: string;
  name: string;
  url?: string;
  fileUrl?: string;
  fileSizeBytes: number;
  messageId: string;
};

export interface DownloadContextType {
  attachments: AttachmentInput[];
}

export const DownloadMessageAttachmentsContext = createContext<DownloadContextType | undefined>(
  undefined
);

export interface DownloadMessageAttachmentsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for attachment download queue
 * Wraps the app to provide download capabilities to all screens
 *
 * Usage:
 * ```tsx
 * <DownloadMessageAttachmentsProvider>
 *   <YourApp />
 * </DownloadMessageAttachmentsProvider>
 * ```
 */

const proxyTarget = { isPaused: false };
const proxyHandler: ProxyHandler<typeof proxyTarget> = {
  set(target, prop, value) {
    if (prop === 'isPaused') {
      target.isPaused = value;
      return true;
    }
    return false;
  },
  get(target, prop) {
    return target[prop as keyof typeof target];
  },
};

export const DownloadMessageAttachmentsProvider: React.FC<
  DownloadMessageAttachmentsProviderProps
> = ({ children }) => {
  const {attachments} = useMessageAttachments();
  const queue = useQueue();
  const {
    addCommand,
    removeCommand,
    pauseProcessing,
    markCompleted,
  } = useDownloadQueueActions();

  const {
    incrementQueued,
    incrementSkippedCompleted,
    incrementSkippedCached,
    incrementSkippedOversize,
    incrementSkippedMissingUrl,
    incrementDownloaded,
    incrementFailed,
  } = useDownloadStatsActions();

  const queueRef = useRef<DownloadCommand[]>(queue);
  const isProcessingRef = useRef(false);

  // Keep queueRef in sync with store queue
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Pause flag using Proxy for reactive updates without re-renders
  const pauseFlagRef = useRef(new Proxy(proxyTarget, proxyHandler));

  const processAttachmentCommand = useCallback(
    async (
      attachment: AttachmentInput,
      queuedIds: Set<string>
    ): Promise<DownloadCommand | null> => {
      const attachmentId = attachment.id;
      const filename = attachment.name;
      const fileUrl = attachment.fileUrl || attachment.url;
      const sizeBytes = attachment.fileSizeBytes;

      if (!fileUrl) {
        console.warn('[DownloadContext] Skipping attachment without fileUrl', attachmentId);
        incrementSkippedMissingUrl();
        return null;
      }

      if (!isFileSizeValid(sizeBytes)) {
        console.warn('[DownloadContext] Skipping oversized attachment', filename, sizeBytes);
        incrementSkippedOversize();
        return null;
      }

      if (useDownloadQueueStore.getState().completedIds.includes(attachmentId) || queuedIds.has(attachmentId)) {
        incrementSkippedCompleted();
        return null;
      }

      const alreadyCached = await fileExistsInCache(attachmentId, filename);
      if (alreadyCached) {
        markCompleted(attachmentId);
        incrementSkippedCached();
        return null;
      }

      const command: DownloadCommand = {
        id: attachmentId,
        attachmentId,
        filename,
        fileUrl,
        fileSizeBytes: sizeBytes,
        messageId: attachment.messageId,
        timestamp: Date.now(),
      };

      return command;
    },
    [
      incrementSkippedMissingUrl,
      incrementSkippedOversize,
      incrementSkippedCompleted,
      incrementSkippedCached,
      markCompleted,
    ]
  );

  const addFilesToProcessingQueue = useCallback(
    async (attachments: AttachmentInput[]) => {
      const cachedCount = getCachedFileCount();
      if (cachedCount >= MAX_CACHED_FILES) {
        console.warn('[DownloadContext] Cache is full (%d/%d files), skipping queue', cachedCount, MAX_CACHED_FILES);
        return { isReadyToStartProcessing: false };
      }

      const queuedIds = new Set(queueRef.current.map((item) => item.attachmentId));
      let totalFiles = cachedCount + queuedIds.size;
      let addedCount = 0;

      for (const attachment of attachments) {
        if (totalFiles >= MAX_CACHED_FILES) {
          console.warn('[DownloadContext] Cache limit reached (%d/%d), stopping enqueue', totalFiles, MAX_CACHED_FILES);
          break;
        }

        const command = await processAttachmentCommand(attachment, queuedIds);

        if (command) {
          addCommand(command);
          queuedIds.add(command.attachmentId);
          incrementQueued();
          totalFiles++;
          addedCount++;
        }
      }

      return {
        isReadyToStartProcessing: addedCount > 0 || queueRef.current.length > 0,
      }
    },
    [addCommand, incrementQueued, processAttachmentCommand]
  );

  const fetchAndSaveFile = useCallback(
    async (filename: string, attachmentId: string, token: string): Promise<boolean> => {
      try {
        await makeCacheDirectory();

        const response = await RNFetchBlob.fetch(
          'POST',
          `${envConfig.fileServerBaseURL}/api/files/download`,
          {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          JSON.stringify({ filename })
        );

        const status = response.info().status;
        if (status < 200 || status >= 300) {
          console.warn('[DownloadContext] Download failed', filename, status);
          return false;
        }

        const base64 = await response.base64();
        const filePath = getCacheFilePath(attachmentId, filename);

        const file = new File(filePath);
        await file.write(base64, { encoding: 'base64' });

        return true;
      } catch (error) {
        console.error('[DownloadContext] Error downloading file', filename, error);
        return false;
      }
    },
    []
  );

  const downloadFile = useCallback(
    async (command: DownloadCommand): Promise<boolean> => {
      if (!isFileSizeValid(command.fileSizeBytes)) {
        console.warn('[DownloadContext] File exceeds limit', command.filename);
        return false;
      }

      const token = useAuthStore.getState().tokens?.accessToken;

      if (!token) {
        console.warn('[DownloadContext] Missing access token - pausing queue');
        pauseProcessing();
        return false;
      }

      return fetchAndSaveFile(command.filename, command.attachmentId, token);
    },
    [fetchAndSaveFile, pauseProcessing]
  );

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;

    if (queueRef.current.length === 0) {
      pauseProcessing();
      return;
    }

    isProcessingRef.current = true;

    // Process queue while not paused and items remain
    while (!pauseFlagRef.current.isPaused && queueRef.current.length > 0) {
      const [nextCommand, ...rest] = queueRef.current;
      const completed = useDownloadQueueStore.getState().completedIds.includes(nextCommand.id);
      queueRef.current = rest;

      if (completed) {
        removeCommand(nextCommand.id);
        continue;
      }

      if (nextCommand.fileSizeBytes > MAX_FILE_SIZE) {
        console.warn('[DownloadContext] Skipping file over limit', nextCommand.filename);
        removeCommand(nextCommand.id);
        continue;
      }

      if (getCachedFileCount() >= MAX_CACHED_FILES) {
        console.warn('[DownloadContext] Cache full, stopping processing');
        removeCommand(nextCommand.id);
        break;
      }

      console.log('[DownloadContext] Downloading:', nextCommand.filename, '(id:', nextCommand.attachmentId, ')');
      const success = await downloadFile(nextCommand);

      removeCommand(nextCommand.id);

      if (success) {
        markCompleted(nextCommand.id);
        incrementDownloaded();
        console.log('[DownloadContext] Downloaded:', nextCommand.filename, '| cached:', getCachedFileCount());
      } else {
        incrementFailed();
        console.warn('[DownloadContext] Failed:', nextCommand.filename);
      }
    }

    pauseProcessing();
    isProcessingRef.current = false;
  }, [downloadFile, pauseProcessing, incrementDownloaded, incrementFailed]);

  const triggerProcessQueue = useCallback(() => {
    processQueue().catch((error) => {
      console.error('[DownloadContext] processQueue failed:', error);
    });
  }, [processQueue]);

  // Initialize queue processing on provider mount
  useEffect(() => {
    addFilesToProcessingQueue(attachments).then((result) => {
      if (result.isReadyToStartProcessing) {
        triggerProcessQueue();
      }
    })
  }, [addFilesToProcessingQueue, attachments, triggerProcessQueue]);

  return (
    <DownloadMessageAttachmentsContext.Provider value={{attachments}}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
