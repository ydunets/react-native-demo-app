import type { DownloadStatsStore } from './types';

export const selectDownloadStatsActions = (state: DownloadStatsStore) => state.actions;

export const selectTotalSkipped = (state: DownloadStatsStore) =>
  state.skippedCompleted +
  state.skippedCached +
  state.skippedOversize +
  state.skippedMissingUrl;

export const selectTotalProcessed = (state: DownloadStatsStore) =>
  state.downloadedCount + state.failedCount + selectTotalSkipped(state);

export const selectQueuedCount = (state: DownloadStatsStore) => state.queuedCount;

export const selectDownloadedCount = (state: DownloadStatsStore) => state.downloadedCount;

export const selectFailedCount = (state: DownloadStatsStore) => state.failedCount;
