export interface DownloadProgressState {
  totalFiles: number;
  currentFile: number;
  remainingFiles: number;
  currentFilename: string;
}

export interface DownloadProgressActions {
  setProgress: (current: number, total: number, filename?: string) => void;
  setCurrentFilename: (filename: string) => void;
  resetProgress: () => void;
}

export type DownloadProgressStore = DownloadProgressState & { actions: DownloadProgressActions };
