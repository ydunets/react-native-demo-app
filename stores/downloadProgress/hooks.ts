import { useDownloadProgressStore } from './downloadProgressStore';
import { selectTotalFiles, selectCurrentFile, selectRemainingFiles, selectCurrentFilename } from './selectors';

export const useTotalFiles = () => useDownloadProgressStore(selectTotalFiles);
export const useCurrentFile = () => useDownloadProgressStore(selectCurrentFile);
export const useRemainingFiles = () => useDownloadProgressStore(selectRemainingFiles);
export const useCurrentFilename = () => useDownloadProgressStore(selectCurrentFilename);