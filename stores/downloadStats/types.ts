export interface DownloadStats {
  queuedCount: number;
  skippedCompleted: number;
  skippedCached: number;
  skippedOversize: number;
  skippedMissingUrl: number;
  downloadedCount: number;
  failedCount: number;
}

export interface DownloadStatsActions {
  incrementQueued: () => void;
  incrementSkippedCompleted: () => void;
  incrementSkippedCached: () => void;
  incrementSkippedOversize: () => void;
  incrementSkippedMissingUrl: () => void;
  incrementDownloaded: () => void;
  incrementFailed: () => void;
  resetStats: () => void;
}

export type DownloadStatsStore = DownloadStats & { actions: DownloadStatsActions };
