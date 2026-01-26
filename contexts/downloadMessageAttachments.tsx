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
  isFileSizeValid,
  makeCacheDirectory,
} from '@/lib/files';
import { useAuthStore } from '@/store/authStore';
import { useDownloadQueueStore, type DownloadCommand } from '@/store/downloadQueueStore';

export type AttachmentInput = {
  id: string;
  name: string;
  url?: string;
  fileUrl?: string;
  fileSizeBytes: number;
  messageId: string;
};

export interface DownloadContextType {
  queue: DownloadCommand[];
  isProcessing: boolean;
  completedIds: Set<string>;
  addCommand: (command: DownloadCommand) => void;
  addFilesToProcessingQueue: (attachments: AttachmentInput[]) => Promise<void>;
  removeCommand: (id: string) => void;
  startProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  downloadFilePriority: (command: DownloadCommand) => Promise<boolean>;
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
export const DownloadMessageAttachmentsProvider: React.FC<
  DownloadMessageAttachmentsProviderProps
> = ({ children }) => {
  const store = useDownloadQueueStore();
  const queueRef = useRef<DownloadCommand[]>(store.queue);
  const isProcessingRef = useRef(false);

  // Pause flag using Proxy for reactive updates without re-renders
  const pauseFlagRef = useRef(
    new Proxy(
      { isPaused: false },
      {
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
      }
    )
  );

  /**
   * Add a download command to the queue
   */
  const addCommand = useCallback(
    (command: DownloadCommand) => {
      store.addCommand(command);
    },
    [store]
  );

  const addFilesToProcessingQueue = useCallback(
    async (attachments: AttachmentInput[]) => {
      const completedSet = store.getCompletedIdsAsSet();
      const queuedIds = new Set(queueRef.current.map((item) => item.attachmentId));

      for (const attachment of attachments) {
        const attachmentId = attachment.id;
        const filename = attachment.name;
        const fileUrl = attachment.fileUrl || attachment.url;
        const sizeBytes = attachment.fileSizeBytes;

        if (!fileUrl) {
          console.warn('[DownloadContext] Skipping attachment without fileUrl', attachmentId);
          continue;
        }

        if (!isFileSizeValid(sizeBytes)) {
          console.warn('[DownloadContext] Skipping oversized attachment', filename, sizeBytes);
          continue;
        }

        if (completedSet.has(attachmentId) || queuedIds.has(attachmentId)) {
          continue;
        }

        const alreadyCached = await fileExistsInCache(attachmentId, filename);
        if (alreadyCached) {
          store.markCompleted(attachmentId);
          continue;
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

        store.addCommand(command);
        queuedIds.add(attachmentId);
      }
    },
    [store]
  );

  /**
   * Remove a download command from the queue by ID
   */
  const removeCommand = useCallback(
    (id: string) => {
      store.removeCommand(id);
    },
    [store]
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
        store.pauseProcessing();
        return false;
      }

      try {
        await makeCacheDirectory();

        const response = await RNFetchBlob.fetch(
          'POST',
          `${envConfig.fileServerBaseURL}/api/files/download`,
          {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/plain',
          },
          command.fileUrl
        );

        const status = response.info().status;
        if (status < 200 || status >= 300) {
          console.warn('[DownloadContext] Download failed', command.filename, status);
          return false;
        }

        const base64 = await response.base64();
        const filePath = getCacheFilePath(command.attachmentId, command.filename);

        const file = new File(filePath);
        await file.write(base64, { encoding: 'base64' });

        return true;
      } catch (error) {
        console.error('[DownloadContext] Error downloading file', command.filename, error);
        return false;
      }
    },
    [store]
  );

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;

    if (queueRef.current.length === 0) {
      store.pauseProcessing();
      return;
    }

    isProcessingRef.current = true;

    while (!pauseFlagRef.current.isPaused && queueRef.current.length > 0) {
      const [nextCommand, ...rest] = queueRef.current;
      queueRef.current = rest;

      if (store.isCompleted(nextCommand.id)) {
        store.removeCommand(nextCommand.id);
        continue;
      }

      if (nextCommand.fileSizeBytes > MAX_FILE_SIZE) {
        console.warn('[DownloadContext] Skipping file over limit', nextCommand.filename);
        store.removeCommand(nextCommand.id);
        continue;
      }

      const success = await downloadFile(nextCommand);

      store.removeCommand(nextCommand.id);

      if (success) {
        store.markCompleted(nextCommand.id);
      }
    }

    store.pauseProcessing();
    isProcessingRef.current = false;
  }, [downloadFile, store]);

  const triggerProcessQueue = useCallback(() => {
    processQueue().catch((error) => {
      console.error('[DownloadContext] processQueue failed:', error);
    });
  }, [processQueue]);

  /**
   * Start processing the download queue
   */
  const startProcessing = useCallback(() => {
    if (isProcessingRef.current) return;
    store.startProcessing();
    pauseFlagRef.current.isPaused = false;
    triggerProcessQueue();
  }, [store, triggerProcessQueue]);

  /**
   * Pause processing the download queue
   * Uses Proxy pattern for responsive pause without triggering re-renders
   */
  const pauseProcessing = useCallback(() => {
    pauseFlagRef.current.isPaused = true;
    store.pauseProcessing();
  }, [store]);

  /**
   * Resume processing the download queue
   */
  const resumeProcessing = useCallback(() => {
    pauseFlagRef.current.isPaused = false;
    store.resumeProcessing();
    if (!isProcessingRef.current) {
      triggerProcessQueue();
    }
  }, [store, triggerProcessQueue]);

  /**
   * Download a file with priority (interrupts background queue)
   * Placeholder implementation - will be expanded in T031
   */
  const downloadFilePriority = useCallback(async (command: DownloadCommand): Promise<boolean> => {
    try {
      // TODO: Implement priority download logic in T031
      // 1. Pause background processing
      // 2. Download file via react-native-blob-util
      // 3. Mark as completed
      // 4. Resume background processing
      console.warn('[DownloadContext] downloadFilePriority not yet implemented', command.filename);
      return false;
    } catch (error) {
      console.error('[DownloadContext] Priority download failed:', error);
      return false;
    }
  }, []);

  // Initialize queue processing on provider mount
  useEffect(() => {
    const initializeQueue = async () => {
      queueRef.current = store.queue;

      if (store.queue.length > 0) {
        pauseFlagRef.current.isPaused = false;
        triggerProcessQueue();
      }
    };

    initializeQueue();
  }, [store, triggerProcessQueue]);

  useEffect(() => {
    queueRef.current = store.queue;
  }, [store.queue]);

  const value = useMemo<DownloadContextType>(
    () => ({
      queue: store.queue,
      isProcessing: store.isProcessing,
      completedIds: store.getCompletedIdsAsSet(),
      addCommand,
      addFilesToProcessingQueue,
      removeCommand,
      startProcessing,
      pauseProcessing,
      resumeProcessing,
      downloadFilePriority,
    }),
    [
      store.queue,
      store.isProcessing,
      // Note: store.getCompletedIdsAsSet() returns a new Set each time,
      // so we don't include it in dependencies to prevent unnecessary memoization updates
      addCommand,
      addFilesToProcessingQueue,
      removeCommand,
      startProcessing,
      pauseProcessing,
      resumeProcessing,
      downloadFilePriority,
    ]
  );

  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
