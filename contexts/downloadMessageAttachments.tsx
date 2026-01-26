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

import React, { createContext, useCallback, useRef, useEffect } from 'react';
import { useDownloadQueueStore } from '@/store/downloadQueueStore';

export interface DownloadCommand {
  id: string;
  attachmentId: string;
  filename: string;
  fileUrl: string;
  fileSizeBytes: number;
  messageId: string;
  timestamp: number;
}

export interface DownloadContextType {
  queue: DownloadCommand[];
  isProcessing: boolean;
  completedIds: Set<string>;
  addCommand: (command: DownloadCommand) => void;
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
export const DownloadMessageAttachmentsProvider: React.FC<DownloadMessageAttachmentsProviderProps> = ({
  children,
}) => {
  const store = useDownloadQueueStore();

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

  /**
   * Remove a download command from the queue by ID
   */
  const removeCommand = useCallback(
    (id: string) => {
      store.removeCommand(id);
    },
    [store]
  );

  /**
   * Start processing the download queue
   */
  const startProcessing = useCallback(() => {
    store.startProcessing();
    pauseFlagRef.current.isPaused = false;
  }, [store]);

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
  }, [store]);

  /**
   * Download a file with priority (interrupts background queue)
   * Placeholder implementation - will be expanded in T031
   */
  const downloadFilePriority = useCallback(
    async (command: DownloadCommand): Promise<boolean> => {
      try {
        // TODO: Implement priority download logic in T031
        // 1. Pause background processing
        // 2. Download file via react-native-blob-util
        // 3. Mark as completed
        // 4. Resume background processing
        console.warn(
          '[DownloadContext] downloadFilePriority not yet implemented',
          command.filename
        );
        return false;
      } catch (error) {
        console.error('[DownloadContext] Priority download failed:', error);
        return false;
      }
    },
    []
  );

  // Initialize queue processing on provider mount
  useEffect(() => {
    const initializeQueue = async () => {
      // TODO: Initialize queue from MMKV persistence
      // - Restore completed IDs
      // - Start processing if queue not empty
      console.log(
        '[DownloadContext] Queue initialized',
        'pending:',
        store.queue.length,
        'completed:',
        store.completedIds.size
      );
    };

    initializeQueue();
  }, [store]);

  const value: DownloadContextType = {
    queue: store.queue,
    isProcessing: store.isProcessing,
    completedIds: store.completedIds,
    addCommand,
    removeCommand,
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    downloadFilePriority,
  };

  return (
    <DownloadMessageAttachmentsContext.Provider value={value}>
      {children}
    </DownloadMessageAttachmentsContext.Provider>
  );
};
