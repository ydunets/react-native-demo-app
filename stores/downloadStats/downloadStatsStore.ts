import { create } from 'zustand';
import type { DownloadStats, DownloadStatsStore } from './types';

const initialStats: DownloadStats = {
  queuedCount: 0,
  skippedCompleted: 0,
  skippedCached: 0,
  skippedOversize: 0,
  skippedMissingUrl: 0,
  downloadedCount: 0,
  failedCount: 0,
};

export const useDownloadStatsStore = create<DownloadStatsStore>((set) => ({
  ...initialStats,

  actions: {
    incrementQueued: () =>
      set((state) => ({ queuedCount: state.queuedCount + 1 })),
    incrementSkippedCompleted: () =>
      set((state) => ({ skippedCompleted: state.skippedCompleted + 1 })),
    incrementSkippedCached: () =>
      set((state) => ({ skippedCached: state.skippedCached + 1 })),
    incrementSkippedOversize: () =>
      set((state) => ({ skippedOversize: state.skippedOversize + 1 })),
    incrementSkippedMissingUrl: () =>
      set((state) => ({ skippedMissingUrl: state.skippedMissingUrl + 1 })),
    incrementDownloaded: () =>
      set((state) => ({ downloadedCount: state.downloadedCount + 1 })),
    incrementFailed: () =>
      set((state) => ({ failedCount: state.failedCount + 1 })),
    resetStats: () => set(initialStats),
  },
}));
