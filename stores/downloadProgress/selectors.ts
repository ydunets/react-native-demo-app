import { DownloadProgressStore } from './types';

export const selectTotalFiles = (state: DownloadProgressStore) => state.totalFiles;
export const selectCurrentFile = (state: DownloadProgressStore) => state.currentFile;
export const selectRemainingFiles = (state: DownloadProgressStore) => state.remainingFiles;
export const selectActions = (state: DownloadProgressStore) => state.actions;
