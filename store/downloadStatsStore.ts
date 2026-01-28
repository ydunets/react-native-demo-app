/**
 * Download Statistics Store
 * Tracks statistics for attachment download operations
 *
 * Features:
 * - Tracks queued, skipped, and failed downloads
 * - Categorizes skips (completed, cached, oversize, missing URL)
 * - Reset capability for new sessions
 * - Non-persisted (session-only statistics)
 */

import { create } from 'zustand';

export interface DownloadStats {
  queuedCount: number;
  skippedCompleted: number;
  skippedCached: number;
  skippedOversize: number;
  skippedMissingUrl: number;
  downloadedCount: number;
  failedCount: number;
}

interface DownloadStatsState extends DownloadStats {
  // Actions
  incrementQueued: () => void;
  incrementSkippedCompleted: () => void;
  incrementSkippedCached: () => void;
  incrementSkippedOversize: () => void;
  incrementSkippedMissingUrl: () => void;
  incrementDownloaded: () => void;
  incrementFailed: () => void;
  resetStats: () => void;
  
  // Helpers
  getTotalProcessed: () => number;
  getTotalSkipped: () => number;
}

const initialStats: DownloadStats = {
  queuedCount: 0,
  skippedCompleted: 0,
  skippedCached: 0,
  skippedOversize: 0,
  skippedMissingUrl: 0,
  downloadedCount: 0,
  failedCount: 0,
};

export const useDownloadStatsStore = create<DownloadStatsState>((set, get) => ({
  ...initialStats,

  incrementQueued: () => set((state) => ({ queuedCount: state.queuedCount + 1 })),
  incrementSkippedCompleted: () =>
    set((state) => ({ skippedCompleted: state.skippedCompleted + 1 })),
  incrementSkippedCached: () => set((state) => ({ skippedCached: state.skippedCached + 1 })),
  incrementSkippedOversize: () =>
    set((state) => ({ skippedOversize: state.skippedOversize + 1 })),
  incrementSkippedMissingUrl: () =>
    set((state) => ({ skippedMissingUrl: state.skippedMissingUrl + 1 })),
  incrementDownloaded: () => set((state) => ({ downloadedCount: state.downloadedCount + 1 })),
  incrementFailed: () => set((state) => ({ failedCount: state.failedCount + 1 })),

  resetStats: () => set(initialStats),

  getTotalProcessed: () => {
    const state = get();
    return state.downloadedCount + state.failedCount + state.getTotalSkipped();
  },

  getTotalSkipped: () => {
    const state = get();
    return (
      state.skippedCompleted +
      state.skippedCached +
      state.skippedOversize +
      state.skippedMissingUrl
    );
  },
}));
