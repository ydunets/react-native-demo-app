export interface DownloadProgressState {
  totalFiles: number;
  currentFile: number;
  remainingFiles: number;
}

export interface DownloadProgressActions {
  setProgress: (current: number, total: number) => void;
  resetProgress: () => void;
}

export type DownloadProgressStore = DownloadProgressState & { actions: DownloadProgressActions };
