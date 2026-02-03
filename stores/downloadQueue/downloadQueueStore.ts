import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createMMKVStorageAdapter } from '../_shared/mmkvStorage';
import type { DownloadQueueStore, DownloadCommand } from './types';

const mmkvStorageAdapter = createMMKVStorageAdapter('download-queue-storage');

export const useDownloadQueueStore = create<DownloadQueueStore>()(
  persist(
    (set) => ({
      queue: [],
      isProcessing: false,
      completedIds: [],
      pausedDueToStorage: false,
      pausedDueToAuth: false,
      lastProcessedTimestamp: 0,

      actions: {
        addCommand: (command: DownloadCommand) => {
          set((state) => ({
            queue: [...state.queue, command],
            lastProcessedTimestamp: Date.now(),
          }));
        },

        removeCommand: (id: string) => {
          set((state) => ({
            queue: state.queue.filter((cmd) => cmd.id !== id),
            lastProcessedTimestamp: Date.now(),
          }));
        },

        startProcessing: () => {
          set({
            isProcessing: true,
            pausedDueToStorage: false,
            pausedDueToAuth: false,
            lastProcessedTimestamp: Date.now(),
          });
        },

        pauseProcessing: () => {
          set({
            isProcessing: false,
            lastProcessedTimestamp: Date.now(),
          });
        },

        resumeProcessing: () => {
          set({
            isProcessing: true,
            pausedDueToStorage: false,
            pausedDueToAuth: false,
            lastProcessedTimestamp: Date.now(),
          });
        },

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

        setQueueFromArray: (queue: DownloadCommand[]) => {
          set({
            queue,
            lastProcessedTimestamp: Date.now(),
          });
        },
      },
    }),
    {
      name: 'download-queue-store',
      storage: mmkvStorageAdapter,
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
