/**
 * Download Queue State Management Store
 * Manages attachment download queue state with MMKV persistence
 *
 * Features:
 * - Queue state persisted to MMKV encrypted storage (survives app restarts)
 * - Tracks completed file IDs to prevent re-downloads
 * - Pause/resume state for network and storage interruptions
 * - FIFO processing with external pause flag support
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { envConfig } from '@/configs/env-config';

export interface DownloadCommand {
  id: string;
  attachmentId: string;
  filename: string;
  fileUrl: string;
  fileSizeBytes: number;
  messageId: string;
  timestamp: number;
}

interface DownloadQueueState {
  // State
  queue: DownloadCommand[];
  isProcessing: boolean;
  completedIds: string[]; // Stored as array for MMKV serialization, converted to Set for usage
  pausedDueToStorage: boolean;
  pausedDueToAuth: boolean;
  lastProcessedTimestamp: number;

  // Actions
  addCommand: (command: DownloadCommand) => void;
  removeCommand: (id: string) => void;
  startProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  resetQueue: () => void;
  markCompleted: (id: string) => void;
  setQueueFromArray: (queue: DownloadCommand[]) => void;

  // Helpers
  getCompletedIdsAsSet: () => Set<string>;
  isCompleted: (id: string) => boolean;
}

/**
 * MMKV storage instance for encrypted persistence
 */
const mmkvStorage = createMMKV({
  id: 'download-queue-storage',
  encryptionKey: envConfig.mmkvEncryptionKey,
});

/**
 * Storage adapter for Zustand persist with MMKV
 */
const mmkvStorageAdapter = createJSONStorage(() => ({
  getItem: (key: string) => {
    const value = mmkvStorage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    mmkvStorage.set(key, value);
  },
  removeItem: (key: string) => {
    mmkvStorage.remove(key);
  },
}));

/**
 * Zustand store for download queue state management
 * Persisted to MMKV for encrypted, durable storage
 */
export const useDownloadQueueStore = create<DownloadQueueState>()(
  persist(
    (set, get) => ({
      // Initial state
      queue: [],
      isProcessing: false,
      completedIds: [],
      pausedDueToStorage: false,
      pausedDueToAuth: false,
      lastProcessedTimestamp: 0,

      /**
       * Add a download command to the queue
       * Appends to end for FIFO processing
       */
      addCommand: (command: DownloadCommand) => {
        set((state) => {
          const newQueue = [...state.queue, command];
          return {
            queue: newQueue,
            lastProcessedTimestamp: Date.now(),
          };
        });
      },

      /**
       * Remove a download command from the queue by ID
       * Used for deduplication and user cancellation
       */
      removeCommand: (id: string) => {
        set((state) => {
          const newQueue = state.queue.filter((cmd) => cmd.id !== id);
          return {
            queue: newQueue,
            lastProcessedTimestamp: Date.now(),
          };
        });
      },

      /**
       * Start processing the queue
       * Resets pause flags and sets processing flag
       */
      startProcessing: () => {
        set({
          isProcessing: true,
          pausedDueToStorage: false,
          pausedDueToAuth: false,
          lastProcessedTimestamp: Date.now(),
        });
      },

      /**
       * Pause processing
       * Called when network disconnects or storage insufficient
       */
      pauseProcessing: () => {
        set({
          isProcessing: false,
          lastProcessedTimestamp: Date.now(),
        });
      },

      /**
       * Resume processing
       * Clears pause flags and resumes queue
       */
      resumeProcessing: () => {
        set({
          isProcessing: true,
          pausedDueToStorage: false,
          pausedDueToAuth: false,
          lastProcessedTimestamp: Date.now(),
        });
      },

      /**
       * Reset the entire queue
       * Clears queue, completed IDs, and state
       */
      resetQueue: () => {
        set({
          queue: [],
          isProcessing: false,
          completedIds: [],
          pausedDueToStorage: false,
          pausedDueToAuth: false,
          lastProcessedTimestamp: 0,
        });
      },

      /**
       * Mark a file as completed
       * Adds to completedIds to prevent re-downloads
       */
      markCompleted: (id: string) => {
        set((state) => {
          const completed = new Set(state.completedIds);
          completed.add(id);
          return {
            completedIds: Array.from(completed),
            lastProcessedTimestamp: Date.now(),
          };
        });
      },

      /**
       * Set queue from external array
       * Used for initialization and restoration from MMKV
       */
      setQueueFromArray: (queue: DownloadCommand[]) => {
        set({
          queue,
          lastProcessedTimestamp: Date.now(),
        });
      },

      /**
       * Get completed IDs as Set
       * Convenience method for checking completion
       */
      getCompletedIdsAsSet: () => {
        return new Set(get().completedIds);
      },

      /**
       * Check if a file ID is already completed
       * Used to skip re-downloads
       */
      isCompleted: (id: string) => {
        return get().completedIds.includes(id);
      },
    }),
    {
      name: 'download-queue-store', // Storage key in MMKV
      storage: mmkvStorageAdapter,
      // Partial persistence - only persist essential state
      partialize: (state) => ({
        queue: state.queue,
        completedIds: state.completedIds,
        lastProcessedTimestamp: state.lastProcessedTimestamp,
        pausedDueToStorage: state.pausedDueToStorage,
        pausedDueToAuth: state.pausedDueToAuth,
      }),
    }
  )
);
