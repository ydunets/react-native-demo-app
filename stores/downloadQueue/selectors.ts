import type { DownloadQueueStore } from './types';

export const selectDownloadQueueActions = (state: DownloadQueueStore) => state.actions;

export const selectQueue = (state: DownloadQueueStore) => state.queue;

export const selectIsProcessing = (state: DownloadQueueStore) => state.isProcessing;

export const selectCompletedIds = (state: DownloadQueueStore) => state.completedIds;

export const selectPausedDueToStorage = (state: DownloadQueueStore) => state.pausedDueToStorage;

export const selectPausedDueToAuth = (state: DownloadQueueStore) => state.pausedDueToAuth;

/**
 * Returns completed IDs as a Set.
 * Creates a new Set on every call — use only with getState(), not as a reactive selector.
 */
export const selectCompletedIdsAsSet = (state: DownloadQueueStore) =>
  new Set(state.completedIds);

/** Curried selector: check if a specific ID is completed. */
export const selectIsCompleted = (id: string) => (state: DownloadQueueStore) =>
  state.completedIds.includes(id);
